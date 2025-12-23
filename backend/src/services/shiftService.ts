import { PrismaClient, ShiftStatus, Shift, BreakType, IncidentType, IncidentSeverity } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInMinutes, addDays } from 'date-fns';
import { NotFoundError, BadRequestError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import shiftConflictService, { ConflictInfo } from './shiftConflictService.js';
import websocketService from './websocketService.js';

const prisma = new PrismaClient();

/**
 * Transform shift data to match frontend expectations
 * Maps scheduledStartTime/scheduledEndTime to startTime/endTime
 */
function transformShiftForFrontend(shift: any): any {
  if (!shift) return shift;
  
  // If it's an array, transform each item
  if (Array.isArray(shift)) {
    return shift.map(transformShiftForFrontend);
  }
  
  // Transform single shift object
  const transformed = {
    ...shift,
    startTime: shift.scheduledStartTime || shift.startTime,
    endTime: shift.scheduledEndTime || shift.endTime,
    checkInTime: shift.actualStartTime || shift.checkInTime,
    checkOutTime: shift.actualEndTime || shift.checkOutTime,
  };
  
  // Remove the scheduled* fields if they exist (keep them for now in case frontend needs them)
  // delete transformed.scheduledStartTime;
  // delete transformed.scheduledEndTime;
  
  return transformed;
}

export interface CreateShiftData {
  guardId?: string; // Optional - can be assigned later by admin
  siteId?: string;
  clientId?: string;
  locationId?: string;
  locationName: string;
  locationAddress: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  description?: string;
  notes?: string;
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

export interface StartBreakData {
  shiftId: string;
  guardId: string;
  breakType: BreakType;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  notes?: string;
}

export interface EndBreakData {
  shiftId: string;
  guardId: string;
  breakId: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  notes?: string;
}

export interface ReportIncidentData {
  shiftId: string;
  guardId: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  };
  attachments?: string[];
}

export interface ShiftStats {
  completedShifts: number;
  missedShifts: number;
  totalSites: number;
  incidentReports: number;
  totalHours: number;
  averageShiftDuration: number;
}

class ShiftService {
  /**
   * Create a new shift
   * Guard can be assigned later via assignGuardToShift method
   */
  async createShift(data: CreateShiftData, securityCompanyId?: string): Promise<any> {
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
    let clientId: string | null = data.clientId || null;
    
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

    // Check for conflicts if guard is provided
    if (data.guardId) {
      const conflicts = await shiftConflictService.detectConflicts({
        guardId: data.guardId,
        siteId: siteId || undefined,
        scheduledStartTime: data.scheduledStartTime,
        scheduledEndTime: data.scheduledEndTime,
      });

      // Block creation if there are error-level conflicts
      const blockingConflicts = conflicts.filter((c: ConflictInfo) => c.severity === 'error');
      if (blockingConflicts.length > 0) {
        const errorMessages = blockingConflicts.map((c: ConflictInfo) => c.message).join('; ');
        throw new ValidationError(`Cannot create shift: ${errorMessages}`);
      }

      // Log warnings but allow creation
      const warnings = conflicts.filter((c: ConflictInfo) => c.severity === 'warning');
      if (warnings.length > 0) {
        logger.warn(`Shift creation warnings: ${warnings.map((c: ConflictInfo) => c.message).join('; ')}`);
      }
    }

    const shiftData: any = {
      siteId: siteId,
      clientId: clientId,
      locationId: data.locationId,
      locationName: data.locationName,
      locationAddress: data.locationAddress,
      scheduledStartTime: data.scheduledStartTime,
      scheduledEndTime: data.scheduledEndTime,
      description: data.description,
      notes: data.notes,
    };

    // Only include guardId if provided (nullable field)
    if (data.guardId) {
      shiftData.guardId = data.guardId;
    }

    const shift = await prisma.shift.create({
      data: shiftData,
      include: {
        guard: data.guardId ? {
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
        } : undefined,
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
        location: true,
      },
    });

    logger.info(`Shift created${data.guardId ? ` for guard ${data.guardId}` : ' (unassigned)'}${siteId ? ` at site ${siteId}` : ''}: ${shift.id}`, {
      shiftId: shift.id,
      guardId: shift.guardId,
      scheduledStartTime: shift.scheduledStartTime,
      scheduledEndTime: shift.scheduledEndTime,
      status: shift.status,
    });

    return shift;
  }

  /**
   * Assign a guard to an existing shift
   */
  async assignGuardToShift(shiftId: string, guardId: string, securityCompanyId?: string): Promise<any> {
    // Validate shift exists and is unassigned
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        site: true,
        client: true,
      },
    });

    if (!shift) {
      throw new NotFoundError('Shift not found');
    }

    if (shift.guardId) {
      throw new ValidationError('Shift already has a guard assigned');
    }

    if (shift.status !== 'SCHEDULED') {
      throw new ValidationError('Can only assign guard to scheduled shifts');
    }

    // Validate guard exists and belongs to company
    const guard = await prisma.guard.findUnique({
      where: { id: guardId },
      include: {
        companyGuards: {
          where: { isActive: true },
          select: { securityCompanyId: true },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
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

    // Check for conflicts using conflict service
    const conflicts = await shiftConflictService.detectConflicts({
      guardId: guardId,
      siteId: shift.siteId || undefined,
      scheduledStartTime: shift.scheduledStartTime,
      scheduledEndTime: shift.scheduledEndTime,
      excludeShiftId: shiftId, // Exclude current shift from conflict checks
    });

    // Block assignment if there are error-level conflicts
    const blockingConflicts = conflicts.filter((c: ConflictInfo) => c.severity === 'error');
    if (blockingConflicts.length > 0) {
      const errorMessages = blockingConflicts.map((c: ConflictInfo) => c.message).join('; ');
      throw new ValidationError(`Cannot assign guard: ${errorMessages}`);
    }

    // Log warnings but allow assignment
    const warnings = conflicts.filter((c: ConflictInfo) => c.severity === 'warning');
    if (warnings.length > 0) {
      logger.warn(`Guard assignment warnings: ${warnings.map((c: ConflictInfo) => c.message).join('; ')}`);
    }

    // Assign guard to shift
    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        guardId: guardId,
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
              },
            },
          },
        },
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
        location: true,
      },
    });

    logger.info(`Guard ${guardId} assigned to shift ${shiftId}`);

    return updatedShift;
  }

  /**
   * Get shift by ID
   */
  async getShiftById(shiftId: string) {
    return await prisma.shift.findUnique({
      where: { id: shiftId },
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
        location: true,
        shiftReports: true,
      },
    });
  }

  /**
   * Get guard's shifts by status
   */
  async getGuardShiftsByStatus(guardId: string, status: ShiftStatus) {
    return await prisma.shift.findMany({
      where: {
        guardId,
        status,
      },
      include: {
        location: true,
        shiftReports: true,
      },
      orderBy: {
        scheduledStartTime: 'asc',
      },
    });
  }

  /**
   * Get guard's today shifts
   */
  async getGuardTodayShifts(guardId: string) {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    const shifts = await prisma.shift.findMany({
      where: {
        guardId,
        scheduledStartTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: {
        location: true,
        shiftReports: true,
      },
      orderBy: {
        scheduledStartTime: 'asc',
      },
    });
    
    return transformShiftForFrontend(shifts);
  }

  /**
   * Get guard's upcoming shifts
   */
  async getGuardUpcomingShifts(guardId: string) {
    const now = new Date();

    const shifts = await prisma.shift.findMany({
      where: {
        guardId,
        scheduledStartTime: {
          gt: now,
        },
        status: ShiftStatus.SCHEDULED,
      },
      include: {
        location: true,
      },
      orderBy: {
        scheduledStartTime: 'asc',
      },
      take: 10,
    });
    
    return transformShiftForFrontend(shifts);
  }

  /**
   * Get guard's past shifts
   */
  async getGuardPastShifts(guardId: string, limit: number = 20) {
    const now = new Date();

    const shifts = await prisma.shift.findMany({
      where: {
        guardId,
        scheduledEndTime: {
          lt: now,
        },
        status: {
          in: [ShiftStatus.COMPLETED, ShiftStatus.NO_SHOW],
        },
      },
      include: {
        location: true,
        shiftReports: true,
      },
      orderBy: {
        scheduledStartTime: 'desc',
      },
      take: limit,
    });
    
    return transformShiftForFrontend(shifts);
  }

  /**
   * Get guard's weekly shift summary
   */
  async getGuardWeeklyShiftSummary(guardId: string) {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const shifts = await prisma.shift.findMany({
      where: {
        guardId,
        scheduledStartTime: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: {
        location: true,
      },
      orderBy: {
        scheduledStartTime: 'asc',
      },
    });
    
    return transformShiftForFrontend(shifts);
  }

  /**
   * Get guard's monthly stats
   */
  async getGuardMonthlyStats(guardId: string): Promise<ShiftStats> {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const [completedShifts, missedShifts, totalSites, incidentReports, shifts] = await Promise.all([
      // Completed shifts this month
      prisma.shift.count({
        where: {
          guardId,
          status: ShiftStatus.COMPLETED,
          scheduledStartTime: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
      // Missed shifts this month
      prisma.shift.count({
        where: {
          guardId,
          status: ShiftStatus.NO_SHOW,
          scheduledStartTime: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
      // Total unique sites this month
      prisma.shift.findMany({
        where: {
          guardId,
          scheduledStartTime: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: {
          locationId: true,
        },
        distinct: ['locationId'],
      }),
      // Incident reports this month
      prisma.incident.count({
        where: {
          reportedBy: guardId,
          reportedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
      // Get all shifts for this month to calculate hours
      prisma.shift.findMany({
        where: {
          guardId,
          scheduledStartTime: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: {
          status: true,
          actualStartTime: true,
          actualEndTime: true,
        },
      }),
    ]);

    // Calculate total hours and average duration
    const completedShiftsWithTimes = shifts.filter(s => 
      s.status === 'COMPLETED' && s.actualStartTime && s.actualEndTime
    );

    const totalMinutes = completedShiftsWithTimes.reduce((total, shift) => {
      if (shift.actualStartTime && shift.actualEndTime) {
        return total + differenceInMinutes(shift.actualEndTime, shift.actualStartTime);
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
      totalSites: totalSites.length,
      incidentReports,
      totalHours,
      averageShiftDuration,
    };
  }

  /**
   * Check in to a shift
   */
  async checkIn(data: CheckInData) {
    const shift = await prisma.shift.findUnique({
      where: { id: data.shiftId },
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    if (shift.guardId !== data.guardId) {
      throw new Error('Unauthorized: This shift does not belong to you');
    }

    if (shift.status === ShiftStatus.IN_PROGRESS) {
      throw new Error('Already checked in to this shift');
    }

    if (shift.status === ShiftStatus.COMPLETED) {
      throw new Error('This shift is already completed');
    }

    // Update shift status and check-in time
    const updatedShift = await prisma.shift.update({
      where: { id: data.shiftId },
      data: {
        status: ShiftStatus.IN_PROGRESS,
        actualStartTime: data.timestamp,
        checkInLocation: data.location ? {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          accuracy: data.location.accuracy,
          address: data.location.address,
        } : undefined,
      },
      include: {
        location: true,
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
      },
    });

    // Create tracking record if location provided
    if (data.location && data.location.latitude && data.location.longitude && data.guardId) {
      await prisma.trackingRecord.create({
        data: {
          guardId: data.guardId,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          timestamp: data.timestamp,
        },
      });
    }

    return updatedShift;
  }

  /**
   * Check out from a shift
   */
  async checkOut(data: CheckOutData) {
    const shift = await prisma.shift.findUnique({
      where: { id: data.shiftId },
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    if (shift.guardId !== data.guardId) {
      throw new Error('Unauthorized: This shift does not belong to you');
    }

    if (shift.status !== ShiftStatus.IN_PROGRESS) {
      throw new Error('Cannot check out: Shift is not in progress');
    }

    // Update shift status and check-out time
    // Note: actualDuration is calculated, not stored in the database
    const updatedShift = await prisma.shift.update({
      where: { id: data.shiftId },
      data: {
        status: ShiftStatus.COMPLETED,
        actualEndTime: data.timestamp,
        checkOutLocation: data.location ? {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          accuracy: data.location.accuracy,
          address: data.location.address,
        } : undefined,
      },
      include: {
        location: true,
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
      },
    });

    // Create tracking record if location provided
    if (data.location && data.guardId) {
      await prisma.trackingRecord.create({
        data: {
          guardId: data.guardId,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          timestamp: data.timestamp,
        },
      });
    }

    return updatedShift;
  }

  /**
   * Mark shift as missed (automated job)
   */
  async markShiftAsMissed(shiftId: string) {
    return await prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: ShiftStatus.NO_SHOW,
      },
    });
  }

  /**
   * Get next upcoming shift for guard
   */
  async getNextUpcomingShift(guardId: string) {
    const now = new Date();

    const shift = await prisma.shift.findFirst({
      where: {
        guardId,
        scheduledStartTime: {
          gt: now,
        },
        status: ShiftStatus.SCHEDULED,
      },
      include: {
        location: true,
      },
      orderBy: {
        scheduledStartTime: 'asc',
      },
    });
    
    return transformShiftForFrontend(shift);
  }

  /**
   * Check in to shift
   */
  async checkInToShift(data: CheckInData) {
    // Find the shift
    const shift = await prisma.shift.findUnique({
      where: { id: data.shiftId },
      include: {
        guard: {
          include: {
            user: true,
          },
        },
        site: true,
      },
    });

    if (!shift) {
      throw new NotFoundError('Shift not found');
    }

    if (shift.guardId !== data.guardId) {
      throw new BadRequestError('Shift does not belong to this guard');
    }

    // Allow check-in if:
    // 1. Status is SCHEDULED (normal case)
    // 2. Status is IN_PROGRESS but actualStartTime is not set (shift was auto-started or seeded)
    // 3. Status is IN_PROGRESS and actualStartTime exists (allow updating check-in location)
    if (shift.status === 'COMPLETED' || shift.status === 'CANCELLED' || shift.status === 'NO_SHOW') {
      throw new BadRequestError(`Cannot check in to shift with status: ${shift.status}`);
    }

    // If already checked in (IN_PROGRESS with actualStartTime), allow updating location but don't change status
    if (shift.status === 'IN_PROGRESS' && shift.actualStartTime) {
      // Update check-in location only
      const updatedShift = await prisma.shift.update({
        where: { id: data.shiftId },
        data: {
          checkInLocation: {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            accuracy: data.location.accuracy,
            address: data.location.address,
            timestamp: data.timestamp.toISOString(),
          },
        },
        include: {
          guard: {
            include: {
              user: true,
            },
          },
          site: true,
          shiftBreaks: true,
          shiftIncidents: true,
        },
      });

      logger.info(`Guard ${data.guardId} updated check-in location for shift ${data.shiftId}`);
      return updatedShift;
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
      },
      include: {
        guard: {
          include: {
            user: true,
          },
        },
        site: true,
        shiftBreaks: true,
        shiftIncidents: true,
      },
    });

    logger.info(`Guard ${data.guardId} checked in to shift ${data.shiftId}`);

    // Broadcast shift status update
    websocketService.broadcastShiftStatusUpdate({
      shiftId: data.shiftId,
      guardId: data.guardId,
      status: 'IN_PROGRESS',
    });

    return updatedShift;
  }

  /**
   * Check out from shift
   */
  async checkOutFromShift(data: CheckOutData) {
    // Find the shift
    const shift = await prisma.shift.findUnique({
      where: { id: data.shiftId },
      include: {
        guard: {
          include: {
            user: true,
          },
        },
        site: true,
        shiftBreaks: true,
      },
    });

    if (!shift) {
      throw new NotFoundError('Shift not found');
    }

    if (shift.guardId !== data.guardId) {
      throw new BadRequestError('Shift does not belong to this guard');
    }

    if (shift.status !== 'IN_PROGRESS' && shift.status !== 'ON_BREAK') {
      throw new BadRequestError(`Cannot check out from shift with status: ${shift.status}`);
    }

    // Calculate total break time
    const totalBreakTime = shift.shiftBreaks.reduce((total, breakRecord) => {
      if (breakRecord.endTime) {
        return total + differenceInMinutes(breakRecord.endTime, breakRecord.startTime);
      }
      return total;
    }, 0);

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
        totalBreakTime,
        notes: data.notes || shift.notes,
      },
      include: {
        guard: {
          include: {
            user: true,
          },
        },
        site: true,
        shiftBreaks: true,
        shiftIncidents: true,
      },
    });

    logger.info(`Guard ${data.guardId} checked out from shift ${data.shiftId}`);

    // Broadcast shift status update
    websocketService.broadcastShiftStatusUpdate({
      shiftId: data.shiftId,
      guardId: data.guardId,
      status: 'COMPLETED',
    });

    return updatedShift;
  }

  /**
   * Start a break
   */
  async startBreak(data: StartBreakData) {
    // Validate shift
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
      throw new BadRequestError(`Cannot start break for shift with status: ${shift.status}`);
    }

    // Check if there's already an active break
    const activeBreak = await prisma.shiftBreak.findFirst({
      where: {
        shiftId: data.shiftId,
        endTime: null,
      },
    });

    if (activeBreak) {
      throw new BadRequestError('There is already an active break for this shift');
    }

    // Create break record
    const shiftBreak = await prisma.shiftBreak.create({
      data: {
        shiftId: data.shiftId,
        startTime: new Date(),
        breakType: data.breakType,
        location: data.location,
        notes: data.notes,
      },
    });

    // Update shift status
    await prisma.shift.update({
      where: { id: data.shiftId },
      data: { status: 'ON_BREAK' },
    });

    logger.info(`Guard ${data.guardId} started break for shift ${data.shiftId}`);

    // Broadcast status update
    websocketService.broadcastShiftStatusUpdate({
      shiftId: data.shiftId,
      guardId: data.guardId,
      status: 'ON_BREAK',
    });

    return shiftBreak;
  }

  /**
   * End a break
   */
  async endBreak(data: EndBreakData) {
    // Find the break
    const shiftBreak = await prisma.shiftBreak.findUnique({
      where: { id: data.breakId },
      include: {
        shift: true,
      },
    });

    if (!shiftBreak) {
      throw new NotFoundError('Break not found');
    }

    if (shiftBreak.shift.guardId !== data.guardId) {
      throw new BadRequestError('Break does not belong to this guard');
    }

    if (shiftBreak.endTime) {
      throw new BadRequestError('Break has already been ended');
    }

    // End the break
    const updatedBreak = await prisma.shiftBreak.update({
      where: { id: data.breakId },
      data: {
        endTime: new Date(),
        location: data.location,
        notes: data.notes || shiftBreak.notes,
      },
    });

    // Update shift status back to IN_PROGRESS
    await prisma.shift.update({
      where: { id: data.shiftId },
      data: { status: 'IN_PROGRESS' },
    });

    logger.info(`Guard ${data.guardId} ended break ${data.breakId} for shift ${data.shiftId}`);

    // Broadcast status update
    websocketService.broadcastShiftStatusUpdate({
      shiftId: data.shiftId,
      guardId: data.guardId,
      status: 'IN_PROGRESS',
    });

    return updatedBreak;
  }

  /**
   * Report an incident during shift
   */
  async reportIncident(data: ReportIncidentData) {
    // Validate shift
    const shift = await prisma.shift.findUnique({
      where: { id: data.shiftId },
    });

    if (!shift) {
      throw new NotFoundError('Shift not found');
    }

    if (shift.guardId !== data.guardId) {
      throw new BadRequestError('Shift does not belong to this guard');
    }

    if (shift.status !== 'IN_PROGRESS' && shift.status !== 'ON_BREAK') {
      throw new BadRequestError(`Cannot report incident for shift with status: ${shift.status}`);
    }

    // Create incident
    const incident = await prisma.shiftIncident.create({
      data: {
        shiftId: data.shiftId,
        incidentType: data.incidentType,
        severity: data.severity,
        title: data.title,
        description: data.description,
        location: data.location,
        attachments: data.attachments,
      },
    });

    // Update shift incident count
    await prisma.shift.update({
      where: { id: data.shiftId },
      data: {
        incidentCount: {
          increment: 1,
        },
      },
    });

    logger.warn(`Incident reported by guard ${data.guardId} for shift ${data.shiftId}: ${data.title}`);

    // Broadcast incident alert
    websocketService.broadcastIncidentAlert({
      incidentId: incident.id,
      shiftId: data.shiftId,
      guardId: data.guardId,
      message: `${data.incidentType}: ${data.title}`,
    });

    return incident;
  }

  /**
   * Get shift statistics for a guard
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
        shiftIncidents: true,
      },
    });

    const completedShifts = shifts.filter(s => s.status === 'COMPLETED').length;
    const missedShifts = shifts.filter(s => s.status === 'NO_SHOW' || s.status === 'CANCELLED').length;
    const totalSites = new Set(shifts.map(s => s.siteId).filter(Boolean)).size;
    const incidentReports = shifts.reduce((total, s) => total + s.incidentCount, 0);

    // Calculate total hours and average duration
    const completedShiftsWithTimes = shifts.filter(s => 
      s.status === 'COMPLETED' && s.actualStartTime && s.actualEndTime
    );

    const totalMinutes = completedShiftsWithTimes.reduce((total, shift) => {
      if (shift.actualStartTime && shift.actualEndTime) {
        return total + differenceInMinutes(shift.actualEndTime, shift.actualStartTime);
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
   * Get active shift for a guard
   */
  async getActiveShift(guardId: string) {
    const shift = await prisma.shift.findFirst({
      where: {
        guardId,
        status: {
          in: ['IN_PROGRESS', 'ON_BREAK'],
        },
      },
      include: {
        site: true,
        shiftBreaks: {
          where: {
            endTime: null,
          },
        },
        shiftIncidents: {
          orderBy: {
            reportedAt: 'desc',
          },
          take: 5,
        },
      },
    });
    
    return transformShiftForFrontend(shift);
  }

  /**
   * Get upcoming shifts for a guard
   */
  async getUpcomingShifts(guardId: string, limit: number = 10) {
    return await prisma.shift.findMany({
      where: {
        guardId,
        status: 'SCHEDULED',
        scheduledStartTime: {
          gte: new Date(),
        },
      },
      include: {
        site: true,
      },
      orderBy: {
        scheduledStartTime: 'asc',
      },
      take: limit,
    });
  }

  /**
   * Get shifts by date range (for 30-day schedule view)
   */
  async getShiftsByDateRange(
    startDate: Date,
    endDate: Date,
    options?: {
      guardId?: string;
      clientId?: string;
      siteId?: string;
      securityCompanyId?: string;
    }
  ) {
    const whereClause: any = {
      scheduledStartTime: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (options?.guardId) {
      whereClause.guardId = options.guardId;
    }

    if (options?.clientId) {
      whereClause.clientId = options.clientId;
    }

    if (options?.siteId) {
      whereClause.siteId = options.siteId;
    }

    // Multi-tenant filtering by security company
    if (options?.securityCompanyId) {
      whereClause.OR = [
        // Guard belongs to company
        {
          guard: {
            companyGuards: {
              some: {
                securityCompanyId: options.securityCompanyId,
                isActive: true,
              },
            },
          },
        },
        // Client belongs to company
        {
          client: {
            companyClients: {
              some: {
                securityCompanyId: options.securityCompanyId,
                isActive: true,
              },
            },
          },
        },
        // Site belongs to company
        {
          site: {
            companySites: {
              some: {
                securityCompanyId: options.securityCompanyId,
                isActive: true,
              },
            },
          },
        },
      ];
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
        location: true,
      },
      orderBy: {
        scheduledStartTime: 'asc',
      },
    });

    return transformShiftForFrontend(shifts);
  }

  /**
   * Get client's shifts (for client dashboard)
   */
  async getClientShifts(
    clientId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      status?: ShiftStatus;
      siteId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      clientId,
    };

    if (options?.startDate || options?.endDate) {
      whereClause.scheduledStartTime = {};
      if (options.startDate) {
        whereClause.scheduledStartTime.gte = options.startDate;
      }
      if (options.endDate) {
        whereClause.scheduledStartTime.lte = options.endDate;
      }
    }

    if (options?.status) {
      whereClause.status = options.status;
    }

    if (options?.siteId) {
      whereClause.siteId = options.siteId;
    }

    const [shifts, total] = await Promise.all([
      prisma.shift.findMany({
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
          site: true,
          location: true,
        },
        orderBy: {
          scheduledStartTime: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.shift.count({ where: whereClause }),
    ]);

    return {
      shifts: transformShiftForFrontend(shifts),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get 30-day schedule for guard or admin
   */
  async get30DaySchedule(
    guardId?: string,
    securityCompanyId?: string,
    startDate?: Date
  ) {
    const start = startDate || new Date();
    const end = addDays(start, 30);

    return this.getShiftsByDateRange(start, end, {
      guardId,
      securityCompanyId,
    });
  }
}

export default new ShiftService();
