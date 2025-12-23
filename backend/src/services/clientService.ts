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
  async getAllClients(page: number = 1, limit: number = 50, accountType?: string, securityCompanyId?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (accountType) {
      where.accountType = accountType;
    }

    // Multi-tenant: Filter by company
    if (securityCompanyId) {
      where.companyClients = {
        some: {
          securityCompanyId,
          isActive: true,
        },
      };
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

      // Get active sites (sites with active shifts - Option B)
      const activeSites = await prisma.site.count({
        where: {
          clientId,
          shifts: {
            some: {
              status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
            }
          }
        },
      });

      // Get new reports (reports from last 24 hours)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Get shifts for client (Option B)
      const clientShifts = await prisma.shift.findMany({
        where: {
          clientId,
        },
        select: { id: true }
      });
      const shiftIds = clientShifts.map(shift => shift.id);

      const newReports = await prisma.shiftReport.count({
        where: {
          shiftId: { in: shiftIds },
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
      const now = new Date();
      
      // Get shifts for this client that are:
      // 1. Active (IN_PROGRESS) - regardless of date
      // 2. Upcoming (SCHEDULED with scheduledEndTime >= now)
      // 3. Today's shifts (scheduledStartTime is today)
      // 4. Recent past shifts (completed within last 7 days)
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch all relevant shifts for this client
      const [allShifts, totalShifts] = await Promise.all([
        prisma.shift.findMany({
          where: {
            clientId,
            guardId: { not: null }, // Only shifts with assigned guards
            OR: [
              {
                // Active shifts
                status: 'IN_PROGRESS',
              },
              {
                // Upcoming shifts (not yet ended)
                status: 'SCHEDULED',
                scheduledEndTime: {
                  gte: now,
                },
              },
              {
                // Today's shifts
                scheduledStartTime: {
                  gte: today,
                  lt: tomorrow,
                },
              },
              {
                // Recent completed shifts (last 7 days)
                status: 'COMPLETED',
                scheduledEndTime: {
                  gte: sevenDaysAgo,
                },
              },
            ],
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
          orderBy: [
            {
              status: 'asc', // IN_PROGRESS first
            },
            {
              scheduledStartTime: 'asc', // Then by start time
            },
          ],
        }),
        prisma.shift.count({
          where: {
            clientId,
            guardId: { not: null },
            OR: [
              {
                status: 'IN_PROGRESS',
              },
              {
                status: 'SCHEDULED',
                scheduledEndTime: {
                  gte: now,
                },
              },
              {
                scheduledStartTime: {
                  gte: today,
                  lt: tomorrow,
                },
              },
              {
                status: 'COMPLETED',
                scheduledEndTime: {
                  gte: sevenDaysAgo,
                },
              },
            ],
          },
        }),
      ]);

      // Group shifts by guard ID and get the most relevant shift for each guard
      // Priority: Active > Upcoming (soonest) > Today > Recent past
      const guardShiftMap = new Map<string, typeof allShifts[0]>();
      
      for (const shift of allShifts) {
        if (!shift.guardId || !shift.guard) continue;
        
        const existingShift = guardShiftMap.get(shift.guardId);
        
        if (!existingShift) {
          guardShiftMap.set(shift.guardId, shift);
        } else {
          // Prioritize: IN_PROGRESS > SCHEDULED (soonest) > others
          const existingPriority = existingShift.status === 'IN_PROGRESS' ? 1 : 
                                   existingShift.status === 'SCHEDULED' ? 2 : 3;
          const currentPriority = shift.status === 'IN_PROGRESS' ? 1 : 
                                  shift.status === 'SCHEDULED' ? 2 : 3;
          
          if (currentPriority < existingPriority) {
            guardShiftMap.set(shift.guardId, shift);
          } else if (currentPriority === existingPriority && 
                     shift.scheduledStartTime < existingShift.scheduledStartTime) {
            // If same priority, pick the one starting sooner
            guardShiftMap.set(shift.guardId, shift);
          }
        }
      }
      
      // Convert map to array and apply pagination
      const shifts = Array.from(guardShiftMap.values())
        .slice(skip, skip + limit);
      
      const total = guardShiftMap.size;

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

      logger.info(`Guards list requested for client: ${clientId}, found ${guards.length} guards (${total} total guards with shifts)`);
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

      // Get client's guard IDs from shifts (to fetch their incident reports)
      const clientShifts = await prisma.shift.findMany({
        where: { clientId },
        select: { guardId: true }
      });
      const guardIds = [...new Set(clientShifts.map(s => s.guardId).filter(Boolean))];

      // Get shift reports for client's shifts (Option B - Direct Assignment)
      const [shiftReports, incidentReports, shiftReportsTotal, incidentReportsTotal] = await Promise.all([
        prisma.shiftReport.findMany({
          where: {
            shift: {
              clientId: clientId
            }
          },
          include: {
            shift: {
              include: {
                site: {
                  select: { name: true, address: true }
                },
                guard: {
                  include: {
                    user: {
                      select: { 
                        id: true,
                        firstName: true, 
                        lastName: true, 
                        email: true 
                      }
                    }
                  }
                }
              }
            },
            guard: {
              select: { 
                id: true,
                firstName: true, 
                lastName: true, 
                email: true 
              }
            }
          },
          orderBy: { submittedAt: 'desc' },
          skip,
          take: limit
        }),
        // Get incident reports from guards assigned to client's shifts
        guardIds.length > 0 ? prisma.incidentReport.findMany({
          where: {
            guardId: { in: guardIds }
          },
          include: {
            guard: {
              include: {
                user: {
                  select: { 
                    id: true,
                    firstName: true, 
                    lastName: true, 
                    email: true 
                  }
                }
              }
            }
          },
          orderBy: { submittedAt: 'desc' },
          skip,
          take: limit
        }) : Promise.resolve([]),
        prisma.shiftReport.count({
          where: {
            shift: {
              clientId: clientId
            }
          }
        }),
        guardIds.length > 0 ? prisma.incidentReport.count({
          where: {
            guardId: { in: guardIds }
          }
        }) : Promise.resolve(0)
      ]);

      // Transform shift reports to match frontend format
      const transformedShiftReports = shiftReports.map((report) => {
        try {
          // ShiftReport.guard is a User directly, Shift.guard is a Guard with user relation
          const guardUser = report.guard || report.shift?.guard?.user;
          const guardName = guardUser 
            ? `${guardUser.firstName || ''} ${guardUser.lastName || ''}`.trim() || 'Unknown Guard'
            : 'Unknown Guard';
          
          // Map report type from ReportTypeEnum
          let type: 'Medical Emergency' | 'Incident' | 'Violation' | 'Maintenance' = 'Incident';
          switch (report.reportType) {
            case 'EMERGENCY':
              type = 'Medical Emergency';
              break;
            case 'INCIDENT':
              type = 'Incident';
              break;
            case 'SHIFT':
            default:
              type = 'Incident';
          }

          // ShiftReport doesn't have status field, default to 'New'
          let status: 'Respond' | 'New' | 'Reviewed' = 'New';

          const siteName = report.shift?.site?.name || 'Unknown Site';
          const checkInTime = report.shift?.checkInTime;

          return {
            id: report.id,
            type,
            guardName,
            site: siteName,
            time: report.submittedAt 
              ? new Date(report.submittedAt).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })
              : 'Unknown Time',
            description: report.content || 'No description',
            status,
            checkInTime: checkInTime
              ? new Date(checkInTime).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })
              : undefined,
            guardId: report.shift?.guard?.id,
            guardUserId: report.guard?.id || report.shift?.guard?.userId,
          };
        } catch (error) {
          logger.error(`Error transforming shift report ${report.id}:`, error);
          // Return a minimal valid report object
          return {
            id: report.id,
            type: 'Incident' as const,
            guardName: 'Unknown Guard',
            site: 'Unknown Site',
            time: 'Unknown Time',
            description: report.content || 'No description',
            status: 'New' as const,
            guardId: report.shift?.guard?.id,
            guardUserId: report.guard?.id,
          };
        }
      });

      // Transform incident reports to match frontend format
      const transformedIncidentReports = incidentReports.map((report) => {
        try {
          const guardUser = report.guard?.user;
          const guardName = guardUser 
            ? `${guardUser.firstName || ''} ${guardUser.lastName || ''}`.trim() || 'Unknown Guard'
            : 'Unknown Guard';
          
          // Map report type from reportType string
          let type: 'Medical Emergency' | 'Incident' | 'Violation' | 'Maintenance' = 'Incident';
          const reportTypeUpper = (report.reportType || '').toUpperCase();
          if (reportTypeUpper.includes('EMERGENCY') || reportTypeUpper.includes('MEDICAL')) {
            type = 'Medical Emergency';
          } else if (reportTypeUpper.includes('VIOLATION')) {
            type = 'Violation';
          } else if (reportTypeUpper.includes('MAINTENANCE')) {
            type = 'Maintenance';
          }

          // Map status from IncidentReport status
          let status: 'Respond' | 'New' | 'Reviewed' = 'Respond';
          const statusUpper = (report.status || '').toUpperCase();
          if (statusUpper === 'REVIEWED' || statusUpper === 'RESOLVED') {
            status = 'Reviewed';
          } else if (statusUpper === 'PENDING' || statusUpper === 'SUBMITTED') {
            status = 'Respond'; // Show "Respond" button for new reports
          } else {
            status = 'Respond'; // Default to Respond for any other status
          }

          const siteName = report.locationName || 'Unknown Site';

          return {
            id: report.id,
            type,
            guardName,
            site: siteName,
            time: report.submittedAt 
              ? new Date(report.submittedAt).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })
              : 'Unknown Time',
            description: report.description || 'No description',
            status,
            checkInTime: undefined,
            guardId: report.guard?.id,
            guardUserId: guardUser?.id || report.guard?.userId,
          };
        } catch (error) {
          logger.error(`Error transforming incident report ${report.id}:`, error);
          // Return a minimal valid report object
          return {
            id: report.id,
            type: 'Incident' as const,
            guardName: 'Unknown Guard',
            site: report.locationName || 'Unknown Site',
            time: 'Unknown Time',
            description: report.description || 'No description',
            status: 'Respond' as const,
            checkInTime: undefined,
            guardId: report.guard?.id,
            guardUserId: undefined,
          };
        }
      });

      // Combine and sort by time (most recent first)
      const allReports = [...transformedShiftReports, ...transformedIncidentReports]
        .sort((a, b) => {
          // Parse time strings back to Date for comparison
          // For simplicity, we'll sort by ID (UUIDs are time-ordered)
          return b.id.localeCompare(a.id);
        })
        .slice(0, limit); // Ensure we don't exceed limit

      const total = shiftReportsTotal + incidentReportsTotal;

      logger.info(`Reports list requested for client: ${clientId}, found ${allReports.length} reports (${shiftReports.length} shift reports, ${incidentReports.length} incident reports)`);
      
      return {
        reports: allReports,
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
   * Update shift report status (client response) - Option B
   * Note: ShiftReport doesn't have status field, so we'll add a note or use IncidentReport for status tracking
   */
  async respondToReport(reportId: string, clientId: string, status: string, responseNotes?: string) {
    try {
      // Verify report belongs to client's shifts
      const report = await prisma.shiftReport.findUnique({
        where: { id: reportId },
        include: {
          shift: {
            select: { clientId: true, site: { select: { name: true } } }
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

      if (!report) {
        throw new NotFoundError('Report not found');
      }

      if (report.shift?.clientId !== clientId) {
        throw new UnauthorizedError('Access denied: This report does not belong to your shifts');
      }

      // ShiftReport doesn't have status field, so we'll update the content with response
      // In future, consider adding a status field or using IncidentReport for status tracking
      const updatedContent = responseNotes 
        ? `${report.content}\n\n[Client Response - ${status}]: ${responseNotes}`
        : `${report.content}\n\n[Client Response - ${status}]`;

      const updatedReport = await prisma.shiftReport.update({
        where: { id: reportId },
        data: {
          content: updatedContent,
          updatedAt: new Date(),
        },
        include: {
          shift: {
            include: {
              site: { select: { name: true, address: true } },
              guard: {
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

      logger.info(`Report ${reportId} responded to by client ${clientId} with status: ${status}`);
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
            shifts: {
              where: { 
                status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
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
              orderBy: { scheduledStartTime: 'desc' },
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
