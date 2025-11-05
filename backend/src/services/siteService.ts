import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError, UnauthorizedError } from '../utils/errors.js';

interface CreateSiteData {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  requirements?: string;
}

interface UpdateSiteData extends Partial<CreateSiteData> {
  isActive?: boolean;
}

export class SiteService {
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

      const site = await prisma.site.create({
        data: {
          clientId,
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

      logger.info(`Site created: ${site.name} for client ${clientId}`);
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
            shiftPostings: {
              where: { status: 'OPEN' },
              select: { id: true, title: true, startTime: true, endTime: true }
            },
            shiftAssignments: {
              where: { 
                status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
              },
              include: {
                guard: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true }
                    }
                  }
                }
              }
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
  async getSiteById(siteId: string, userId: string, userRole: string) {
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
          },
          shiftPostings: {
            include: {
              applications: {
                include: {
                  guard: {
                    include: {
                      user: {
                        select: { firstName: true, lastName: true, email: true }
                      }
                    }
                  }
                }
              }
            }
          },
          shiftAssignments: {
            include: {
              guard: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true, email: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!site) {
        throw new NotFoundError('Site not found');
      }

      // Authorization check
      if (userRole !== 'ADMIN' && site.client.user.id !== userId) {
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
        data,
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
      // Check if site has active assignments
      const activeAssignments = await prisma.shiftAssignment.count({
        where: {
          siteId,
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
        }
      });

      if (activeAssignments > 0) {
        throw new ValidationError('Cannot delete site with active assignments');
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

  // Get all sites (for guards to browse available shifts)
  async getAllActiveSites(page = 1, limit = 10, search?: string) {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = {
        isActive: true,
        shiftPostings: {
          some: {
            status: 'OPEN'
          }
        }
      };

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
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
            shiftPostings: {
              where: { status: 'OPEN' },
              include: {
                applications: {
                  select: { id: true, status: true }
                }
              }
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
