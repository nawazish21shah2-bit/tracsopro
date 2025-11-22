/**
 * Operations Controller - Admin Operations Center
 * Handles operations metrics, guard statuses, and real-time data
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import prisma from '../config/database.js';
import { EmergencyService } from '../services/emergencyService.js';
import { GuardStatus, ShiftAssignmentStatus } from '@prisma/client';

const emergencyService = EmergencyService.getInstance();

// Constants
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MS_TO_MINUTES = 1000 * 60;
const DECIMAL_PLACES = 1;

/**
 * Get operations metrics for admin dashboard
 * Returns: guard counts, site coverage, response times, and incident statistics
 */
export const getOperationsMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Guard Statistics
    const [totalGuards, activeGuards, offlineGuards, activeBreaks] = await Promise.all([
      prisma.guard.count(),
      prisma.guard.count({
        where: { status: { in: [GuardStatus.ON_DUTY, GuardStatus.ACTIVE] } },
      }),
      prisma.guard.count({ where: { status: GuardStatus.OFF_DUTY } }),
      prisma.shiftBreak.findMany({
        where: { endTime: null, shift: { status: 'IN_PROGRESS' } },
        select: { shift: { select: { guardId: true } } },
        distinct: ['shiftId'],
      }),
    ]);

    const guardsOnBreak = activeBreaks.length;

    // Emergency Alerts
    const activeAlerts = await emergencyService.getActiveEmergencyAlerts();
    const emergencyAlerts = activeAlerts.length;

    // Site Coverage
    const [activeSites, sitesWithGuardsResult] = await Promise.all([
      prisma.location.count({ where: { isActive: true } }),
      prisma.locationAssignment.findMany({
        where: { status: 'ACTIVE', location: { isActive: true } },
        select: { locationId: true },
        distinct: ['locationId'],
      }),
    ]);
    const sitesWithGuards = sitesWithGuardsResult.length;
    const siteCoverage = activeSites > 0 ? (sitesWithGuards / activeSites) * 100 : 0;

    // Response Time & Incidents
    const last24Hours = new Date(Date.now() - ONE_DAY_MS);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [recentIncidents, incidentsToday] = await Promise.all([
      prisma.incident.findMany({
        where: {
          createdAt: { gte: last24Hours },
          resolvedAt: { not: null },
        },
        select: { createdAt: true, resolvedAt: true },
      }),
      prisma.incident.count({ where: { createdAt: { gte: today } } }),
    ]);

    // Calculate average response time
    const averageResponseTime = recentIncidents.length > 0
      ? recentIncidents.reduce((sum, incident) => {
          if (incident.resolvedAt) {
            const responseTime = (incident.resolvedAt.getTime() - incident.createdAt.getTime()) / MS_TO_MINUTES;
            return sum + responseTime;
          }
          return sum;
        }, 0) / recentIncidents.length
      : 0;

    // Round to 1 decimal place
    const roundToOneDecimal = (value: number) => Math.round(value * 10) / 10;

    const metrics = {
      totalGuards,
      activeGuards,
      guardsOnBreak,
      offlineGuards,
      emergencyAlerts,
      siteCoverage: roundToOneDecimal(siteCoverage),
      averageResponseTime: roundToOneDecimal(averageResponseTime),
      incidentsToday,
    };

    res.json({ success: true, data: metrics });
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
 * Returns: real-time status, location, shift info, and emergency alerts for all guards
 */
export const getGuardStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Fetch all guards with user info
    const guards = await prisma.guard.findMany({
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Get active emergency alerts once (shared across all guards)
    const activeAlerts = await emergencyService.getActiveEmergencyAlerts();

    // Process each guard's status
    const guardStatuses = await Promise.all(
      guards.map(async (guard) => {
        const [latestLocation, currentShift] = await Promise.all([
          prisma.trackingRecord.findFirst({
            where: { guardId: guard.id },
            orderBy: { timestamp: 'desc' },
          }),
          prisma.shiftAssignment.findFirst({
            where: {
              guardId: guard.id,
              status: ShiftAssignmentStatus.IN_PROGRESS,
            },
            include: {
              shiftPosting: { include: { site: true } },
              site: true,
            },
          }),
        ]);

        // Find guard's emergency alert
        const guardAlert = activeAlerts.find(alert => alert.guardId === guard.id);

        // Determine guard status
        const status = guardAlert
          ? 'emergency'
          : guard.status === GuardStatus.ON_DUTY || guard.status === GuardStatus.ACTIVE
          ? 'active'
          : guard.status === GuardStatus.OFF_DUTY
          ? 'offline'
          : 'offline';

        // Build location data
        const location = latestLocation
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
            };

        // Build response object
        return {
          guardId: guard.id,
          guardName: `${guard.user.firstName} ${guard.user.lastName}`,
          status,
          location,
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

    res.json({ success: true, data: guardStatuses });
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

