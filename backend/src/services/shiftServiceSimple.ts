// Simplified Shift Service for Phase 2 Testing
import prisma from '../config/database.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { ShiftAssignmentStatus } from '@prisma/client';

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
   * Get shift statistics for a guard (using ShiftAssignment)
   */
  async getGuardShiftStats(guardId: string, startDate?: Date, endDate?: Date): Promise<ShiftStats> {
    const whereClause: any = { guardId };

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime.gte = startDate;
      if (endDate) whereClause.startTime.lte = endDate;
    }

    const assignments = await prisma.shiftAssignment.findMany({
      where: whereClause,
      include: {
        site: true,
      },
    });

    const completedShifts = assignments.filter(a => a.status === ShiftAssignmentStatus.COMPLETED).length;
    const missedShifts = assignments.filter(a => 
      a.status === ShiftAssignmentStatus.CANCELLED || a.status === ShiftAssignmentStatus.MISSED
    ).length;
    
    // Get unique sites from assignments
    const uniqueSiteIds = new Set(
      assignments
        .map(a => a.siteId)
        .filter(id => id !== null)
    );
    const totalSites = uniqueSiteIds.size;

    // Count incident reports from AssignmentReports
    const assignmentIds = assignments.map(a => a.id);
    const incidentReports = await prisma.assignmentReport.count({
      where: {
        shiftAssignmentId: { in: assignmentIds },
        type: 'INCIDENT',
      },
    });

    // Calculate total hours
    const completedAssignments = assignments.filter(a => 
      a.status === ShiftAssignmentStatus.COMPLETED && 
      a.checkInTime && 
      a.checkOutTime
    );

    const totalMinutes = completedAssignments.reduce((total, assignment) => {
      if (assignment.checkInTime && assignment.checkOutTime) {
        const start = new Date(assignment.checkInTime).getTime();
        const end = new Date(assignment.checkOutTime).getTime();
        return total + Math.abs(end - start) / (1000 * 60);
      }
      return total;
    }, 0);

    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    const averageShiftDuration = completedAssignments.length > 0 
      ? Math.round((totalMinutes / completedAssignments.length) / 60 * 100) / 100 
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
   * Get active shift for a guard (using ShiftAssignment and Shift)
   */
  async getActiveShift(guardId: string) {
    // Check ShiftAssignment table first
    const assignment = await prisma.shiftAssignment.findFirst({
      where: {
        guardId,
        status: ShiftAssignmentStatus.IN_PROGRESS,
      },
      include: {
        shiftPosting: {
          include: {
            site: true,
            client: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        },
        site: true,
      },
    });

    if (assignment) {
      return this.transformAssignmentToShift(assignment);
    }

    // Check Shift table for admin-created shifts
    const shift = await prisma.shift.findFirst({
      where: {
        guardId,
        status: 'IN_PROGRESS',
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
    });

    if (shift) {
      return this.transformShiftToShift(shift);
    }

    return null;
  }

  /**
   * Get upcoming shifts for a guard (using ShiftAssignment and Shift)
   */
  async getUpcomingShifts(guardId: string, limit: number = 10) {
    const now = new Date();
    
    // Get shifts from ShiftAssignment table
    const assignments = await prisma.shiftAssignment.findMany({
      where: {
        guardId,
        status: ShiftAssignmentStatus.ASSIGNED,
        startTime: {
          gte: now,
        },
      },
      include: {
        shiftPosting: {
          include: {
            site: true,
            client: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        },
        site: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get shifts from Shift table (admin-created shifts)
    const shifts = await prisma.shift.findMany({
      where: {
        guardId,
        status: { in: ['SCHEDULED'] },
        scheduledStartTime: {
          gte: now,
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

    // Transform and merge both sources
    const assignmentShifts = assignments.map(a => this.transformAssignmentToShift(a));
    const directShifts = shifts.map(s => this.transformShiftToShift(s));
    
    // Combine and sort by start time, then limit
    const allShifts = [...assignmentShifts, ...directShifts]
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, limit);

    return allShifts;
  }

  /**
   * Get today's shifts for a guard (using ShiftAssignment and Shift)
   */
  async getTodayShifts(guardId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get shifts from ShiftAssignment table
    const assignments = await prisma.shiftAssignment.findMany({
      where: {
        guardId,
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        shiftPosting: {
          include: {
            site: true,
            client: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        },
        site: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get shifts from Shift table (admin-created shifts)
    const shifts = await prisma.shift.findMany({
      where: {
        guardId,
        scheduledStartTime: {
          gte: today,
          lt: tomorrow,
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

    // Transform and merge both sources
    const assignmentShifts = assignments.map(a => this.transformAssignmentToShift(a));
    const directShifts = shifts.map(s => this.transformShiftToShift(s));
    
    // Combine and sort by start time
    const allShifts = [...assignmentShifts, ...directShifts]
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return allShifts;
  }

  /**
   * Get past shifts for a guard (using ShiftAssignment and Shift)
   */
  async getPastShifts(guardId: string, limit: number = 20) {
    const now = new Date();

    // Get shifts from ShiftAssignment table
    const assignments = await prisma.shiftAssignment.findMany({
      where: {
        guardId,
        status: { in: [ShiftAssignmentStatus.COMPLETED, ShiftAssignmentStatus.CANCELLED] },
        endTime: {
          lt: now,
        },
      },
      include: {
        shiftPosting: {
          include: {
            site: true,
            client: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        },
        site: true,
      },
      orderBy: {
        endTime: 'desc',
      },
    });

    // Get shifts from Shift table (admin-created shifts)
    const shifts = await prisma.shift.findMany({
      where: {
        guardId,
        status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] },
        scheduledEndTime: {
          lt: now,
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
        scheduledEndTime: 'desc',
      },
    });

    // Transform and merge both sources
    const assignmentShifts = assignments.map(a => this.transformAssignmentToShift(a));
    const directShifts = shifts.map(s => this.transformShiftToShift(s));
    
    // Combine and sort by end time (descending), then limit
    const allShifts = [...assignmentShifts, ...directShifts]
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
      .slice(0, limit);

    return allShifts;
  }

  /**
   * Get weekly shift summary for a guard (using ShiftAssignment and Shift)
   */
  async getWeeklyShiftSummary(guardId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Get shifts from ShiftAssignment table
    const assignments = await prisma.shiftAssignment.findMany({
      where: {
        guardId,
        startTime: {
          gte: startOfWeek,
          lt: endOfWeek,
        },
      },
      include: {
        shiftPosting: {
          include: {
            site: true,
            client: {
              include: {
                user: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        },
        site: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Get shifts from Shift table (admin-created shifts)
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

    // Transform and merge both sources
    const assignmentShifts = assignments.map(a => this.transformAssignmentToShift(a));
    const directShifts = shifts.map(s => this.transformShiftToShift(s));
    
    // Combine and sort by start time
    const allShifts = [...assignmentShifts, ...directShifts]
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return allShifts;
  }

  /**
   * Transform ShiftAssignment to Shift format for frontend compatibility
   */
  private transformAssignmentToShift(assignment: any) {
    const site = assignment.site || assignment.shiftPosting?.site;
    const client = assignment.shiftPosting?.client;
    
    return {
      id: assignment.id,
      guardId: assignment.guardId,
      locationName: site?.name || 'Unknown Site',
      locationAddress: site?.address || '',
      scheduledStartTime: assignment.startTime,
      scheduledEndTime: assignment.endTime,
      startTime: assignment.startTime,
      endTime: assignment.endTime,
      checkInTime: assignment.checkInTime,
      checkOutTime: assignment.checkOutTime,
      status: this.mapAssignmentStatusToShiftStatus(assignment.status),
      description: assignment.shiftPosting?.description || '',
      notes: assignment.notes || '',
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

  /**
   * Map ShiftAssignmentStatus to ShiftStatus
   */
  private mapAssignmentStatusToShiftStatus(status: ShiftAssignmentStatus): string {
    const statusMap: Record<ShiftAssignmentStatus, string> = {
      ASSIGNED: 'SCHEDULED',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
      MISSED: 'NO_SHOW',
    };
    return statusMap[status] || 'SCHEDULED';
  }

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
