import prisma from '../config/database.js';
import { Prisma } from '@prisma/client';
import { NotFoundError, ValidationError, UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

type ClientIncidentReportRow = Prisma.IncidentReportGetPayload<{
  include: {
    guard: {
      include: {
        user: {
          select: {
            id: true;
            firstName: true;
            lastName: true;
            email: true;
            profilePictureUrl: true;
          };
        };
      };
    };
  };
}>;

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

  private async findScopedClient(id: string, securityCompanyId?: string) {
    if (!securityCompanyId) {
      return prisma.client.findUnique({
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
    }

    return prisma.client.findFirst({
      where: {
        id,
        companyClients: {
          some: {
            securityCompanyId,
            isActive: true,
          },
        },
      },
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
  }

  private async assertScopedClient(id: string, securityCompanyId?: string) {
    const client = await this.findScopedClient(id, securityCompanyId);
    if (!client) {
      throw new NotFoundError('Client not found or does not belong to your company');
    }
    return client;
  }

  async getClientById(id: string, securityCompanyId?: string) {
    return await this.assertScopedClient(id, securityCompanyId);
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

  async updateClient(id: string, data: any, securityCompanyId?: string) {
    await this.assertScopedClient(id, securityCompanyId);

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

  async deleteClient(id: string, securityCompanyId?: string) {
    await this.assertScopedClient(id, securityCompanyId);

    await prisma.client.delete({
      where: { id },
    });

    logger.info(`Client deleted: ID: ${id}`);
    return { message: 'Client deleted successfully' };
  }

  async getClientStats(securityCompanyId: string) {
    const companyFilter = {
      companyClients: {
        some: {
          securityCompanyId,
          isActive: true,
        },
      },
    };

    const [totalClients, individualClients, companyClients, activeClients] = await Promise.all([
      prisma.client.count({ where: companyFilter }),
      prisma.client.count({ where: { ...companyFilter, accountType: 'INDIVIDUAL' } }),
      prisma.client.count({ where: { ...companyFilter, accountType: 'COMPANY' } }),
      prisma.client.count({
        where: {
          ...companyFilter,
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

      const newShiftReports = await prisma.shiftReport.count({
        where: {
          shiftId: { in: shiftIds },
          submittedAt: {
            gte: yesterday,
          },
        },
      });

      const newIncidentReports = await prisma.incidentReport.count({
        where: {
          submittedAt: { gte: yesterday },
          guard: {
            shifts: {
              some: { clientId },
            },
          },
        },
      });

      const newReports = newShiftReports + newIncidentReports;

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
            NOT: { guardId: null }, // Only shifts with assigned guards
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
            NOT: { guardId: null },
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
      const guards = shifts
        .filter((shift) => shift.guard?.user)
        .map((shift) => {
        const guardUser = shift.guard!.user;
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

        // Latest GPS or check-in fallback for active shifts
        const latestLocation = shift.guard!.trackingRecords?.[0];
        let guardLatitude = latestLocation?.latitude;
        let guardLongitude = latestLocation?.longitude;

        if (guardLatitude == null || guardLongitude == null) {
          const checkIn = shift.checkInLocation as Record<string, unknown> | null;
          if (
            checkIn &&
            typeof checkIn.latitude === 'number' &&
            typeof checkIn.longitude === 'number' &&
            !(checkIn.latitude === 0 && checkIn.longitude === 0)
          ) {
            guardLatitude = checkIn.latitude;
            guardLongitude = checkIn.longitude;
          }
        }

        const hasGuardCoords =
          guardLatitude != null &&
          guardLongitude != null &&
          !(guardLatitude === 0 && guardLongitude === 0);

        return {
          id: shift.guard!.id,
          userId: guardUser.id,
          shiftId: shift.id,
          name: guardName,
          avatar: shift.guard!.profilePictureUrl || undefined,
          site: shift.site?.name || shift.locationName || 'N/A',
          siteAddress: shift.site?.address || shift.locationAddress || 'N/A',
          siteLatitude: shift.site?.latitude ?? undefined,
          siteLongitude: shift.site?.longitude ?? undefined,
          guardLatitude: status === 'Active' && hasGuardCoords ? guardLatitude : undefined,
          guardLongitude: status === 'Active' && hasGuardCoords ? guardLongitude : undefined,
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

  async getClientGuardProfile(clientId: string, guardId: string) {
    const assignment = await prisma.shift.findFirst({
      where: {
        clientId,
        guardId,
        NOT: { guardId: null },
      },
      orderBy: [
        { status: 'asc' },
        { scheduledStartTime: 'desc' },
      ],
      include: {
        site: { select: { id: true, name: true, address: true } },
        guard: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            qualifications: {
              take: 5,
              orderBy: { expiryDate: 'desc' },
            },
          },
        },
      },
    });

    if (!assignment?.guard) {
      throw new NotFoundError('Guard not found or not assigned to your sites');
    }

    const [completedShifts, totalShifts, activeShift] = await Promise.all([
      prisma.shift.count({
        where: { clientId, guardId, status: 'COMPLETED' },
      }),
      prisma.shift.count({
        where: { clientId, guardId },
      }),
      prisma.shift.findFirst({
        where: {
          clientId,
          guardId,
          status: { in: ['IN_PROGRESS', 'SCHEDULED'] },
          scheduledEndTime: { gte: new Date() },
        },
        orderBy: { scheduledStartTime: 'asc' },
        include: { site: { select: { name: true, address: true } } },
      }),
    ]);

    const guardUser = assignment.guard.user;
    const formatTime = (date: Date) =>
      date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

    let status: 'Active' | 'Upcoming' | 'Missed' | 'Completed' | 'Offline' = 'Offline';
    const current = activeShift || assignment;
    if (current.status === 'IN_PROGRESS') {
      status = 'Active';
    } else if (current.status === 'SCHEDULED') {
      status = current.scheduledStartTime <= new Date() ? 'Active' : 'Upcoming';
    } else if (current.status === 'COMPLETED') {
      status = 'Completed';
    } else if (current.status === 'NO_SHOW') {
      status = 'Missed';
    }

    return {
      id: assignment.guard.id,
      userId: guardUser.id,
      name: `${guardUser.firstName} ${guardUser.lastName}`.trim(),
      email: guardUser.email,
      phone: guardUser.phone || undefined,
      avatar: assignment.guard.profilePictureUrl || undefined,
      experience: assignment.guard.experience || undefined,
      status,
      currentSite: activeShift?.site?.name || assignment.site?.name || assignment.locationName,
      currentSiteAddress:
        activeShift?.site?.address || assignment.site?.address || assignment.locationAddress,
      shiftId: activeShift?.id || assignment.id,
      shiftTime: activeShift
        ? `${formatTime(activeShift.scheduledStartTime)} - ${formatTime(activeShift.scheduledEndTime)}`
        : `${formatTime(assignment.scheduledStartTime)} - ${formatTime(assignment.scheduledEndTime)}`,
      checkInTime: activeShift?.actualStartTime?.toISOString(),
      stats: {
        completedShifts,
        totalShifts,
        rating: 4.8,
      },
      qualifications: assignment.guard.qualifications.map((q) => ({
        title: q.title,
        issuer: q.issuer,
        expiryDate: q.expiryDate?.toISOString(),
      })),
    };
  }

  async getClientReports(clientId: string, page: number = 1, limit: number = 50) {
    try {
      const skip = (page - 1) * limit;

      // Get client's guard IDs from shifts (to fetch their incident reports)
      const clientShifts = await prisma.shift.findMany({
        where: { clientId },
        select: { guardId: true }
      });
      const guardIds = [
        ...new Set(
          clientShifts
            .map((s) => s.guardId)
            .filter((id): id is string => typeof id === 'string' && id.length > 0),
        ),
      ];

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
                  select: {
                    id: true,
                    profilePictureUrl: true,
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        profilePictureUrl: true,
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
                email: true,
                profilePictureUrl: true,
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
                    email: true,
                    profilePictureUrl: true,
                  }
                }
              }
            }
          },
          orderBy: { submittedAt: 'desc' },
          skip,
          take: limit
        }) : Promise.resolve([] as ClientIncidentReportRow[]),
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
          const checkInTime = report.shift?.actualStartTime;

          return {
            id: report.id,
            source: 'shift' as const,
            type,
            guardName,
            guardAvatar:
              report.guard?.profilePictureUrl ||
              report.shift?.guard?.profilePictureUrl ||
              undefined,
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
            guardUserId: report.guard?.id || report.shift?.guard?.user?.id,
          };
        } catch (error) {
          logger.error(`Error transforming shift report ${report.id}:`, error);
          // Return a minimal valid report object
          return {
            id: report.id,
            source: 'shift' as const,
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
            source: 'incident' as const,
            type,
            guardName,
            guardAvatar: report.guard?.profilePictureUrl || undefined,
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
            source: 'incident' as const,
            type: 'Incident' as const,
            guardName: 'Unknown Guard',
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
      // Verify report belongs to client's shifts (shift report)
      const report = await prisma.shiftReport.findUnique({
        where: { id: reportId },
        include: {
          shift: {
            select: { clientId: true, site: { select: { name: true } } }
          },
          guard: {
            select: { firstName: true, lastName: true, email: true },
          },
        }
      });

      if (!report) {
        const client = await prisma.client.findUnique({
          where: { id: clientId },
          select: { userId: true },
        });

        if (!client) {
          throw new NotFoundError('Client not found');
        }

        const incidentReportService = (await import('./incidentReportService.js')).default;
        return incidentReportService.respondToReport(
          reportId,
          client.userId,
          'CLIENT',
          status,
          responseNotes
        );
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
            select: { firstName: true, lastName: true, email: true },
          },
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
