import prisma from '../config/database.js';
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
  async getSites(filters: AdminSiteFilter) {
    const { page = 1, limit = 20, clientId, isActive, search } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

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
          shiftAssignments: true,
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

  async createSite(data: AdminSiteCreateData) {
    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const site = await prisma.site.create({
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

    logger.info(`Admin created site ${site.id} for client ${data.clientId}`);
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
    const activeAssignments = await prisma.shiftAssignment.count({
      where: {
        siteId,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
    });

    if (activeAssignments > 0) {
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
