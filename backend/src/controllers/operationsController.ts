/**
 * Operations Controller - Admin Operations Center
 * Handles operations metrics, guard statuses, and real-time data
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import prisma from '../config/database.js';
import { EmergencyService } from '../services/emergencyService.js';
import { GuardStatus, ShiftStatus } from '@prisma/client';

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

    const securityCompanyId = req.securityCompanyId;

    // Multi-tenant: Build company filters
    const guardWhere = securityCompanyId ? {
      companyGuards: {
        some: {
          securityCompanyId,
          isActive: true,
        },
      },
    } : {};

    const siteWhere = securityCompanyId ? {
      companySites: {
        some: {
          securityCompanyId,
        },
      },
    } : {};

    const shiftWhere = securityCompanyId ? {
      guard: {
        companyGuards: {
          some: {
            securityCompanyId,
            isActive: true,
          },
        },
      },
    } : {};

    // Get company guard IDs if filtering by company (needed for breaks and incidents)
    let companyGuardIds: string[] | undefined;
    if (securityCompanyId) {
      const companyGuards = await prisma.companyGuard.findMany({
        where: {
          securityCompanyId,
          isActive: true,
        },
        select: { guardId: true },
      });
      companyGuardIds = companyGuards.map(cg => cg.guardId).filter(Boolean) as string[];
      
      // If no guards in company, return empty metrics
      if (companyGuardIds.length === 0) {
        return res.json({
          success: true,
          data: {
            totalGuards: 0,
            activeGuards: 0,
            guardsOnBreak: 0,
            offlineGuards: 0,
            emergencyAlerts: 0,
            siteCoverage: 0,
            averageResponseTime: 0,
            incidentsToday: 0,
          },
        });
      }
    }

    // Guard Statistics
    const [totalGuards, activeGuards, offlineGuards, activeBreaks] = await Promise.all([
      prisma.guard.count({ where: guardWhere }),
      prisma.guard.count({
        where: {
          ...guardWhere,
          status: { in: [GuardStatus.ON_DUTY, GuardStatus.ACTIVE] },
        },
      }),
      prisma.guard.count({ where: { ...guardWhere, status: GuardStatus.OFF_DUTY } }),
      companyGuardIds
        ? prisma.shiftBreak.findMany({
            where: {
              endTime: null,
              shift: {
                status: 'IN_PROGRESS',
                guardId: { in: companyGuardIds },
              },
            },
            select: { shift: { select: { guardId: true } } },
            distinct: ['shiftId'],
          })
        : prisma.shiftBreak.findMany({
            where: {
              endTime: null,
              shift: {
                status: 'IN_PROGRESS',
              },
            },
            select: { shift: { select: { guardId: true } } },
            distinct: ['shiftId'],
          }),
    ]);

    const guardsOnBreak = activeBreaks.length;

    // Emergency Alerts (filtered by company)
    const activeAlerts = await emergencyService.getActiveEmergencyAlerts(securityCompanyId);
    const emergencyAlerts = activeAlerts.length;

    // Site Coverage - Use Site model with CompanySite relationship
    const siteCoverageWhere: any = {
      ...siteWhere,
      isActive: true,
    };

    const shiftsForSiteCoverageWhere: any = {
      status: ShiftStatus.IN_PROGRESS,
      site: siteCoverageWhere,
    };

    // Also filter shifts by company guards if filtering by company
    if (companyGuardIds) {
      shiftsForSiteCoverageWhere.guardId = { in: companyGuardIds };
    }

    const [activeSites, sitesWithGuardsResult] = await Promise.all([
      prisma.site.count({
        where: siteCoverageWhere,
      }),
      prisma.shift.findMany({
        where: shiftsForSiteCoverageWhere,
        select: { siteId: true },
        distinct: ['siteId'],
      }),
    ]);
    const sitesWithGuards = sitesWithGuardsResult.length;
    const siteCoverage = activeSites > 0 ? (sitesWithGuards / activeSites) * 100 : 0;

    // Response Time & Incidents - Filter by company guards
    const last24Hours = new Date(Date.now() - ONE_DAY_MS);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Convert guardIds to userIds since Incident uses reportedBy (userId)
    let companyUserIds: string[] | undefined;
    if (companyGuardIds && companyGuardIds.length > 0) {
      const guards = await prisma.guard.findMany({
        where: {
          id: { in: companyGuardIds },
        },
        select: { userId: true },
      });
      companyUserIds = guards.map(g => g.userId).filter(Boolean) as string[];
    }

    const incidentWhere: any = companyUserIds && companyUserIds.length > 0
      ? {
          reportedBy: { in: companyUserIds },
        }
      : {};

    const [recentIncidents, incidentsToday] = await Promise.all([
      prisma.incident.findMany({
        where: {
          ...incidentWhere,
          createdAt: { gte: last24Hours },
          resolvedAt: { isNot: null },
        },
        select: { createdAt: true, resolvedAt: true },
      }),
      prisma.incident.count({
        where: {
          ...incidentWhere,
          createdAt: { gte: today },
        },
      }),
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

    const securityCompanyId = req.securityCompanyId;

    // Multi-tenant: Build company filter for guards
    const guardWhere = securityCompanyId ? {
      companyGuards: {
        some: {
          securityCompanyId,
          isActive: true,
        },
      },
    } : {};

    // Fetch guards with user info (filtered by company)
    const guards = await prisma.guard.findMany({
      where: guardWhere,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Get active emergency alerts once (shared across all guards, filtered by company)
    const activeAlerts = await emergencyService.getActiveEmergencyAlerts(securityCompanyId);

    // Process each guard's status
    const guardStatuses = await Promise.all(
      guards.map(async (guard) => {
        const [latestLocation, currentShift] = await Promise.all([
          prisma.trackingRecord.findFirst({
            where: { guardId: guard.id },
            orderBy: { timestamp: 'desc' },
          }),
          prisma.shift.findFirst({
            where: {
              guardId: guard.id,
              status: ShiftStatus.IN_PROGRESS,
            },
            include: {
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
          currentSite: currentShift?.site?.name || 'No Site',
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

