import prisma from '../config/database.js';
import { NotFoundError, ValidationError, UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

interface ClientProfileUpdateData {
  // Individual account fields
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  
  // Company account fields
  companyName?: string;
  companyRegistrationNumber?: string;
  taxId?: string;
  website?: string;
}

export class ClientService {
  async getAllClients(page: number = 1, limit: number = 50, accountType?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (accountType) {
      where.accountType = accountType;
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.client.count({ where }),
    ]);

    return {
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getClientById(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    return client;
  }

  async getClientByUserId(userId: string) {
    const client = await prisma.client.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client profile not found');
    }

    return client;
  }

  async updateClientProfile(userId: string, data: ClientProfileUpdateData) {
    // Find the client by userId
    const client = await prisma.client.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            accountType: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client profile not found');
    }

    // Validate required fields based on account type
    if (client.accountType === 'COMPANY') {
      if (!data.companyName) {
        throw new ValidationError('Company name is required for company accounts');
      }
      if (!data.companyRegistrationNumber) {
        throw new ValidationError('Company registration number is required for company accounts');
      }
    }

    const updated = await prisma.client.update({
      where: { userId },
      data: {
        companyName: data.companyName,
        companyRegistrationNumber: data.companyRegistrationNumber,
        taxId: data.taxId,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country || 'United States',
        website: data.website,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            accountType: true,
          },
        },
      },
    });

    logger.info(`Client profile updated: ${updated.user.email}, ID: ${updated.id}, Type: ${updated.accountType}`);
    return updated;
  }

  async updateClient(id: string, data: any) {
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        companyName: data.companyName,
        companyRegistrationNumber: data.companyRegistrationNumber,
        taxId: data.taxId,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        website: data.website,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    logger.info(`Client updated: ${updated.user.email}, ID: ${updated.id}`);
    return updated;
  }

  async deleteClient(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    await prisma.client.delete({
      where: { id },
    });

    logger.info(`Client deleted: ID: ${id}`);
    return { message: 'Client deleted successfully' };
  }

  async getClientStats() {
    const [totalClients, individualClients, companyClients, activeClients] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { accountType: 'INDIVIDUAL' } }),
      prisma.client.count({ where: { accountType: 'COMPANY' } }),
      prisma.client.count({
        where: {
          user: {
            isActive: true,
          },
        },
      }),
    ]);

    return {
      total: totalClients,
      individual: individualClients,
      company: companyClients,
      active: activeClients,
      inactive: totalClients - activeClients,
    };
  }

  async getDashboardStats(clientId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get guards on duty (shifts in progress today)
      const guardsOnDuty = await prisma.shift.count({
        where: {
          clientId,
          status: 'IN_PROGRESS',
          scheduledStartTime: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      // Get missed shifts (no-show shifts today)
      const missedShifts = await prisma.shift.count({
        where: {
          clientId,
          status: 'NO_SHOW',
          scheduledStartTime: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      // Get active sites (sites with active assignments)
      const activeSites = await prisma.site.count({
        where: {
          clientId,
          shiftAssignments: {
            some: {
              status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
            }
          }
        },
      });

      // Get new reports (reports from last 24 hours)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const clientSites = await prisma.site.findMany({
        where: { clientId },
        select: { id: true }
      });
      const siteIds = clientSites.map(site => site.id);
      
      const assignments = await prisma.shiftAssignment.findMany({
        where: {
          siteId: { in: siteIds }
        },
        select: { id: true }
      });
      const assignmentIds = assignments.map(a => a.id);

      const newReports = await prisma.shiftReport.count({
        where: {
          shiftId: { in: assignmentIds },
          submittedAt: {
            gte: yesterday,
          },
        },
      });

      const stats = {
        guardsOnDuty,
        missedShifts,
        activeSites,
        newReports,
      };

      logger.info(`Dashboard stats requested for client: ${clientId}`, stats);
      return stats;
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getClientGuards(clientId: string, page: number = 1, limit: number = 50) {
    try {
      const skip = (page - 1) * limit;
      
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch today's shifts for this client
      const [shifts, total] = await Promise.all([
        prisma.shift.findMany({
          where: {
            clientId,
            scheduledStartTime: {
              gte: today,
              lt: tomorrow,
            },
          },
          include: {
            guard: {
              select: {
                id: true,
                profilePictureUrl: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
                trackingRecords: {
                  where: {
                    timestamp: {
                      gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
                    },
                  },
                  orderBy: {
                    timestamp: 'desc',
                  },
                  take: 1,
                },
              },
            },
            site: {
              select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
              },
            },
          },
          orderBy: {
            scheduledStartTime: 'asc',
          },
          skip,
          take: limit,
        }),
        prisma.shift.count({
          where: {
            clientId,
            scheduledStartTime: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),
      ]);

      // Transform shifts to guard data format
      const guards = shifts.map((shift) => {
        const guardUser = shift.guard.user;
        const guardName = `${guardUser.firstName} ${guardUser.lastName}`;
        
        // Format shift time
        const formatTime = (date: Date) => {
          const hours = date.getHours();
          const minutes = date.getMinutes();
          const ampm = hours >= 12 ? 'Pm' : 'Am';
          const displayHours = hours % 12 || 12;
          return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        };

        const shiftTime = `${formatTime(shift.scheduledStartTime)} - ${formatTime(shift.scheduledEndTime)}`;

        // Map shift status to guard status
        let status: 'Active' | 'Upcoming' | 'Missed' | 'Completed' = 'Upcoming';
        if (shift.status === 'IN_PROGRESS') {
          status = 'Active';
        } else if (shift.status === 'COMPLETED') {
          status = 'Completed';
        } else if (shift.status === 'NO_SHOW') {
          status = 'Missed';
        } else if (shift.status === 'SCHEDULED') {
          const now = new Date();
          if (shift.scheduledStartTime <= now && shift.scheduledEndTime >= now) {
            status = 'Active';
          } else if (shift.scheduledStartTime > now) {
            status = 'Upcoming';
          }
        }

        // Get guard's latest location if active
        const latestLocation = shift.guard.trackingRecords?.[0];
        const guardLatitude = latestLocation?.latitude;
        const guardLongitude = latestLocation?.longitude;

        return {
          id: shift.guard.id,
          name: guardName,
          avatar: shift.guard.profilePictureUrl || undefined,
          site: shift.site?.name || shift.locationName || 'N/A',
          siteAddress: shift.site?.address || shift.locationAddress || 'N/A',
          siteLatitude: shift.site?.latitude || undefined,
          siteLongitude: shift.site?.longitude || undefined,
          guardLatitude: status === 'Active' && guardLatitude ? guardLatitude : undefined,
          guardLongitude: status === 'Active' && guardLongitude ? guardLongitude : undefined,
          shiftTime,
          status,
          checkInTime: shift.actualStartTime ? shift.actualStartTime.toISOString() : undefined,
          checkOutTime: shift.actualEndTime ? shift.actualEndTime.toISOString() : undefined,
          description: shift.description || undefined,
          startTime: shift.scheduledStartTime.toISOString(),
          endTime: shift.scheduledEndTime.toISOString(),
        };
      });

      logger.info(`Guards list requested for client: ${clientId}, found ${guards.length} shifts`);
      return {
        guards,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching client guards:', error);
      throw error;
    }
  }

  async getClientReports(clientId: string, page: number = 1, limit: number = 50) {
    try {
      const skip = (page - 1) * limit;

      // Get assignment reports for client's sites using AssignmentReport model
      const [reports, total] = await Promise.all([
        prisma.assignmentReport.findMany({
          where: {
            shiftAssignment: {
              shiftPosting: {
                clientId: clientId
              }
            }
          },
          include: {
            shiftAssignment: {
              include: {
                shiftPosting: {
                  include: {
                    site: {
                      select: { name: true, address: true }
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
          },
          orderBy: { submittedAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.assignmentReport.count({
          where: {
            shiftAssignment: {
              shiftPosting: {
                clientId: clientId
              }
            }
          }
        })
      ]);

      // Transform reports to match frontend format
      const transformedReports = reports.map((report) => {
        const guardUser = report.guard?.user;
        const guardName = guardUser 
          ? `${guardUser.firstName} ${guardUser.lastName}`
          : 'Unknown Guard';
        
        // Map report type from AssignmentReportType
        let type: 'Medical Emergency' | 'Incident' | 'Violation' | 'Maintenance' = 'Incident';
        switch (report.type) {
          case 'MEDICAL_EMERGENCY':
            type = 'Medical Emergency';
            break;
          case 'INCIDENT':
          case 'SECURITY_BREACH':
            type = 'Incident';
            break;
          case 'MAINTENANCE':
            type = 'Maintenance';
            break;
          default:
            type = 'Incident';
        }

        // Map status based on report status field
        let status: 'Respond' | 'New' | 'Reviewed' = 'New';
        if (report.status === 'SUBMITTED' || report.status === 'NEW') {
          status = 'New';
        } else if (report.status === 'REVIEWED' || report.status === 'ACKNOWLEDGED') {
          status = 'Reviewed';
        } else if (report.status === 'PENDING_RESPONSE' || report.status === 'REQUIRES_ACTION') {
          status = 'Respond';
        }

        const siteName = report.shiftAssignment?.shiftPosting?.site?.name || 'Unknown Site';
        const checkInTime = report.shiftAssignment?.checkInTime;

        return {
          id: report.id,
          type,
          guardName,
          site: siteName,
          time: new Date(report.submittedAt).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          description: report.description,
          status,
          checkInTime: checkInTime
            ? new Date(checkInTime).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })
            : undefined,
          guardId: report.guard?.id,
        };
      });

      logger.info(`Reports list requested for client: ${clientId}, found ${transformedReports.length} reports`);
      return {
        reports: transformedReports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching client reports:', error);
      throw error;
    }
  }

  /**
   * Update assignment report status (client response)
   */
  async respondToReport(reportId: string, clientId: string, status: string, responseNotes?: string) {
    try {
      // Verify report belongs to client's sites
      const report = await prisma.assignmentReport.findUnique({
        where: { id: reportId },
        include: {
          shiftAssignment: {
            include: {
              shiftPosting: {
                select: { clientId: true }
              }
            }
          }
        }
      });

      if (!report) {
        throw new NotFoundError('Report not found');
      }

      if (report.shiftAssignment.shiftPosting.clientId !== clientId) {
        throw new UnauthorizedError('Access denied: This report does not belong to your sites');
      }

      // Update report status
      const updatedReport = await prisma.assignmentReport.update({
        where: { id: reportId },
        data: {
          status: status,
          updatedAt: new Date(),
        },
        include: {
          shiftAssignment: {
            include: {
              shiftPosting: {
                include: { site: true }
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

      logger.info(`Report ${reportId} status updated to ${status} by client ${clientId}`);
      return updatedReport;
    } catch (error) {
      logger.error('Error responding to report:', error);
      throw error;
    }
  }

  async getClientSites(clientId: string, page: number = 1, limit: number = 50) {
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
              },
              orderBy: { startTime: 'desc' },
              take: 1, // Get only the most recent active assignment
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.site.count({ where: { clientId } })
      ]);

      logger.info(`Sites list requested for client: ${clientId}, found ${sites.length} sites`);
      return {
        sites,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching client sites:', error);
      throw error;
    }
  }

  async getClientNotifications(clientId: string, page: number = 1, limit: number = 50) {
    // Mock data for client notifications - in real implementation, this would fetch notifications for client
    const notifications = [
      {
        id: '1',
        guardName: 'Mark Husdon',
        action: 'Checked in at 08:12 am',
        site: 'Site Alpha',
        status: 'Active',
      },
      {
        id: '2',
        guardName: 'Mark Husdon',
        action: 'Sent a incident report',
        site: 'Site Alpha',
        status: 'Active',
      },
    ];

    logger.info(`Notifications list requested for client: ${clientId}`);
    return {
      notifications,
      pagination: {
        page,
        limit,
        total: notifications.length,
        pages: Math.ceil(notifications.length / limit),
      },
    };
  }

  async createClientProfile(userId: string, accountType: 'INDIVIDUAL' | 'COMPANY' = 'INDIVIDUAL') {
    // Check if client profile already exists
    const existingClient = await prisma.client.findUnique({
      where: { userId },
    });

    if (existingClient) {
      return existingClient;
    }

    // Create new client profile
    const client = await prisma.client.create({
      data: {
        userId,
        accountType,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    logger.info(`Client profile created for user: ${userId}`);
    return client;
  }
}

const clientService = new ClientService();
export default clientService;
