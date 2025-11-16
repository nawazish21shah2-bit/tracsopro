// Simplified Shift Service for Phase 2 Testing
import { PrismaClient, ShiftStatus } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export interface CreateShiftData {
  guardId: string;
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
  async createShift(data: CreateShiftData) {
    // Validate guard exists
    const guard = await prisma.guard.findUnique({
      where: { id: data.guardId },
    });

    if (!guard) {
      throw new NotFoundError('Guard not found');
    }

    const shift = await prisma.shift.create({
      data: {
        guardId: data.guardId,
        locationName: data.locationName,
        locationAddress: data.locationAddress,
        scheduledStartTime: data.scheduledStartTime,
        scheduledEndTime: data.scheduledEndTime,
        description: data.description,
        notes: data.notes,
      } as any,
    });

    logger.info(`Shift created for guard ${data.guardId}: ${shift.id}`);
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
    return updatedShift;
  }

  /**
   * Get shift statistics for a guard (simplified)
   */
  async getGuardShiftStats(guardId: string, startDate?: Date, endDate?: Date): Promise<ShiftStats> {
    const whereClause: any = { guardId };

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime.gte = startDate;
      if (endDate) whereClause.startTime.lte = endDate;
    }

    const shifts = await prisma.shift.findMany({
      where: whereClause,
    });

    const completedShifts = shifts.filter(s => s.status === 'COMPLETED').length;
    const missedShifts = shifts.filter(s => s.status === 'MISSED' || s.status === 'CANCELLED').length;
    const totalSites = new Set(shifts.map(s => s.locationName)).size;
    const incidentReports = 0; // Simplified for now

    // Calculate total hours (simplified)
    const completedShiftsWithTimes = shifts.filter(s => 
      s.status === 'COMPLETED' && (s as any).actualStartTime && (s as any).actualEndTime
    );

    const totalMinutes = completedShiftsWithTimes.reduce((total, shift) => {
      if ((shift as any).actualStartTime && (shift as any).actualEndTime) {
        return total + Math.abs((shift as any).actualEndTime.getTime() - (shift as any).actualStartTime.getTime()) / (1000 * 60);
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
        status: 'IN_PROGRESS',
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
      } as any,
      orderBy: {
        scheduledStartTime: 'asc',
      } as any,
      take: limit,
    });
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
