import { PrismaClient, ShiftStatus, Shift } from '@prisma/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

export interface CreateShiftData {
  guardId: string;
  locationId?: string;
  locationName: string;
  locationAddress: string;
  startTime: Date;
  endTime: Date;
  breakStartTime?: Date;
  breakEndTime?: Date;
  description?: string;
  notes?: string;
}

export interface CheckInData {
  shiftId: string;
  guardId: string;
  checkInTime: Date;
  latitude?: number;
  longitude?: number;
}

export interface CheckOutData {
  shiftId: string;
  guardId: string;
  checkOutTime: Date;
  latitude?: number;
  longitude?: number;
}

export interface ShiftStats {
  completedShifts: number;
  missedShifts: number;
  totalSites: number;
  incidentReports: number;
}

class ShiftService {
  /**
   * Create a new shift
   */
  async createShift(data: CreateShiftData): Promise<Shift> {
    return await prisma.shift.create({
      data: {
        guardId: data.guardId,
        locationId: data.locationId,
        locationName: data.locationName,
        locationAddress: data.locationAddress,
        startTime: data.startTime,
        endTime: data.endTime,
        breakStartTime: data.breakStartTime,
        breakEndTime: data.breakEndTime,
        description: data.description,
        notes: data.notes,
        status: ShiftStatus.SCHEDULED,
      },
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
        startTime: 'asc',
      },
    });
  }
}

export default new ShiftService();
