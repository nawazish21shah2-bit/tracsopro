import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError, UnauthorizedError } from '../utils/errors.js';

interface CreateShiftPostingData {
  siteId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  hourlyRate?: number;
  requirements?: string;
  maxGuards?: number;
}

interface UpdateShiftPostingData extends Partial<CreateShiftPostingData> {
  status?: 'OPEN' | 'FILLED' | 'CANCELLED' | 'COMPLETED';
}

export class ShiftPostingService {
  // Create a new shift posting
  async createShiftPosting(clientId: string, data: CreateShiftPostingData) {
    try {
      // Verify site belongs to client
      const site = await prisma.site.findFirst({
        where: { id: data.siteId, clientId }
      });

      if (!site) {
        throw new NotFoundError('Site not found or access denied');
      }

      // Validate dates
      if (data.startTime >= data.endTime) {
        throw new ValidationError('Start time must be before end time');
      }

      if (data.startTime <= new Date()) {
        throw new ValidationError('Start time must be in the future');
      }

      const shiftPosting = await prisma.shiftPosting.create({
        data: {
          clientId,
          siteId: data.siteId,
          title: data.title,
          description: data.description,
          startTime: data.startTime,
          endTime: data.endTime,
          hourlyRate: data.hourlyRate,
          requirements: data.requirements,
          maxGuards: data.maxGuards || 1,
        },
        include: {
          site: true,
          client: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      });

      logger.info(`Shift posting created: ${shiftPosting.title} for site ${data.siteId}`);
      return shiftPosting;
    } catch (error) {
      logger.error('Error creating shift posting:', error);
      throw error;
    }
  }

  // Get all shift postings for a client
  async getClientShiftPostings(clientId: string, page = 1, limit = 10, status?: string) {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { clientId };
      if (status) {
        whereClause.status = status;
      }

      const [shiftPostings, total] = await Promise.all([
        prisma.shiftPosting.findMany({
          where: whereClause,
          include: {
            site: true,
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
            },
            assignments: {
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
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.shiftPosting.count({ where: whereClause })
      ]);

      return {
        shiftPostings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching client shift postings:', error);
      throw error;
    }
  }

  // Get available shift postings for guards
  async getAvailableShiftPostings(page = 1, limit = 10, search?: string) {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = {
        status: 'OPEN',
        startTime: { gt: new Date() } // Only future shifts
      };

      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { site: { name: { contains: search, mode: 'insensitive' } } },
          { site: { address: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const [shiftPostings, total] = await Promise.all([
        prisma.shiftPosting.findMany({
          where: whereClause,
          include: {
            site: true,
            client: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true }
                }
              }
            },
            applications: {
              select: { id: true, status: true }
            }
          },
          orderBy: { startTime: 'asc' },
          skip,
          take: limit
        }),
        prisma.shiftPosting.count({ where: whereClause })
      ]);

      return {
        shiftPostings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error fetching available shift postings:', error);
      throw error;
    }
  }

  // Apply for a shift posting
  async applyForShift(shiftPostingId: string, guardId: string, message?: string) {
    try {
      // Check if shift posting exists and is open
      const shiftPosting = await prisma.shiftPosting.findUnique({
        where: { id: shiftPostingId },
        include: {
          applications: true,
          assignments: true
        }
      });

      if (!shiftPosting) {
        throw new NotFoundError('Shift posting not found');
      }

      if (shiftPosting.status !== 'OPEN') {
        throw new ValidationError('Shift posting is not open for applications');
      }

      if (shiftPosting.startTime <= new Date()) {
        throw new ValidationError('Cannot apply for past shifts');
      }

      // Check if guard already applied
      const existingApplication = await prisma.shiftApplication.findUnique({
        where: {
          shiftPostingId_guardId: {
            shiftPostingId,
            guardId
          }
        }
      });

      if (existingApplication) {
        throw new ValidationError('You have already applied for this shift');
      }

      // Check if shift is already filled
      const approvedApplications = shiftPosting.applications.filter(app => app.status === 'APPROVED').length;
      if (approvedApplications >= shiftPosting.maxGuards) {
        throw new ValidationError('This shift is already filled');
      }

      const application = await prisma.shiftApplication.create({
        data: {
          shiftPostingId,
          guardId,
          message,
        },
        include: {
          shiftPosting: {
            include: {
              site: true,
              client: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true, email: true }
                  }
                }
              }
            }
          },
          guard: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      });

      logger.info(`Shift application created: Guard ${guardId} applied for shift ${shiftPostingId}`);
      return application;
    } catch (error) {
      logger.error('Error applying for shift:', error);
      throw error;
    }
  }

  // Review shift application (approve/reject)
  async reviewApplication(applicationId: string, clientId: string, status: 'APPROVED' | 'REJECTED') {
    try {
      // Verify application belongs to client
      const application = await prisma.shiftApplication.findUnique({
        where: { id: applicationId },
        include: {
          shiftPosting: {
            include: { site: true }
          },
          guard: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      });

      if (!application) {
        throw new NotFoundError('Application not found');
      }

      if (application.shiftPosting.clientId !== clientId) {
        throw new UnauthorizedError('Access denied');
      }

      if (application.status !== 'PENDING') {
        throw new ValidationError('Application has already been reviewed');
      }

      // If approving, check if shift is already filled
      if (status === 'APPROVED') {
        const approvedCount = await prisma.shiftApplication.count({
          where: {
            shiftPostingId: application.shiftPostingId,
            status: 'APPROVED'
          }
        });

        if (approvedCount >= application.shiftPosting.maxGuards) {
          throw new ValidationError('This shift is already filled');
        }
      }

      const updatedApplication = await prisma.$transaction(async (tx) => {
        // Update application status
        const updated = await tx.shiftApplication.update({
          where: { id: applicationId },
          data: {
            status,
            reviewedAt: new Date()
          },
          include: {
            shiftPosting: {
              include: { site: true }
            },
            guard: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true }
                }
              }
            }
          }
        });

        // If approved, create shift assignment
        if (status === 'APPROVED') {
          await tx.shiftAssignment.create({
            data: {
              shiftPostingId: application.shiftPostingId,
              siteId: application.shiftPosting.siteId,
              guardId: application.guardId,
              startTime: application.shiftPosting.startTime,
              endTime: application.shiftPosting.endTime,
            }
          });

          // Check if shift is now filled
          const totalApproved = await tx.shiftApplication.count({
            where: {
              shiftPostingId: application.shiftPostingId,
              status: 'APPROVED'
            }
          });

          if (totalApproved >= application.shiftPosting.maxGuards) {
            await tx.shiftPosting.update({
              where: { id: application.shiftPostingId },
              data: { status: 'FILLED' }
            });
          }
        }

        return updated;
      });

      logger.info(`Application ${status.toLowerCase()}: ${applicationId}`);
      return updatedApplication;
    } catch (error) {
      logger.error('Error reviewing application:', error);
      throw error;
    }
  }

  // Get applications for a shift posting
  async getShiftApplications(shiftPostingId: string, clientId: string) {
    try {
      // Verify shift posting belongs to client
      const shiftPosting = await prisma.shiftPosting.findFirst({
        where: { id: shiftPostingId, clientId }
      });

      if (!shiftPosting) {
        throw new NotFoundError('Shift posting not found or access denied');
      }

      const applications = await prisma.shiftApplication.findMany({
        where: { shiftPostingId },
        include: {
          guard: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true, phone: true }
              },
              qualifications: true,
              performanceMetrics: {
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          }
        },
        orderBy: { appliedAt: 'asc' }
      });

      return applications;
    } catch (error) {
      logger.error('Error fetching shift applications:', error);
      throw error;
    }
  }

  // Update shift posting
  async updateShiftPosting(shiftPostingId: string, clientId: string, data: UpdateShiftPostingData) {
    try {
      // Verify shift posting belongs to client
      const existingPosting = await prisma.shiftPosting.findFirst({
        where: { id: shiftPostingId, clientId }
      });

      if (!existingPosting) {
        throw new NotFoundError('Shift posting not found or access denied');
      }

      // Validate dates if provided
      if (data.startTime && data.endTime && data.startTime >= data.endTime) {
        throw new ValidationError('Start time must be before end time');
      }

      const updatedPosting = await prisma.shiftPosting.update({
        where: { id: shiftPostingId },
        data,
        include: {
          site: true,
          client: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true }
              }
            }
          }
        }
      });

      logger.info(`Shift posting updated: ${shiftPostingId}`);
      return updatedPosting;
    } catch (error) {
      logger.error('Error updating shift posting:', error);
      throw error;
    }
  }
}

export default new ShiftPostingService();
