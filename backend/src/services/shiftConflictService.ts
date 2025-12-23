/**
 * Shift Conflict Detection Service
 * Detects scheduling conflicts when creating or assigning shifts
 */

import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';
import { startOfWeek, endOfWeek } from 'date-fns';

export interface ConflictInfo {
  type: 'OVERLAP' | 'OVERTIME' | 'REST_PERIOD' | 'SITE_CAPACITY';
  message: string;
  severity: 'warning' | 'error';
  conflictingShiftId?: string;
}

export interface ShiftConflictData {
  guardId?: string;
  siteId?: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  excludeShiftId?: string; // Exclude this shift from conflict checks (for updates)
}

class ShiftConflictService {
  /**
   * Detect all conflicts for a shift
   */
  async detectConflicts(data: ShiftConflictData): Promise<ConflictInfo[]> {
    const conflicts: ConflictInfo[] = [];

    if (!data.guardId) {
      // Can't check conflicts without guard
      return conflicts;
    }

    // Check overlapping shifts
    const overlapConflicts = await this.checkOverlappingShifts(data);
    conflicts.push(...overlapConflicts);

    // Check overtime limits
    const overtimeConflicts = await this.checkOvertimeLimits(data);
    conflicts.push(...overtimeConflicts);

    // Check rest periods
    const restPeriodConflicts = await this.checkRestPeriods(data);
    conflicts.push(...restPeriodConflicts);

    // Check site capacity
    const siteCapacityConflicts = await this.checkSiteCapacity(data);
    conflicts.push(...siteCapacityConflicts);

    return conflicts;
  }

  /**
   * Check for overlapping shifts for the same guard
   */
  private async checkOverlappingShifts(data: ShiftConflictData): Promise<ConflictInfo[]> {
    if (!data.guardId) return [];

    const overlappingShifts = await prisma.shift.findMany({
      where: {
        guardId: data.guardId,
        id: data.excludeShiftId ? { not: data.excludeShiftId } : undefined,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS'],
        },
        OR: [
          // Shift starts during existing shift
          {
            scheduledStartTime: {
              gte: data.scheduledStartTime,
              lt: data.scheduledEndTime,
            },
          },
          // Shift ends during existing shift
          {
            scheduledEndTime: {
              gt: data.scheduledStartTime,
              lte: data.scheduledEndTime,
            },
          },
          // Shift completely contains existing shift
          {
            scheduledStartTime: {
              lte: data.scheduledStartTime,
            },
            scheduledEndTime: {
              gte: data.scheduledEndTime,
            },
          },
        ],
      },
      select: {
        id: true,
        scheduledStartTime: true,
        scheduledEndTime: true,
      },
    });

    if (overlappingShifts.length > 0) {
      return [
        {
          type: 'OVERLAP',
          message: `Guard has ${overlappingShifts.length} overlapping shift(s) at this time`,
          severity: 'error',
          conflictingShiftId: overlappingShifts[0].id,
        },
      ];
    }

    return [];
  }

  /**
   * Check if shift would exceed weekly overtime limits
   */
  private async checkOvertimeLimits(data: ShiftConflictData): Promise<ConflictInfo[]> {
    if (!data.guardId) return [];

    const shiftDurationHours =
      (data.scheduledEndTime.getTime() - data.scheduledStartTime.getTime()) / (1000 * 60 * 60);

    // Get week start and end for the shift date
    const weekStart = startOfWeek(data.scheduledStartTime, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(data.scheduledStartTime, { weekStartsOn: 1 });

    // Get all shifts for this guard in the same week
    const weekShifts = await prisma.shift.findMany({
      where: {
        guardId: data.guardId,
        id: data.excludeShiftId ? { not: data.excludeShiftId } : undefined,
        scheduledStartTime: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'],
        },
      },
      select: {
        scheduledStartTime: true,
        scheduledEndTime: true,
      },
    });

    // Calculate total hours for the week
    let totalHours = shiftDurationHours;
    for (const shift of weekShifts) {
      const hours =
        (shift.scheduledEndTime.getTime() - shift.scheduledStartTime.getTime()) / (1000 * 60 * 60);
      totalHours += hours;
    }

    // Standard work week is 40 hours, overtime threshold at 40 hours
    const MAX_WEEKLY_HOURS = 40;
    const OVERTIME_WARNING_THRESHOLD = 45; // Warning at 45 hours

    if (totalHours > OVERTIME_WARNING_THRESHOLD) {
      return [
        {
          type: 'OVERTIME',
          message: `This shift would result in ${totalHours.toFixed(1)} hours this week (exceeds ${OVERTIME_WARNING_THRESHOLD}h limit)`,
          severity: 'error',
        },
      ];
    } else if (totalHours > MAX_WEEKLY_HOURS) {
      return [
        {
          type: 'OVERTIME',
          message: `This shift would result in ${totalHours.toFixed(1)} hours this week (overtime)`,
          severity: 'warning',
        },
      ];
    }

    return [];
  }

  /**
   * Check if guard has sufficient rest period between shifts
   */
  private async checkRestPeriods(data: ShiftConflictData): Promise<ConflictInfo[]> {
    if (!data.guardId) return [];

    const MIN_REST_HOURS = 8; // Minimum 8 hours rest between shifts

    // Check previous shift (ending before this shift starts)
    const previousShift = await prisma.shift.findFirst({
      where: {
        guardId: data.guardId,
        id: data.excludeShiftId ? { not: data.excludeShiftId } : undefined,
        scheduledEndTime: {
          lte: data.scheduledStartTime,
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'],
        },
      },
      orderBy: {
        scheduledEndTime: 'desc',
      },
      select: {
        id: true,
        scheduledEndTime: true,
      },
    });

    if (previousShift) {
      const restHours =
        (data.scheduledStartTime.getTime() - previousShift.scheduledEndTime.getTime()) /
        (1000 * 60 * 60);

      if (restHours < MIN_REST_HOURS) {
        return [
          {
            type: 'REST_PERIOD',
            message: `Insufficient rest period: Only ${restHours.toFixed(1)} hours between shifts (minimum ${MIN_REST_HOURS}h required)`,
            severity: 'warning',
            conflictingShiftId: previousShift.id,
          },
        ];
      }
    }

    // Check next shift (starting after this shift ends)
    const nextShift = await prisma.shift.findFirst({
      where: {
        guardId: data.guardId,
        id: data.excludeShiftId ? { not: data.excludeShiftId } : undefined,
        scheduledStartTime: {
          gte: data.scheduledEndTime,
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS'],
        },
      },
      orderBy: {
        scheduledStartTime: 'asc',
      },
      select: {
        id: true,
        scheduledStartTime: true,
      },
    });

    if (nextShift) {
      const restHours =
        (nextShift.scheduledStartTime.getTime() - data.scheduledEndTime.getTime()) /
        (1000 * 60 * 60);

      if (restHours < MIN_REST_HOURS) {
        return [
          {
            type: 'REST_PERIOD',
            message: `Insufficient rest period: Only ${restHours.toFixed(1)} hours before next shift (minimum ${MIN_REST_HOURS}h required)`,
            severity: 'warning',
            conflictingShiftId: nextShift.id,
          },
        ];
      }
    }

    return [];
  }

  /**
   * Check if site has capacity for another guard
   */
  private async checkSiteCapacity(data: ShiftConflictData): Promise<ConflictInfo[]> {
    if (!data.siteId) return [];

    // Get site capacity (assuming maxGuards field exists in Site model)
    // For now, we'll skip this check as it might not be in the schema
    // Can be implemented if Site model has capacity field

    // Check existing shifts at the same site during the same time
    const existingShifts = await prisma.shift.findMany({
      where: {
        siteId: data.siteId,
        id: data.excludeShiftId ? { not: data.excludeShiftId } : undefined,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS'],
        },
        OR: [
          {
            scheduledStartTime: {
              gte: data.scheduledStartTime,
              lt: data.scheduledEndTime,
            },
          },
          {
            scheduledEndTime: {
              gt: data.scheduledStartTime,
              lte: data.scheduledEndTime,
            },
          },
          {
            scheduledStartTime: {
              lte: data.scheduledStartTime,
            },
            scheduledEndTime: {
              gte: data.scheduledEndTime,
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    // If site has maxGuards field, check capacity
    // For now, just log if there are many overlapping shifts
    if (existingShifts.length > 5) {
      return [
        {
          type: 'SITE_CAPACITY',
          message: `${existingShifts.length} other shift(s) at this site during this time`,
          severity: 'warning',
        },
      ];
    }

    return [];
  }

  /**
   * Check if conflicts are blocking (errors) or just warnings
   */
  hasBlockingConflicts(conflicts: ConflictInfo[]): boolean {
    return conflicts.some(c => c.severity === 'error');
  }
}

export default new ShiftConflictService();

