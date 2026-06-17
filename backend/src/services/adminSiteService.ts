import prisma from '../config/database.js';
import subscriptionService from './subscriptionService.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

interface AdminSiteFilter {
  page?: number;
  limit?: number;
  clientId?: string;
  isActive?: boolean;
  search?: string;
}

interface AdminSiteCreateData {
  clientId: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  description?: string;
  requirements?: string;
}

interface AdminSiteUpdateData extends Partial<AdminSiteCreateData> {
  isActive?: boolean;
}

const DEFAULT_SITE_RADIUS_METERS = 100;
const MIN_SITE_RADIUS_METERS = 20;
const MAX_SITE_RADIUS_METERS = 2000;

export class AdminSiteService {
  private sanitizeRadius(radiusMeters?: number): number {
    const radius = Number.isFinite(radiusMeters) ? Math.round(radiusMeters as number) : DEFAULT_SITE_RADIUS_METERS;
    return Math.min(MAX_SITE_RADIUS_METERS, Math.max(MIN_SITE_RADIUS_METERS, radius));
  }

  async getSites(filters: AdminSiteFilter, securityCompanyId?: string) {
    const { page = 1, limit = 20, clientId, isActive, search } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Multi-tenant: Filter by company
    if (securityCompanyId) {
      where.companySites = {
        some: {
          securityCompanyId,
        },
      };
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        where,
        include: {
          client: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
          shifts: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.site.count({ where }),
    ]);

    return {
      sites,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async createSite(data: AdminSiteCreateData, securityCompanyId: string) {
    // Free tier check
    await subscriptionService.validateSiteLimit(securityCompanyId);

    // Verify client belongs to company
    const companyClient = await prisma.companyClient.findFirst({
      where: {
        clientId: data.clientId,
        securityCompanyId,
        isActive: true,
      },
    });

    if (!companyClient) {
      throw new ValidationError('Client not found or does not belong to your company');
    }

    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    // Create site and link to company
    const site = await prisma.$transaction(async (tx) => {
      const newSite = await tx.site.create({
        data: {
          clientId: data.clientId,
          name: data.name,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          radiusMeters: this.sanitizeRadius(data.radiusMeters),
          description: data.description,
          requirements: data.requirements,
        },
        include: {
          client: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      });

      // Link site to company
      await tx.companySite.create({
        data: {
          securityCompanyId,
          siteId: newSite.id,
        },
      });

      return newSite;
    });

    logger.info(`Admin created site ${site.id} for client ${data.clientId} in company ${securityCompanyId}`);
    return site;
  }

  async updateSite(siteId: string, data: AdminSiteUpdateData, securityCompanyId?: string) {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: { companySites: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    if (securityCompanyId) {
      const belongsToCompany = site.companySites.some(
        (companySite) => companySite.securityCompanyId === securityCompanyId,
      );
      if (!belongsToCompany) {
        throw new ValidationError('Site does not belong to your company');
      }
    }

    if (data.clientId) {
      const client = await prisma.client.findUnique({ where: { id: data.clientId } });
      if (!client) {
        throw new NotFoundError('Client not found');
      }

      if (securityCompanyId) {
        const companyClient = await prisma.companyClient.findFirst({
          where: {
            clientId: data.clientId,
            securityCompanyId,
            isActive: true,
          },
        });
        if (!companyClient) {
          throw new ValidationError('Client does not belong to your company');
        }
      }
    }

    const updated = await prisma.site.update({
      where: { id: siteId },
      data: {
        clientId: data.clientId ?? site.clientId,
        name: data.name ?? site.name,
        address: data.address ?? site.address,
        latitude: data.latitude ?? site.latitude,
        longitude: data.longitude ?? site.longitude,
        radiusMeters:
          data.radiusMeters !== undefined
            ? this.sanitizeRadius(data.radiusMeters)
            : site.radiusMeters,
        description: data.description ?? site.description,
        requirements: data.requirements ?? site.requirements,
        isActive: typeof data.isActive === 'boolean' ? data.isActive : site.isActive,
      },
      include: {
        client: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    logger.info(`Admin updated site ${siteId}`);
    return updated;
  }

  async deleteSite(siteId: string, securityCompanyId?: string) {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: { companySites: true },
    });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    if (securityCompanyId) {
      const belongsToCompany = site.companySites.some(
        (companySite) => companySite.securityCompanyId === securityCompanyId,
      );
      if (!belongsToCompany) {
        throw new ValidationError('Site does not belong to your company');
      }
    }

    const activeShifts = await prisma.shift.count({
      where: {
        siteId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
    });

    if (activeShifts > 0) {
      throw new ValidationError('Cannot delete site with active assignments');
    }

    await prisma.site.delete({ where: { id: siteId } });
    logger.info(`Admin deleted site ${siteId}`);

    return { message: 'Site deleted successfully' };
  }
}

export default new AdminSiteService();
