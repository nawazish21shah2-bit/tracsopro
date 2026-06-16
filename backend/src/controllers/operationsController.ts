/**
 * Operations Controller - Admin Operations Center
 * Handles operations metrics, guard statuses, and real-time data
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import prisma from '../config/database.js';
import { EmergencyService } from '../services/emergencyService.js';
import { GuardStatus, ShiftStatus, IncidentSeverity, IncidentStatus } from '@prisma/client';
import { resolveSecurityCompanyId } from '../utils/companyAuth.js';

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

    const companyResult = resolveSecurityCompanyId(req);
    if (companyResult.error) {
      return res.status(companyResult.status || 403).json({
        success: false,
        message: companyResult.error,
      });
    }

    const securityCompanyId = companyResult.securityCompanyId;

    // Multi-tenant: Build company filters
    const guardWhere = {
      companyGuards: {
        some: {
          securityCompanyId,
          isActive: true,
        },
      },
    };

    const siteWhere = {
      companySites: {
        some: {
          securityCompanyId,
        },
      },
    };

    const shiftWhere = {
      guard: {
        companyGuards: {
          some: {
            securityCompanyId,
            isActive: true,
          },
        },
      },
    };

    // Get company guard IDs (needed for breaks and incidents)
    const companyGuards = await prisma.companyGuard.findMany({
      where: {
        securityCompanyId,
        isActive: true,
      },
      select: { guardId: true },
    });
    const companyGuardIds = companyGuards.map(cg => cg.guardId).filter(Boolean) as string[];

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
        : [],
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
      guardId: { in: companyGuardIds },
    };

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
          resolvedAt: { not: null },
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

    const companyResult = resolveSecurityCompanyId(req);
    if (companyResult.error) {
      return res.status(companyResult.status || 403).json({
        success: false,
        message: companyResult.error,
      });
    }

    const securityCompanyId = companyResult.securityCompanyId;

    const guardWhere = {
      companyGuards: {
        some: {
          securityCompanyId,
          isActive: true,
        },
      },
    };

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
          shiftStart: currentShift?.actualStartTime?.getTime() || currentShift?.scheduledStartTime?.getTime() || Date.now(),
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

const EMERGENCY_INCIDENT_TYPES = ['SECURITY_BREACH', 'MEDICAL_EMERGENCY', 'FIRE', 'OTHER'] as const;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function mapIncidentSeverity(severity: IncidentSeverity): 'low' | 'medium' | 'high' | 'critical' {
  switch (severity) {
    case IncidentSeverity.CRITICAL:
      return 'critical';
    case IncidentSeverity.HIGH:
      return 'high';
    case IncidentSeverity.MEDIUM:
      return 'medium';
    default:
      return 'low';
  }
}

function mapIncidentActivityStatus(status: IncidentStatus): 'active' | 'resolved' | 'pending' {
  if (status === IncidentStatus.RESOLVED || status === IncidentStatus.CLOSED) {
    return 'resolved';
  }
  if (status === IncidentStatus.INVESTIGATING) {
    return 'active';
  }
  return 'pending';
}

/**
 * Get live activity feed for operations center (incidents, check-ins, breaks, emergencies)
 */
export const getOperationsActivity = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);
    const companyResult = resolveSecurityCompanyId(req);
    if (companyResult.error) {
      return res.status(companyResult.status || 403).json({
        success: false,
        message: companyResult.error,
      });
    }

    const securityCompanyId = companyResult.securityCompanyId;
    const companyGuards = await prisma.companyGuard.findMany({
      where: { securityCompanyId, isActive: true },
      select: { guardId: true },
    });
    const companyGuardIds = companyGuards.map((cg) => cg.guardId).filter(Boolean) as string[];

    if (companyGuardIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const guards = await prisma.guard.findMany({
      where: { id: { in: companyGuardIds } },
      select: { id: true, userId: true },
    });
    const companyUserIds = guards.map((g) => g.userId).filter(Boolean) as string[];
    const since = new Date(Date.now() - THIRTY_DAYS_MS);

    const [incidents, shifts, breaks] = await Promise.all([
      prisma.incident.findMany({
        where: {
          reportedBy: { in: companyUserIds },
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          location: { select: { name: true } },
          reporter: {
            select: {
              firstName: true,
              lastName: true,
              guard: { select: { id: true } },
            },
          },
        },
      }),
      prisma.shift.findMany({
        where: {
          guardId: { in: companyGuardIds },
          OR: [
            { actualStartTime: { gte: since } },
            { actualEndTime: { gte: since } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        include: {
          guard: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
          site: { select: { name: true } },
        },
      }),
      prisma.shiftBreak.findMany({
        where: {
          shift: { guardId: { in: companyGuardIds } },
          startTime: { gte: since },
        },
        orderBy: { startTime: 'desc' },
        take: limit,
        include: {
          shift: {
            include: {
              guard: {
                include: {
                  user: { select: { firstName: true, lastName: true } },
                },
              },
              site: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const items: Array<{
      id: string;
      type: string;
      guardId: string;
      guardName: string;
      siteName: string;
      message: string;
      timestamp: number;
      severity?: string;
      status?: string;
    }> = [];

    for (const incident of incidents) {
      const guardName =
        `${incident.reporter.firstName || ''} ${incident.reporter.lastName || ''}`.trim() ||
        'Unknown Guard';
      const siteName = incident.location?.name || 'Unknown Site';
      const isEmergency = EMERGENCY_INCIDENT_TYPES.includes(
        incident.type as (typeof EMERGENCY_INCIDENT_TYPES)[number]
      );

      items.push({
        id: `incident_${incident.id}`,
        type: isEmergency ? 'emergency' : 'incident',
        guardId: incident.reporter.guard?.id || '',
        guardName,
        siteName,
        message: incident.description || incident.title,
        timestamp: incident.createdAt.getTime(),
        severity: mapIncidentSeverity(incident.severity),
        status: mapIncidentActivityStatus(incident.status),
      });
    }

    for (const shift of shifts) {
      if (!shift.guardId) continue;

      const guardName = shift.guard?.user
        ? `${shift.guard.user.firstName} ${shift.guard.user.lastName}`.trim()
        : 'Unknown Guard';
      const siteName = shift.site?.name || shift.locationName || 'Unknown Site';

      if (shift.actualStartTime && shift.actualStartTime >= since) {
        items.push({
          id: `checkin_${shift.id}`,
          type: 'check_in',
          guardId: shift.guardId,
          guardName,
          siteName,
          message: `Checked in at ${siteName}`,
          timestamp: shift.actualStartTime.getTime(),
        });
      }

      if (shift.actualEndTime && shift.actualEndTime >= since) {
        items.push({
          id: `checkout_${shift.id}`,
          type: 'check_out',
          guardId: shift.guardId,
          guardName,
          siteName,
          message: `Checked out from ${siteName}`,
          timestamp: shift.actualEndTime.getTime(),
        });
      }
    }

    for (const shiftBreak of breaks) {
      const shift = shiftBreak.shift;
      if (!shift?.guardId) continue;

      const guardName = shift.guard?.user
        ? `${shift.guard.user.firstName} ${shift.guard.user.lastName}`.trim()
        : 'Unknown Guard';
      const siteName = shift.site?.name || shift.locationName || 'Unknown Site';
      const isEnded = Boolean(shiftBreak.endTime);

      items.push({
        id: `break_${shiftBreak.id}_${isEnded ? 'end' : 'start'}`,
        type: isEnded ? 'break_end' : 'break_start',
        guardId: shift.guardId,
        guardName,
        siteName,
        message: isEnded ? `Ended break at ${siteName}` : `Started break at ${siteName}`,
        timestamp: (shiftBreak.endTime || shiftBreak.startTime).getTime(),
      });
    }

    items.sort((a, b) => b.timestamp - a.timestamp);

    res.json({ success: true, data: items.slice(0, limit) });
  } catch (error) {
    logger.error('Error getting operations activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get operations activity',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

export default {
  getOperationsMetrics,
  getGuardStatuses,
  getOperationsActivity,
};

