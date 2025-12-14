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
  description?: string;
  requirements?: string;
}

interface AdminSiteUpdateData extends Partial<AdminSiteCreateData> {
  isActive?: boolean;
}

export class AdminSiteService {
  async getSites(filters: AdminSiteFilter, securityCompanyId?: string) {
    const { page = 1, limit = 20, clientId, isActive, search } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Multi-tenant: Filter by company
    // Sites can be linked to companies in two ways:
    // 1. Directly via CompanySite (if site was assigned to company)
    // 2. Indirectly via Client -> CompanyClient (site's client belongs to company)
    if (securityCompanyId) {
      where.OR = [
        // Direct link via CompanySite
        {
          companySites: {
            some: {
              securityCompanyId,
              isActive: true,
            },
          },
        },
        // Indirect link via Client -> CompanyClient
        {
          client: {
            companyClients: {
              some: {
                securityCompanyId,
                isActive: true,
              },
            },
          },
        },
      ];
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

  async updateSite(siteId: string, data: AdminSiteUpdateData) {
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    if (data.clientId) {
      const client = await prisma.client.findUnique({ where: { id: data.clientId } });
      if (!client) {
        throw new NotFoundError('Client not found');
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

  async deleteSite(siteId: string) {
    const activeShifts = await prisma.shift.count({
      where: {
        siteId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
    });

    if (activeShifts > 0) {
      throw new ValidationError('Cannot delete site with active assignments');
    }

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    await prisma.site.delete({ where: { id: siteId } });
    logger.info(`Admin deleted site ${siteId}`);

    return { message: 'Site deleted successfully' };
  }
}

export default new AdminSiteService();
