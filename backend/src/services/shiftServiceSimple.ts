// Simplified Shift Service for Phase 2 Testing
import prisma from '../config/database.js';
import { NotFoundError, BadRequestError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { Prisma } from '@prisma/client';

export interface CreateShiftData {
  guardId?: string; // Optional: Admin assigns directly, client can leave empty for admin to assign later
  locationName: string;
  locationAddress: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  description?: string;
  notes?: string;
  siteId?: string; // Optional: if provided, link shift to site and client
  clientId?: string; // Optional: if provided, link shift to client directly
}

export interface CheckInData {
  shiftId: string;
  guardId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  };
  timestamp: Date;
}

export interface CheckOutData {
  shiftId: string;
  guardId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  };
  timestamp: Date;
  notes?: string;
}

export interface ShiftStats {
  completedShifts: number;
  missedShifts: number;
  totalSites: number;
  incidentReports: number;
  totalHours: number;
  averageShiftDuration: number;
}

class ShiftServiceSimple {
  /**
   * Create a new shift
   */
  async createShift(data: CreateShiftData, securityCompanyId?: string) {
    // Validate guard exists if guardId is provided
    if (data.guardId) {
      const guard = await prisma.guard.findUnique({
        where: { id: data.guardId },
        include: {
          companyGuards: {
            where: { isActive: true },
            select: { securityCompanyId: true },
          },
        },
      });

      if (!guard) {
        throw new NotFoundError('Guard not found');
      }

      // Multi-tenant: Verify guard belongs to company if securityCompanyId provided
      if (securityCompanyId) {
        const guardCompany = guard.companyGuards.find(
          cg => cg.securityCompanyId === securityCompanyId
        );
        if (!guardCompany) {
          throw new ValidationError('Guard does not belong to your company');
        }
      }
    }

    // If siteId is provided, validate and get clientId from site
    let siteId: string | null = null;
    let clientId: string | null = null;
    
    if (data.siteId) {
      const site = await prisma.site.findUnique({
        where: { id: data.siteId },
        include: {
          client: {
            include: {
              companyClients: {
                where: { isActive: true },
                select: { securityCompanyId: true },
              },
            },
          },
          companySites: {
            select: { securityCompanyId: true },
          },
        },
      });

      if (!site) {
        throw new NotFoundError('Site not found');
      }

      // Multi-tenant: Verify site belongs to company if securityCompanyId provided
      if (securityCompanyId) {
        const siteCompany = site.companySites.find(
          cs => cs.securityCompanyId === securityCompanyId
        );
        if (!siteCompany) {
          throw new ValidationError('Site does not belong to your company');
        }
      }

      siteId = site.id;
      clientId = site.clientId;
      
      // Use site's name and address if not provided
      if (!data.locationName) {
        data.locationName = site.name;
      }
      if (!data.locationAddress) {
        data.locationAddress = site.address;
      }
    }

    const shift = await prisma.shift.create({
      data: {
        guardId: data.guardId,
        siteId: siteId,
        clientId: clientId,
        locationName: data.locationName,
        locationAddress: data.locationAddress,
        scheduledStartTime: data.scheduledStartTime,
        scheduledEndTime: data.scheduledEndTime,
        description: data.description,
        notes: data.notes,
      } as any,
      include: {
        site: {
          include: {
            client: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true }
                }
              }
            }
          }
        },
        client: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
      },
    });

    logger.info(`Shift created for guard ${data.guardId}${siteId ? ` at site ${siteId}` : ''}: ${shift.id}`, {
      shiftId: shift.id,
      guardId: shift.guardId,
      scheduledStartTime: shift.scheduledStartTime,
      scheduledEndTime: shift.scheduledEndTime,
      status: shift.status,
    });

    // Send notification to guard if shift is assigned
    if (shift.guardId) {
      const guard = await prisma.guard.findUnique({
        where: { id: shift.guardId },
        select: { userId: true },
      });

      if (guard?.userId) {
        try {
          const notificationService = (await import('./notificationService.js')).default;
          await notificationService.notifyShiftAssigned(
            guard.userId,
            {
              id: shift.id,
              scheduledStartTime: shift.scheduledStartTime,
              scheduledEndTime: shift.scheduledEndTime,
              locationName: shift.locationName,
              locationAddress: shift.locationAddress,
            },
            securityCompanyId
          );
        } catch (error) {
          logger.error('Failed to send shift assignment notification:', error);
          // Don't throw - notification failure shouldn't break shift creation
        }
      }
    }

    return shift;
  }

  /**
   * Check in to shift (simplified)
   */
  async checkInToShift(data: CheckInData) {
    // Find the shift
    const shift = await prisma.shift.findUnique({
      where: { id: data.shiftId },
    });

    if (!shift) {
      throw new NotFoundError('Shift not found');
    }

    if (shift.guardId !== data.guardId) {
      throw new BadRequestError('Shift does not belong to this guard');
    }

    if (shift.status !== 'SCHEDULED') {
      throw new BadRequestError(`Cannot check in to shift with status: ${shift.status}`);
    }

    // Update shift with check-in information
    const updatedShift = await prisma.shift.update({
      where: { id: data.shiftId },
      data: {
        status: 'IN_PROGRESS',
        actualStartTime: data.timestamp,
        checkInLocation: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          accuracy: data.location.accuracy,
          address: data.location.address,
          timestamp: data.timestamp.toISOString(),
        },
      } as any,
    });

    logger.info(`Guard ${data.guardId} checked in to shift ${data.shiftId}`);

    // Send notification to admins about check-in
    try {
      // Get shift with guard info
      const shiftWithDetails = await prisma.shift.findUnique({
        where: { id: data.shiftId },
        include: {
          guard: {
            select: { userId: true },
          },
        },
      });

      if (shiftWithDetails) {
        // Get admins from the same company
        const guardCompany = await prisma.companyGuard.findFirst({
          where: { guardId: data.guardId, isActive: true },
          select: { securityCompanyId: true },
        });

        if (guardCompany) {
          const companyAdmins = await prisma.companyUser.findMany({
            where: {
              securityCompanyId: guardCompany.securityCompanyId,
              isActive: true,
            },
            select: { userId: true },
          });

          const adminUserIds = companyAdmins.map(cu => cu.userId).filter(Boolean);

          if (adminUserIds.length > 0 && shiftWithDetails.guard?.userId) {
            const notificationService = (await import('./notificationService.js')).default;
            await notificationService.notifyCheckIn(
              shiftWithDetails.guard.userId,
              {
                id: shiftWithDetails.id,
                guardId: shiftWithDetails.guardId!,
                locationName: shiftWithDetails.locationName,
              },
              adminUserIds,
              guardCompany.securityCompanyId
            );
          }
        }
      }
    } catch (error) {
      logger.error('Failed to send check-in notification:', error);
      // Don't throw - notification failure shouldn't break check-in
    }

    return updatedShift;
  }

  /**
   * Check out from shift (simplified)
   */
  async checkOutFromShift(data: CheckOutData) {
    // Find the shift
    const shift = await prisma.shift.findUnique({
      where: { id: data.shiftId },
    });

    if (!shift) {
      throw new NotFoundError('Shift not found');
    }

    if (shift.guardId !== data.guardId) {
      throw new BadRequestError('Shift does not belong to this guard');
    }

    if (shift.status !== 'IN_PROGRESS') {
      throw new BadRequestError(`Cannot check out from shift with status: ${shift.status}`);
    }

    // Update shift with check-out information
    const updatedShift = await prisma.shift.update({
      where: { id: data.shiftId },
      data: {
        status: 'COMPLETED',
        actualEndTime: data.timestamp,
        checkOutLocation: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          accuracy: data.location.accuracy,
          address: data.location.address,
          timestamp: data.timestamp.toISOString(),
        },
        notes: data.notes || shift.notes,
      } as any,
    });

    logger.info(`Guard ${data.guardId} checked out from shift ${data.shiftId}`);

    // Send notification to admins about check-out
    try {
      // Get shift with guard info
      const shiftWithDetails = await prisma.shift.findUnique({
        where: { id: data.shiftId },
        include: {
          guard: {
            select: { userId: true },
          },
        },
      });

      if (shiftWithDetails) {
        // Get admins from the same company
        const guardCompany = await prisma.companyGuard.findFirst({
          where: { guardId: data.guardId, isActive: true },
          select: { securityCompanyId: true },
        });

        if (guardCompany) {
          const companyAdmins = await prisma.companyUser.findMany({
            where: {
              securityCompanyId: guardCompany.securityCompanyId,
              isActive: true,
            },
            select: { userId: true },
          });

          const adminUserIds = companyAdmins.map(cu => cu.userId).filter(Boolean);

          if (adminUserIds.length > 0 && shiftWithDetails.guard?.userId) {
            const notificationService = (await import('./notificationService.js')).default;
            await notificationService.notifyCheckOut(
              shiftWithDetails.guard.userId,
              {
                id: shiftWithDetails.id,
                guardId: shiftWithDetails.guardId!,
                locationName: shiftWithDetails.locationName,
              },
              adminUserIds,
              guardCompany.securityCompanyId
            );
          }
        }
      }
    } catch (error) {
      logger.error('Failed to send check-out notification:', error);
      // Don't throw - notification failure shouldn't break check-out
    }

    return updatedShift;
  }

  /**
   * Get shift statistics for a guard (Option B - using Shift model only)
   */
  async getGuardShiftStats(guardId: string, startDate?: Date, endDate?: Date): Promise<ShiftStats> {
    const whereClause: any = { guardId };

    if (startDate || endDate) {
      whereClause.scheduledStartTime = {};
      if (startDate) whereClause.scheduledStartTime.gte = startDate;
      if (endDate) whereClause.scheduledStartTime.lte = endDate;
    }

    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: {
        site: true,
        shiftIncidents: true,
      },
    });

    const completedShifts = shifts.filter(s => s.status === Prisma.ShiftStatus.COMPLETED).length;
    const missedShifts = shifts.filter(s => 
      s.status === Prisma.ShiftStatus.CANCELLED || s.status === Prisma.ShiftStatus.NO_SHOW
    ).length;
    
    // Get unique sites from shifts
    const uniqueSiteIds = new Set(
      shifts
        .map(s => s.siteId)
        .filter(id => id !== null)
    );
    const totalSites = uniqueSiteIds.size;

    // Count incident reports from ShiftIncident
    const incidentReports = shifts.reduce((total, shift) => total + shift.incidentCount, 0);

    // Calculate total hours
    const completedShiftsWithTimes = shifts.filter(s => 
      s.status === Prisma.ShiftStatus.COMPLETED && 
      s.actualStartTime && 
      s.actualEndTime
    );

    const totalMinutes = completedShiftsWithTimes.reduce((total, shift) => {
      if (shift.actualStartTime && shift.actualEndTime) {
        const start = new Date(shift.actualStartTime).getTime();
        const end = new Date(shift.actualEndTime).getTime();
        return total + Math.abs(end - start) / (1000 * 60);
      }
      return total;
    }, 0);

    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    const averageShiftDuration = completedShiftsWithTimes.length > 0 
      ? Math.round((totalMinutes / completedShiftsWithTimes.length) / 60 * 100) / 100 
      : 0;

    return {
      completedShifts,
      missedShifts,
      totalSites,
      incidentReports,
      totalHours,
      averageShiftDuration,
    };
  }

  /**
   * Get shift by ID (Option B - using Shift model only)
   */
  async getShiftById(shiftId: string, guardId?: string) {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        guard: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
        site: true,
        client: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    });

    if (!shift) {
      throw new NotFoundError('Shift not found');
    }

    // Verify guard ownership if guardId is provided
    if (guardId && shift.guardId !== guardId) {
      throw new NotFoundError('Shift not found');
    }

    return this.transformShiftToShift(shift);
  }

  /**
   * Get active shift for a guard (Option B - using Shift model only)
   */
  async getActiveShift(guardId: string) {
    const shift = await prisma.shift.findFirst({
      where: {
        guardId,
        status: Prisma.ShiftStatus.IN_PROGRESS,
      },
      include: {
        site: true,
        client: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        guard: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
      },
    });

    if (shift) {
      return this.transformShiftToShift(shift);
    }

    return null;
  }

  /**
   * Get upcoming shifts for a guard (Option B - using Shift model only)
   */
  async getUpcomingShifts(guardId: string, limit: number = 10) {
    const now = new Date();
    
    logger.info(`Fetching upcoming shifts for guard: ${guardId}`, {
      guardId,
      now: now.toISOString(),
      nowTimestamp: now.getTime(),
    });

    // First, let's verify the guard exists and check all their shifts for debugging
    const allShiftsForGuard = await prisma.shift.findMany({
      where: { guardId },
      select: {
        id: true,
        status: true,
        scheduledStartTime: true,
        scheduledEndTime: true,
        locationName: true,
      },
      take: 20,
    });
    
    logger.info(`Total shifts found for guard ${guardId}: ${allShiftsForGuard.length}`, {
      shifts: allShiftsForGuard.map(s => ({
        id: s.id,
        status: s.status,
        start: s.scheduledStartTime.toISOString(),
        end: s.scheduledEndTime.toISOString(),
        location: s.locationName,
      })),
    });

    // Get shifts from Shift table (admin-created shifts)
    // Include all scheduled shifts, not just SCHEDULED status
    // Show shifts that haven't ended yet OR are scheduled for today (even if start time has passed)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
    // More inclusive query: any shift that hasn't ended yet and is not completed/cancelled
    const shifts = await prisma.shift.findMany({
      where: {
        guardId,
        status: { 
          in: ['SCHEDULED', 'IN_PROGRESS'] // Include scheduled and in-progress shifts
        },
        scheduledEndTime: {
          gte: now, // Shifts that haven't ended yet
        },
      },
      include: {
        guard: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
        site: true,
        client: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        },
      },
      orderBy: {
        scheduledStartTime: 'asc',
      },
      take: limit,
    });

    logger.info(`Found ${shifts.length} upcoming shifts for guard ${guardId}`, {
      shifts: shifts.map(s => ({
        id: s.id,
        status: s.status,
        start: s.scheduledStartTime.toISOString(),
        end: s.scheduledEndTime.toISOString(),
        location: s.locationName,
      })),
    });
    
    // Transform shifts to frontend format
    const transformedShifts = shifts.map(s => this.transformShiftToShift(s));

    return transformedShifts;
  }

  /**
   * Get today's shifts for a guard (Option B - using Shift model only)
   */
  async getTodayShifts(guardId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    logger.info(`Fetching today's shifts for guard: ${guardId}`, {
      guardId,
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString(),
      currentTime: new Date().toISOString(),
    });

    // Get shifts from Shift table (Option B - Direct Assignment)
    // Include shifts that start OR end today
    const shifts = await prisma.shift.findMany({
      where: {
        guardId,
        OR: [
          {
            // Shifts that start today
            scheduledStartTime: {
              gte: today,
              lt: tomorrow,
            },
          },
          {
            // Shifts that end today (started yesterday or earlier)
            scheduledEndTime: {
              gte: today,
              lt: tomorrow,
            },
          },
        ],
        // Include all shifts for today regardless of status
      },
      include: {
        guard: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
        site: true,
        client: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        },
      },
      orderBy: {
        scheduledStartTime: 'asc',
      },
    });

    logger.info(`Found ${shifts.length} shifts for guard ${guardId} today`, {
      shifts: shifts.map(s => ({
        id: s.id,
        status: s.status,
        start: s.scheduledStartTime.toISOString(),
        end: s.scheduledEndTime.toISOString(),
        location: s.locationName,
      })),
    });
    
    // Transform shifts to frontend format
    const transformedShifts = shifts.map(s => this.transformShiftToShift(s));

    return transformedShifts;
  }

  /**
   * Get past shifts for a guard (Option B - using Shift model only)
   */
  async getPastShifts(guardId: string, limit: number = 20) {
    const now = new Date();

    // Get shifts from Shift table (Option B - Direct Assignment)
    const shifts = await prisma.shift.findMany({
      where: {
        guardId,
        status: { in: [Prisma.ShiftStatus.COMPLETED, Prisma.ShiftStatus.CANCELLED, Prisma.ShiftStatus.NO_SHOW] },
        scheduledEndTime: {
          lt: now,
        },
      },
      include: {
        guard: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
        site: true,
        client: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        },
      },
      orderBy: {
        scheduledEndTime: 'desc',
      },
      take: limit,
    });

    logger.info(`Found ${shifts.length} past shifts for guard ${guardId}`);
    
    // Transform shifts to frontend format
    const transformedShifts = shifts.map(s => this.transformShiftToShift(s));

    return transformedShifts;
  }

  /**
   * Get weekly shift summary for a guard (Option B - using Shift model only)
   */
  async getWeeklyShiftSummary(guardId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Get shifts from Shift table (Option B - Direct Assignment)
    const shifts = await prisma.shift.findMany({
      where: {
        guardId,
        scheduledStartTime: {
          gte: startOfWeek,
          lt: endOfWeek,
        },
      },
      include: {
        site: true,
        client: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        },
      },
      orderBy: {
        scheduledStartTime: 'asc',
      },
    });

    logger.info(`Found ${shifts.length} shifts for guard ${guardId} this week`);
    
    // Transform shifts to frontend format
    const transformedShifts = shifts.map(s => this.transformShiftToShift(s));

    return transformedShifts;
  }

  // REMOVED: transformAssignmentToShift() - No longer needed (Option B - no assignments)

  /**
   * Transform Shift to Shift format for frontend compatibility
   */
  private transformShiftToShift(shift: any) {
    const site = shift.site;
    const client = shift.client;
    
    // Extract check-in/check-out times from location JSON if available
    let checkInTime = null;
    let checkOutTime = null;
    
    if (shift.checkInLocation && typeof shift.checkInLocation === 'object') {
      checkInTime = shift.checkInLocation.timestamp ? new Date(shift.checkInLocation.timestamp) : null;
    }
    
    if (shift.checkOutLocation && typeof shift.checkOutLocation === 'object') {
      checkOutTime = shift.checkOutLocation.timestamp ? new Date(shift.checkOutLocation.timestamp) : null;
    }
    
    return {
      id: shift.id,
      guardId: shift.guardId,
      locationName: shift.locationName || site?.name || 'Unknown Site',
      locationAddress: shift.locationAddress || site?.address || '',
      scheduledStartTime: shift.scheduledStartTime,
      scheduledEndTime: shift.scheduledEndTime,
      startTime: shift.actualStartTime || shift.scheduledStartTime,
      endTime: shift.actualEndTime || shift.scheduledEndTime,
      checkInTime: checkInTime || shift.actualStartTime,
      checkOutTime: checkOutTime || shift.actualEndTime,
      status: this.mapShiftStatusToShiftStatus(shift.status),
      description: shift.description || '',
      notes: shift.notes || '',
      site: site ? {
        id: site.id,
        name: site.name,
        address: site.address,
      } : null,
      client: client ? {
        id: client.id,
        name: client.user ? `${client.user.firstName} ${client.user.lastName}` : 'Unknown Client',
      } : null,
    };
  }

  // REMOVED: mapAssignmentStatusToShiftStatus() - No longer needed (Option B - no assignments)

  /**
   * Map Shift status to ShiftStatus format
   */
  private mapShiftStatusToShiftStatus(status: string): string {
    const statusMap: Record<string, string> = {
      SCHEDULED: 'SCHEDULED',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
      NO_SHOW: 'NO_SHOW',
      ON_BREAK: 'IN_PROGRESS',
      EARLY_END: 'COMPLETED',
    };
    return statusMap[status] || 'SCHEDULED';
  }

  /**
   * Start break (simplified implementation)
   */
  async startBreak(data: any) {
    // Validate shift exists and is in progress
    const shift = await prisma.shift.findUnique({
      where: { id: data.shiftId },
    });

    if (!shift) {
      throw new NotFoundError('Shift not found');
    }

    if (shift.status !== 'IN_PROGRESS') {
      throw new BadRequestError(`Cannot start break for shift with status: ${shift.status}`);
    }

    // For simplified version, we'll just return a mock break object
    const breakRecord = {
      id: `break_${Date.now()}`,
      shiftId: data.shiftId,
      type: data.breakType || 'REST',
      startTime: new Date().toISOString(),
      endTime: null,
      location: data.location || null,
      notes: data.notes || null,
    };

    logger.info(`Break started for shift ${data.shiftId}: ${breakRecord.id}`);
    return breakRecord;
  }

  /**
   * End break (simplified implementation)
   */
  async endBreak(data: any) {
    // Validate shift exists
    const shift = await prisma.shift.findUnique({
      where: { id: data.shiftId },
    });

    if (!shift) {
      throw new NotFoundError('Shift not found');
    }

    // For simplified version, we'll just return a mock updated break object
    const breakRecord = {
      id: data.breakId,
      shiftId: data.shiftId,
      type: 'REST',
      startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      endTime: new Date().toISOString(),
      location: data.location || null,
      notes: data.notes || null,
      duration: 15, // 15 minutes
    };

    logger.info(`Break ended for shift ${data.shiftId}: ${data.breakId}`);
    return breakRecord;
  }

  /**
   * Get shifts by date for admin scheduling (using Shift table)
   */
  async getShiftsByDate(date: Date, guardId?: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const whereClause: any = {
      scheduledStartTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (guardId) {
      whereClause.guardId = guardId;
    }

    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: {
        guard: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        site: {
          include: {
            client: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        client: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledStartTime: 'asc',
      },
    });

    return shifts;
  }

  /**
   * Report incident (simplified implementation)
   */
  async reportIncident(data: any) {
    // Validate shift exists
    const shift = await prisma.shift.findUnique({
      where: { id: data.shiftId },
    });

    if (!shift) {
      throw new NotFoundError('Shift not found');
    }

    // For simplified version, we'll just return a mock incident object
    const incident = {
      id: `incident_${Date.now()}`,
      shiftId: data.shiftId,
      guardId: shift.guardId,
      type: data.incidentType || 'GENERAL',
      severity: data.severity || 'LOW',
      title: data.title || 'Incident Report',
      description: data.description || 'No description provided',
      location: data.location || null,
      attachments: data.attachments || [],
      reportedAt: new Date().toISOString(),
      status: 'OPEN',
    };

    logger.info(`Incident reported for shift ${data.shiftId}: ${incident.id}`);
    return incident;
  }
}

export default new ShiftServiceSimple();
