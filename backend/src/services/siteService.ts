import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError, UnauthorizedError } from '../utils/errors.js';
import subscriptionService from './subscriptionService.js';

interface CreateSiteData {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  description?: string;
  requirements?: string;
}

interface UpdateSiteData extends Partial<CreateSiteData> {
  isActive?: boolean;
}

const DEFAULT_SITE_RADIUS_METERS = 100;
const MIN_SITE_RADIUS_METERS = 20;
const MAX_SITE_RADIUS_METERS = 2000;

export class SiteService {
  private sanitizeRadius(radiusMeters?: number): number {
    const radius = Number.isFinite(radiusMeters) ? Math.round(radiusMeters as number) : DEFAULT_SITE_RADIUS_METERS;
    return Math.min(MAX_SITE_RADIUS_METERS, Math.max(MIN_SITE_RADIUS_METERS, radius));
  }

  // Create a new site for a client
  async createSite(clientId: string, data: CreateSiteData) {
    try {
      // Verify client exists
      const client = await prisma.client.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        throw new NotFoundError('Client not found');
      }

      // Get all companies this client belongs to
      const companyClients = await prisma.companyClient.findMany({
        where: {
          clientId,
          isActive: true,
        },
        select: {
          securityCompanyId: true,
        },
      });

      if (companyClients.length === 0) {
        throw new ValidationError('Client is not linked to a security company');
      }

      for (const companyClient of companyClients) {
        await subscriptionService.validateSiteLimit(companyClient.securityCompanyId);
      }

      // Create site and link to all companies the client belongs to
      const site = await prisma.$transaction(async (tx) => {
        const newSite = await tx.site.create({
          data: {
            clientId,
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
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        });

        // Link site to all companies the client belongs to
        if (companyClients.length > 0) {
          await Promise.all(
            companyClients.map((companyClient) =>
              tx.companySite.create({
                data: {
                  securityCompanyId: companyClient.securityCompanyId,
                  siteId: newSite.id,
                },
              })
            )
          );
        }

        return newSite;
      });

      logger.info(`Site created: ${site.name} for client ${clientId}, linked to ${companyClients.length} company(ies)`);
      return site;
    } catch (error) {
      logger.error('Error creating site:', error);
      throw error;
    }
  }

  // Get all sites for a client
  async getClientSites(clientId: string, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [sites, total] = await Promise.all([
        prisma.site.findMany({
          where: { clientId },
          include: {
            shifts: {
              where: {
                status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
              },
              include: {
                guard: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true, email: true }
                    }
                  }
                }
              },
              orderBy: { scheduledStartTime: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.site.count({ where: { clientId } })
      ]);

      return {
        sites,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching client sites:', error);
      throw error;
    }
  }

  // Get site by ID with authorization check
  async getSiteById(
    siteId: string,
    userId: string,
    userRole: string,
    securityCompanyId?: string,
    guardId?: string
  ) {
    try {
      const site = await prisma.site.findUnique({
        where: { id: siteId },
        include: {
          client: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      });

      if (!site) {
        throw new NotFoundError('Site not found');
      }

      if (userRole === 'CLIENT') {
        if (site.client.user.id !== userId) {
          throw new UnauthorizedError('Access denied');
        }
      } else if (userRole === 'ADMIN') {
        if (!securityCompanyId) {
          throw new UnauthorizedError('Access denied');
        }
        const companySite = await prisma.companySite.findFirst({
          where: { siteId, securityCompanyId },
        });
        if (!companySite) {
          throw new UnauthorizedError('Access denied');
        }
      } else if (userRole === 'GUARD') {
        if (!guardId) {
          throw new UnauthorizedError('Access denied');
        }
        const assignedShift = await prisma.shift.findFirst({
          where: {
            siteId,
            guardId,
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          },
        });
        if (!assignedShift) {
          throw new UnauthorizedError('Access denied');
        }
      } else if (userRole !== 'SUPER_ADMIN') {
        throw new UnauthorizedError('Access denied');
      }

      return site;
    } catch (error) {
      logger.error('Error fetching site:', error);
      throw error;
    }
  }

  // Update site
  async updateSite(siteId: string, clientId: string, data: UpdateSiteData) {
    try {
      // Verify site belongs to client
      const existingSite = await prisma.site.findFirst({
        where: { id: siteId, clientId }
      });

      if (!existingSite) {
        throw new NotFoundError('Site not found or access denied');
      }

      const updatedSite = await prisma.site.update({
        where: { id: siteId },
        data: {
          ...data,
          ...(data.radiusMeters !== undefined
            ? { radiusMeters: this.sanitizeRadius(data.radiusMeters) }
            : {}),
        },
        include: {
          client: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      });

      logger.info(`Site updated: ${siteId}`);
      return updatedSite;
    } catch (error) {
      logger.error('Error updating site:', error);
      throw error;
    }
  }

  // Delete site
  async deleteSite(siteId: string, clientId: string) {
    try {
      // Check if site has active shifts (Option B)
      const activeShifts = await prisma.shift.count({
        where: {
          siteId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
        }
      });

      if (activeShifts > 0) {
        throw new ValidationError('Cannot delete site with active shifts');
      }

      // Verify site belongs to client
      const site = await prisma.site.findFirst({
        where: { id: siteId, clientId }
      });

      if (!site) {
        throw new NotFoundError('Site not found or access denied');
      }

      await prisma.site.delete({
        where: { id: siteId }
      });

      logger.info(`Site deleted: ${siteId}`);
      return { message: 'Site deleted successfully' };
    } catch (error) {
      logger.error('Error deleting site:', error);
      throw error;
    }
  }

  // Get active sites for guards within their security company
  async getAllActiveSites(
    page = 1,
    limit = 10,
    search?: string,
    securityCompanyId?: string
  ) {
    try {
      const skip = (page - 1) * limit;

      const whereClause: any = {
        isActive: true,
        shifts: {
          some: {
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          },
        },
      };

      if (securityCompanyId) {
        whereClause.companySites = {
          some: { securityCompanyId },
        };
      }

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [sites, total] = await Promise.all([
        prisma.site.findMany({
          where: whereClause,
          include: {
            client: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true }
                }
              }
            },
            shifts: {
              where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
              select: { id: true, scheduledStartTime: true, scheduledEndTime: true, status: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.site.count({ where: whereClause })
      ]);

      return {
        sites,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching active sites:', error);
      throw error;
    }
  }
}

export default new SiteService();
