/**
 * Operations Controller - Admin Operations Center
 * Handles operations metrics, guard statuses, and real-time data
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import prisma from '../config/database.js';
import { TrackingService } from '../services/trackingService.js';
import { EmergencyService } from '../services/emergencyService.js';
import { GuardStatus, ShiftAssignmentStatus } from '@prisma/client';

const trackingService = new TrackingService();
const emergencyService = EmergencyService.getInstance();

/**
 * Get operations metrics
 */
export const getOperationsMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Get all guards
    const totalGuards = await prisma.guard.count();

    // Get active guards (on duty)
    const activeGuards = await prisma.guard.count({
      where: {
        status: {
          in: [GuardStatus.ON_DUTY, GuardStatus.ACTIVE],
        },
      },
    });

    // Get guards on break (guards with active shift breaks)
    const activeBreaks = await prisma.shiftBreak.findMany({
      where: {
        endTime: null,
        shift: {
          status: 'IN_PROGRESS',
        },
      },
      select: {
        shift: {
          select: {
            guardId: true,
          },
        },
      },
      distinct: ['shiftId'],
    });
    const guardsOnBreak = activeBreaks.length;

    // Get offline guards
    const offlineGuards = await prisma.guard.count({
      where: {
        status: GuardStatus.OFF_DUTY,
      },
    });

    // Get active emergency alerts
    const activeAlerts = await emergencyService.getActiveEmergencyAlerts();
    const emergencyAlerts = activeAlerts.length;

    // Calculate site coverage (guards assigned to active sites / total active sites)
    const activeSites = await prisma.location.count({
      where: { isActive: true },
    });
    
    const sitesWithGuardsResult = await prisma.locationAssignment.findMany({
      where: {
        status: 'ACTIVE',
        location: { isActive: true },
      },
      select: {
        locationId: true,
      },
      distinct: ['locationId'],
    });
    const sitesWithGuards = sitesWithGuardsResult.length;

    const siteCoverage = activeSites > 0 ? (sitesWithGuards / activeSites) * 100 : 0;

    // Calculate average response time (from incidents)
    const recentIncidents = await prisma.incident.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let averageResponseTime = 0;
    if (recentIncidents.length > 0) {
      const totalResponseTime = recentIncidents.reduce((sum, incident) => {
        if (incident.resolvedAt) {
          const responseTime = incident.resolvedAt.getTime() - incident.createdAt.getTime();
          return sum + responseTime / (1000 * 60); // Convert to minutes
        }
        return sum;
      }, 0);
      averageResponseTime = totalResponseTime / recentIncidents.length;
    }

    // Get incidents today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const incidentsToday = await prisma.incident.count({
      where: {
        createdAt: { gte: today },
      },
    });

    const metrics = {
      totalGuards,
      activeGuards,
      guardsOnBreak,
      offlineGuards,
      emergencyAlerts,
      siteCoverage: Math.round(siteCoverage * 10) / 10, // Round to 1 decimal
      averageResponseTime: Math.round(averageResponseTime * 10) / 10, // Round to 1 decimal
      incidentsToday,
    };

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error getting operations metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get operations metrics',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Get guard statuses for operations center
 */
export const getGuardStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Get all guards with their latest location and current shift
    const guards = await prisma.guard.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const guardStatuses = await Promise.all(
      guards.map(async (guard) => {
        // Get latest location
        const latestLocation = await prisma.trackingRecord.findFirst({
          where: { guardId: guard.id },
          orderBy: { timestamp: 'desc' },
        });

        // Get current shift assignment
        const currentShift = await prisma.shiftAssignment.findFirst({
          where: {
            guardId: guard.id,
            status: ShiftAssignmentStatus.IN_PROGRESS,
          },
          include: {
            shiftPosting: {
              include: {
                site: true,
              },
            },
            site: true,
          },
        });

        // Check for active emergency alert
        const activeAlerts = await emergencyService.getActiveEmergencyAlerts();
        const guardAlert = activeAlerts.find(alert => alert.guardId === guard.id);

        // Determine status
        let status: 'active' | 'on_break' | 'offline' | 'emergency' = 'offline';
        if (guardAlert) {
          status = 'emergency';
        } else if (guard.status === GuardStatus.ON_DUTY || guard.status === GuardStatus.ACTIVE) {
          status = 'active';
        } else if (guard.status === GuardStatus.OFF_DUTY) {
          status = 'offline';
        }

        return {
          guardId: guard.id,
          guardName: `${guard.user.firstName} ${guard.user.lastName}`,
          status,
          location: latestLocation
            ? {
                latitude: latestLocation.latitude,
                longitude: latestLocation.longitude,
                accuracy: latestLocation.accuracy || 0,
                timestamp: latestLocation.timestamp.getTime(),
              }
            : {
                latitude: 0,
                longitude: 0,
                accuracy: 0,
                timestamp: Date.now(),
              },
          currentSite: currentShift?.site?.name || currentShift?.shiftPosting?.site?.name || 'No Site',
          siteId: currentShift?.siteId,
          shiftStart: currentShift?.startTime?.getTime() || Date.now(),
          lastUpdate: latestLocation?.timestamp.getTime() || Date.now(),
          batteryLevel: latestLocation?.batteryLevel || undefined,
          emergencyAlert: guardAlert
            ? {
                id: guardAlert.id,
                timestamp: guardAlert.createdAt.getTime(),
                message: guardAlert.message,
                acknowledged: guardAlert.status === 'ACKNOWLEDGED',
              }
            : undefined,
        };
      })
    );

    res.json({
      success: true,
      data: guardStatuses,
    });
  } catch (error) {
    logger.error('Error getting guard statuses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get guard statuses',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

export default {
  getOperationsMetrics,
  getGuardStatuses,
};

