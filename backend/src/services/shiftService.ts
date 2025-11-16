import { PrismaClient, ShiftStatus, Shift, BreakType, IncidentType, IncidentSeverity } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInMinutes } from 'date-fns';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import websocketService from './websocketService.js';

const prisma = new PrismaClient();

export interface CreateShiftData {
  guardId: string;
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
   */
  async createShift(data: CreateShiftData): Promise<any> {
    // Validate guard exists
    const guard = await prisma.guard.findUnique({
      where: { id: data.guardId },
    });

    if (!guard) {
      throw new NotFoundError('Guard not found');
    }

    // Validate site exists if provided
    if (data.siteId) {
      const site = await prisma.site.findUnique({
        where: { id: data.siteId },
      });

      if (!site) {
        throw new NotFoundError('Site not found');
      }
    }

    const shift = await prisma.shift.create({
      data: {
        guardId: data.guardId,
        locationId: data.locationId,
        locationName: data.locationName,
        locationAddress: data.locationAddress,
        startTime: data.scheduledStartTime,
        endTime: data.scheduledEndTime,
        description: data.description,
        notes: data.notes,
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
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        location: true,
      },
    });
  }

  /**
   * Get shift by ID
   */
  async getShiftById(shiftId: string) {
    return await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        guard: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
        startTime: 'asc',
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

    return await prisma.shift.findMany({
      where: {
        guardId,
        startTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: {
        location: true,
        shiftReports: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  /**
   * Get guard's upcoming shifts
   */
  async getGuardUpcomingShifts(guardId: string) {
    const now = new Date();

    return await prisma.shift.findMany({
      where: {
        guardId,
        startTime: {
          gt: now,
        },
        status: ShiftStatus.SCHEDULED,
      },
      include: {
        location: true,
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 10,
    });
  }

  /**
   * Get guard's past shifts
   */
  async getGuardPastShifts(guardId: string, limit: number = 20) {
    const now = new Date();

    return await prisma.shift.findMany({
      where: {
        guardId,
        endTime: {
          lt: now,
        },
        status: {
          in: [ShiftStatus.COMPLETED, ShiftStatus.MISSED],
        },
      },
      include: {
        location: true,
        shiftReports: true,
      },
      orderBy: {
        startTime: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get guard's weekly shift summary
   */
  async getGuardWeeklyShiftSummary(guardId: string) {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    return await prisma.shift.findMany({
      where: {
        guardId,
        startTime: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: {
        location: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  /**
   * Get guard's monthly stats
   */
  async getGuardMonthlyStats(guardId: string): Promise<ShiftStats> {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const [completedShifts, missedShifts, totalSites, incidentReports] = await Promise.all([
      // Completed shifts this month
      prisma.shift.count({
        where: {
          guardId,
          status: ShiftStatus.COMPLETED,
          startTime: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
      // Missed shifts this month
      prisma.shift.count({
        where: {
          guardId,
          status: ShiftStatus.MISSED,
          startTime: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
      // Total unique sites this month
      prisma.shift.findMany({
        where: {
          guardId,
          startTime: {
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
    ]);

    return {
      completedShifts,
      missedShifts,
      totalSites: totalSites.length,
      incidentReports,
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
        checkInTime: data.checkInTime,
      },
      include: {
        location: true,
        guard: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create tracking record if location provided
    if (data.latitude && data.longitude) {
      const guard = await prisma.guard.findUnique({
        where: { userId: data.guardId },
      });

      if (guard) {
        await prisma.trackingRecord.create({
          data: {
            guardId: guard.id,
            latitude: data.latitude,
            longitude: data.longitude,
            timestamp: data.checkInTime,
          },
        });
      }
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

    // Calculate actual duration in minutes
    const checkInTime = shift.checkInTime || shift.startTime;
    const actualDuration = Math.floor(
      (data.checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60)
    );

    // Update shift status and check-out time
    const updatedShift = await prisma.shift.update({
      where: { id: data.shiftId },
      data: {
        status: ShiftStatus.COMPLETED,
        checkOutTime: data.checkOutTime,
        actualDuration,
      },
      include: {
        location: true,
        guard: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create tracking record if location provided
    if (data.latitude && data.longitude) {
      const guard = await prisma.guard.findUnique({
        where: { userId: data.guardId },
      });

      if (guard) {
        await prisma.trackingRecord.create({
          data: {
            guardId: guard.id,
            latitude: data.latitude,
            longitude: data.longitude,
            timestamp: data.checkOutTime,
          },
        });
      }
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
        status: ShiftStatus.MISSED,
      },
    });
  }

  /**
   * Get active shift for guard
   */
  async getActiveShift(guardId: string) {
    return await prisma.shift.findFirst({
      where: {
        guardId,
        status: ShiftStatus.IN_PROGRESS,
      },
      include: {
        location: true,
        shiftReports: true,
      },
    });
  }

  /**
   * Get next upcoming shift for guard
   */
  async getNextUpcomingShift(guardId: string) {
    const now = new Date();

    return await prisma.shift.findFirst({
      where: {
        guardId,
        startTime: {
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
      shift: updatedShift,
      location: data.location,
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
      shift: updatedShift,
      location: data.location,
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
      breakId: shiftBreak.id,
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
      breakId: data.breakId,
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
      incidentType: data.incidentType,
      severity: data.severity,
      title: data.title,
      location: data.location,
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
    return await prisma.shift.findFirst({
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
}

export default new ShiftService();
