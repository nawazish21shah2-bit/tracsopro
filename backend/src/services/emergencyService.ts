import prisma from '../config/database.js';
import websocketService from './websocketService.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface EmergencyAlert {
  id: string;
  guardId: string;
  type: 'PANIC' | 'MEDICAL' | 'SECURITY' | 'FIRE' | 'CUSTOM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  message?: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'FALSE_ALARM';
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  resolvedBy?: string;
  responderName?: string;
}

export class EmergencyService {
  private static instance: EmergencyService;
  private static readonly DEFAULT_EMERGENCY_RESUBMIT_COOLDOWN_SECONDS = 120;

  private static getEmergencyResubmitCooldownMs(): number {
    const parsed = Number(process.env.EMERGENCY_RESUBMIT_COOLDOWN_SECONDS);
    const cooldownSeconds =
      Number.isFinite(parsed) && parsed >= 0
        ? parsed
        : EmergencyService.DEFAULT_EMERGENCY_RESUBMIT_COOLDOWN_SECONDS;

    return Math.floor(cooldownSeconds * 1000);
  }

  constructor() {
    // WebSocket service is imported as default export
  }

  static getInstance(): EmergencyService {
    if (!EmergencyService.instance) {
      EmergencyService.instance = new EmergencyService();
    }
    return EmergencyService.instance;
  }

  /**
   * Find the guard's currently open emergency incident, if any.
   */
  async findGuardActiveEmergencyAlert(guardId: string): Promise<EmergencyAlert | null> {
    const guard = await prisma.guard.findUnique({
      where: { id: guardId },
      select: { userId: true },
    });

    if (!guard) {
      return null;
    }

    const incident = await prisma.incident.findFirst({
      where: {
        reportedBy: guard.userId,
        status: { in: ['REPORTED', 'INVESTIGATING'] },
        type: { in: ['SECURITY_BREACH', 'MEDICAL_EMERGENCY', 'FIRE', 'OTHER'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!incident) {
      return null;
    }

    let responderName: string | undefined;
    if (incident.acknowledgedBy) {
      const responder = await prisma.user.findUnique({
        where: { id: incident.acknowledgedBy },
        select: { firstName: true, lastName: true, role: true },
      });
      if (responder) {
        const roleLabel =
          responder.role === 'CLIENT' ? 'Client' : responder.role === 'ADMIN' ? 'Admin' : 'Responder';
        responderName = `${responder.firstName || ''} ${responder.lastName || ''}`.trim() || roleLabel;
      }
    }

    return {
      id: incident.id,
      guardId,
      type: this.mapIncidentTypeToEmergencyType(incident.type),
      severity: incident.severity as EmergencyAlert['severity'],
      location: { latitude: 0, longitude: 0 },
      message: incident.description || undefined,
      status: incident.status === 'REPORTED' ? 'ACTIVE' : 'ACKNOWLEDGED',
      createdAt: incident.createdAt,
      acknowledgedAt: incident.acknowledgedAt || undefined,
      responderName,
    };
  }

  /**
   * Trigger emergency alert from guard
   */
  async triggerEmergencyAlert(data: {
    guardId: string;
    type: EmergencyAlert['type'];
    severity: EmergencyAlert['severity'];
    location: EmergencyAlert['location'];
    message?: string;
    shiftId?: string; // Optional: if provided, use this shift's site/client
  }): Promise<EmergencyAlert> {
    try {
      // Get guard information
      const guard = await prisma.guard.findUnique({
        where: { id: data.guardId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!guard) {
        throw new Error('Guard not found');
      }

      const existingActive = await this.findGuardActiveEmergencyAlert(data.guardId);
      if (existingActive) {
        throw new ConflictError(
          'You already have an active emergency alert. Responders have been notified.',
          existingActive
        );
      }

      const recentlyResolved = await prisma.incident.findFirst({
        where: {
          reportedBy: guard.userId,
          status: { in: ['RESOLVED', 'CLOSED'] },
          type: { in: ['SECURITY_BREACH', 'MEDICAL_EMERGENCY', 'FIRE', 'OTHER'] },
          resolvedAt: { not: null },
        },
        orderBy: { resolvedAt: 'desc' },
      });

      if (recentlyResolved?.resolvedAt) {
        const cooldownMs = EmergencyService.getEmergencyResubmitCooldownMs();
        const elapsedMs = Date.now() - recentlyResolved.resolvedAt.getTime();
        if (elapsedMs < cooldownMs) {
          const remainingMs = cooldownMs - elapsedMs;
          const retryAfterSeconds = Math.ceil(remainingMs / 1000);
          throw new ConflictError(
            'A recent emergency alert was just resolved. Please wait before submitting again.',
            {
              retryAfterSeconds,
              lastResolvedAt: recentlyResolved.resolvedAt.toISOString(),
            }
          );
        }
      }

      // Get active shift and site information for site-specific notifications
      let activeShift = null;
      let siteId: string | null = null;
      let clientId: string | null = null;
      let siteName: string | null = null;

      if (data.shiftId) {
        // If shiftId is provided, get that shift
        activeShift = await prisma.shift.findUnique({
          where: { id: data.shiftId },
          include: {
            site: {
              include: {
                client: {
                  include: {
                    user: {
                      select: { id: true, email: true, firstName: true, lastName: true },
                    },
                  },
                },
              },
            },
            client: {
              include: {
                user: {
                  select: { id: true, email: true, firstName: true, lastName: true },
                },
              },
            },
          },
        });
      } else {
        // Otherwise, find the guard's active shift
        activeShift = await prisma.shift.findFirst({
          where: {
            guardId: data.guardId,
            status: 'IN_PROGRESS',
          },
          include: {
            site: {
              include: {
                client: {
                  include: {
                    user: {
                      select: { id: true, email: true, firstName: true, lastName: true },
                    },
                  },
                },
              },
            },
            client: {
              include: {
                user: {
                  select: { id: true, email: true, firstName: true, lastName: true },
                },
              },
            },
          },
        });
      }

      if (activeShift) {
        siteId = activeShift.siteId || null;
        clientId = activeShift.clientId || activeShift.site?.clientId || null;
        siteName = activeShift.site?.name || activeShift.locationName || null;
      }

      // Create or find a location for this emergency
      let location = await prisma.location.findFirst({
        where: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        },
      });

      if (!location) {
        location = await prisma.location.create({
          data: {
            name: `Emergency Location - ${data.type}`,
            address: data.location.address || `Lat: ${data.location.latitude}, Lng: ${data.location.longitude}`,
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            type: 'OUTDOOR',
            description: `Emergency location for ${data.type} alert`,
          },
        });
      }

      // Create emergency alert in database
      const alert = await prisma.incident.create({
        data: {
          reportedBy: guard.userId,
          locationId: location.id,
          type: data.type === 'PANIC' ? 'SECURITY_BREACH' : 
                data.type === 'MEDICAL' ? 'MEDICAL_EMERGENCY' :
                data.type === 'FIRE' ? 'FIRE' : 'OTHER',
          severity: data.severity,
          title: `EMERGENCY: ${data.type} Alert`,
          description: data.message || `Emergency ${data.type.toLowerCase()} alert triggered by ${guard.user.firstName} ${guard.user.lastName}`,
          status: 'REPORTED',
        },
      });

      // Create emergency notification record
      const emergencyAlert: EmergencyAlert = {
        id: alert.id,
        guardId: data.guardId,
        type: data.type,
        severity: data.severity,
        location: data.location,
        message: data.message,
        status: 'ACTIVE',
        createdAt: alert.createdAt,
      };

      // Notify only site-specific client and admins
      await this.notifyEmergencyContacts(emergencyAlert, guard, {
        siteId,
        clientId,
        siteName,
      });

      // Broadcast to site-specific admin/client sockets
      websocketService.broadcastToAdmins('emergency_alert', {
        alertId: emergencyAlert.id,
        guardId: data.guardId,
        type: data.type,
        severity: data.severity,
        location: data.location,
        message: data.message,
        siteId,
        siteName,
        status: 'ACTIVE',
        timestamp: alert.createdAt.toISOString(),
      });

      websocketService.sendToSpecificGuard(data.guardId, 'emergency_triggered', {
        alertId: emergencyAlert.id,
        status: 'ACTIVE',
      });

      // Log emergency event
      logger.info(`🚨 EMERGENCY ALERT: ${data.type} - Guard: ${guard.user.firstName} ${guard.user.lastName} (${guard.employeeId})`);

      return emergencyAlert;
    } catch (error) {
      logger.error('Error triggering emergency alert:', error);
      throw error;
    }
  }

  /**
   * Acknowledge emergency alert
   */
  async acknowledgeEmergencyAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    try {
      const result = await prisma.incident.updateMany({
        where: {
          id: alertId,
          status: 'REPORTED',
        },
        data: {
          status: 'INVESTIGATING',
          acknowledgedBy,
          acknowledgedAt: new Date(),
        },
      });

      if (result.count === 0) {
        const existing = await prisma.incident.findUnique({
          where: { id: alertId },
          select: { status: true, acknowledgedBy: true },
        });

        if (!existing) {
          throw new NotFoundError('Emergency alert not found');
        }

        if (existing.status === 'INVESTIGATING') {
          // Already dispatched — treat as success so UI can refresh cleanly
          return;
        }

        if (existing.status === 'RESOLVED' || existing.status === 'CLOSED') {
          throw new ConflictError('Emergency alert is already resolved');
        }

        throw new ConflictError('Unable to acknowledge emergency alert');
      }

      await this.notifyEmergencyStatusChange(alertId, acknowledgedBy, 'ACKNOWLEDGED');

      logger.info(`✓ Emergency alert ${alertId} acknowledged by ${acknowledgedBy}`);
    } catch (error) {
      logger.error('Error acknowledging emergency alert:', error);
      throw error;
    }
  }

  /**
   * Verify caller can act on an emergency incident (matches active-alerts scoping).
   */
  async canAccessEmergencyAlert(
    alertId: string,
    context: {
      securityCompanyId?: string;
      role: string;
      userId?: string;
      clientId?: string;
    }
  ): Promise<boolean> {
    const incident = await prisma.incident.findUnique({
      where: { id: alertId },
      include: {
        reporter: {
          select: {
            id: true,
            guard: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!incident?.reporter?.guard) {
      return false;
    }

    const guardId = incident.reporter.guard.id;

    if (context.securityCompanyId) {
      const companyGuard = await prisma.companyGuard.findFirst({
        where: {
          guardId,
          securityCompanyId: context.securityCompanyId,
          isActive: true,
        },
        select: { id: true },
      });

      if (!companyGuard) {
        return false;
      }
    }

    if (context.role === 'CLIENT') {
      if (!context.clientId) {
        return false;
      }

      const guardOnClientShift = await prisma.shift.findFirst({
        where: {
          clientId: context.clientId,
          guardId,
        },
        select: { id: true },
      });

      if (!guardOnClientShift) {
        return false;
      }
    }

    return true;
  }

  /**
   * Resolve emergency alert
   */
  async resolveEmergencyAlert(
    alertId: string, 
    resolvedBy: string, 
    resolution: string,
    status: 'RESOLVED' | 'FALSE_ALARM' = 'RESOLVED'
  ): Promise<void> {
    try {
      const existingDescription = await this.getIncidentDescription(alertId);
      const targetStatus = status === 'RESOLVED' ? 'RESOLVED' : 'CLOSED';

      const result = await prisma.incident.updateMany({
        where: {
          id: alertId,
          status: { in: ['REPORTED', 'INVESTIGATING'] },
        },
        data: {
          status: targetStatus,
          resolvedBy,
          resolvedAt: new Date(),
          description: `${existingDescription}\n\nResolution: ${resolution}`,
        },
      });

      if (result.count === 0) {
        const existing = await prisma.incident.findUnique({
          where: { id: alertId },
          select: { status: true, resolvedBy: true },
        });

        if (!existing) {
          throw new NotFoundError('Emergency alert not found');
        }

        if (existing.status === 'RESOLVED' || existing.status === 'CLOSED') {
          if (existing.resolvedBy === resolvedBy) {
            return;
          }
          throw new ConflictError('Emergency alert already resolved by another user');
        }

        throw new ConflictError('Unable to resolve emergency alert');
      }

      const resolvedStatus = status === 'FALSE_ALARM' ? 'FALSE_ALARM' : 'RESOLVED';
      await this.notifyEmergencyStatusChange(alertId, resolvedBy, resolvedStatus, resolution);

      logger.info(`✓ Emergency alert ${alertId} resolved by ${resolvedBy}: ${status}`);
    } catch (error) {
      logger.error('Error resolving emergency alert:', error);
      throw error;
    }
  }

  /**
   * Get active emergency alerts
   */
  async getActiveEmergencyAlerts(securityCompanyId?: string, clientId?: string): Promise<EmergencyAlert[]> {
    try {
      // Multi-tenant: Filter by company if provided
      let guardIds: string[] | undefined;
      if (securityCompanyId) {
        const companyGuards = await prisma.companyGuard.findMany({
          where: { securityCompanyId, isActive: true },
          select: { guardId: true },
        });
        guardIds = companyGuards.map(cg => cg.guardId);
      }

      // Client isolation: only alerts from guards assigned to this client's shifts
      if (clientId) {
        const clientShifts = await prisma.shift.findMany({
          where: { clientId, guardId: { not: null } },
          select: { guardId: true },
        });
        const clientGuardIds = [...new Set(clientShifts.map(s => s.guardId).filter(Boolean))] as string[];

        if (clientGuardIds.length === 0) {
          return [];
        }

        guardIds = guardIds
          ? guardIds.filter(id => clientGuardIds.includes(id))
          : clientGuardIds;
      }

      const whereClause: any = {
        status: {
          in: ['REPORTED', 'INVESTIGATING'],
        },
        type: {
          in: ['SECURITY_BREACH', 'MEDICAL_EMERGENCY', 'FIRE', 'OTHER'],
        },
      };

      // Multi-tenant: Filter by company guards if provided
      if (guardIds && guardIds.length > 0) {
        // Get user IDs for these guards
        const guards = await prisma.guard.findMany({
          where: { id: { in: guardIds } },
          select: { userId: true },
        });
        const userIds = guards.map(g => g.userId).filter(Boolean);
        
        if (userIds.length > 0) {
          whereClause.reportedBy = { in: userIds };
        } else {
          // No guards found, return empty array
          return [];
        }
      }

      const incidents = await prisma.incident.findMany({
        where: whereClause,
        include: {
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              guard: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return incidents.map(incident => {
        const guardName = incident.reporter
          ? `${incident.reporter.firstName || ''} ${incident.reporter.lastName || ''}`.trim() || 'Unknown Guard'
          : 'Unknown Guard';

        return {
          id: incident.id,
          guardId: incident.reporter.guard?.id || '',
          guardName,
          type: this.mapIncidentTypeToEmergencyType(incident.type),
          severity: incident.severity,
          location: {
            latitude: 0,
            longitude: 0,
          },
          message: incident.description,
          status: incident.status === 'REPORTED' ? 'ACTIVE' : 'ACKNOWLEDGED',
          createdAt: incident.createdAt,
          timestamp: incident.createdAt.getTime(),
          acknowledged: incident.status !== 'REPORTED',
          acknowledgedAt: incident.acknowledgedAt || undefined,
          acknowledgedBy: incident.acknowledgedBy || undefined,
          resolvedAt: incident.resolvedAt || undefined,
          resolvedBy: incident.resolvedBy || undefined,
        };
      });
    } catch (error) {
      logger.error('Error getting active emergency alerts:', error);
      throw error;
    }
  }

  /**
   * Get emergency alert history for a guard
   */
  async getGuardEmergencyHistory(guardId: string, limit: number = 50, securityCompanyId?: string): Promise<EmergencyAlert[]> {
    try {
      const guard = await prisma.guard.findUnique({
        where: { id: guardId },
        select: { userId: true },
      });

      if (!guard) {
        throw new Error('Guard not found');
      }

      // Multi-tenant: Validate guard belongs to company if provided
      if (securityCompanyId) {
        const companyGuard = await prisma.companyGuard.findFirst({
          where: {
            guardId,
            securityCompanyId,
            isActive: true,
          },
        });

        if (!companyGuard) {
          throw new Error('Guard not found or does not belong to your company');
        }
      }

      const incidents = await prisma.incident.findMany({
        where: {
          reportedBy: guard.userId,
          type: {
            in: ['SECURITY_BREACH', 'MEDICAL_EMERGENCY', 'FIRE', 'OTHER'],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return incidents.map(incident => ({
        id: incident.id,
        guardId,
        type: this.mapIncidentTypeToEmergencyType(incident.type),
        severity: incident.severity,
        location: {
          latitude: 0,
          longitude: 0,
        },
        message: incident.description,
        status: this.mapIncidentStatusToEmergencyStatus(incident.status),
        createdAt: incident.createdAt,
        resolvedAt: incident.resolvedAt || undefined,
      }));
    } catch (error) {
      logger.error('Error getting guard emergency history:', error);
      throw error;
    }
  }

  /**
   * Send emergency notifications to relevant contacts (site-specific)
   * Only notifies the client who owns the site and admins related to that site
   */
  private async notifyEmergencyContacts(
    alert: EmergencyAlert,
    guard: any,
    siteInfo: {
      siteId: string | null;
      clientId: string | null;
      siteName: string | null;
    }
  ): Promise<void> {
    try {
      const { siteId, clientId, siteName } = siteInfo;
      const actorUserId = guard.user.id;

      // Notify the client who owns the site (not the guard who triggered the alert)
      if (clientId) {
        const client = await prisma.client.findUnique({
          where: { id: clientId },
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        });

        if (client) {
          const NotificationService = (await import('./notificationService.js')).default;
          const sent = await NotificationService.createNotification(
            {
              userId: client.userId,
              type: 'EMERGENCY',
              title: `🚨 EMERGENCY ALERT: ${alert.type}`,
              message: `Emergency alert at ${siteName || 'your site'}: ${guard.user.firstName} ${guard.user.lastName} has triggered a ${alert.severity.toLowerCase()} ${alert.type.toLowerCase()} alert.`,
              data: {
                alertId: alert.id,
                guardId: alert.guardId,
                type: alert.type,
                severity: alert.severity,
                location: alert.location,
                siteId: siteId,
                siteName: siteName,
              },
              priority: alert.severity === 'CRITICAL' ? 'urgent' : 'high',
              sendPush: true,
            },
            undefined,
            actorUserId
          );

          if (sent) {
            logger.info(`📱 Emergency notification sent to client: ${client.user.email}`);
          }
        }
      } else {
        logger.warn(`⚠️  No client found for site (Site ID: ${siteId}) - client notification skipped`);
      }

      // Get admins related to this specific site
      // TODO: Implement admin-site assignment mechanism to only notify admins assigned to this site
      // For now, we notify all admins with site context
      // Once admin-site assignment is implemented, filter admins by site assignment here
      
      // Example future implementation:
      // const siteAdmins = await prisma.adminSiteAssignment.findMany({
      //   where: { siteId: siteId },
      //   include: { admin: { include: { user: true } } }
      // });
      
      // Get admins from the same company as the guard
      // Multi-tenant: Get company from guard
      const guardCompany = await prisma.companyGuard.findFirst({
        where: { guardId: guard.id, isActive: true },
        select: { securityCompanyId: true },
      });

      if (guardCompany) {
        // Get admins from the same company
        const companyAdmins = await prisma.companyUser.findMany({
          where: {
            securityCompanyId: guardCompany.securityCompanyId,
            isActive: true,
          },
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        });

        const adminUserIds = companyAdmins.map(cu => cu.userId).filter(Boolean);

        if (adminUserIds.length > 0) {
          const NotificationService = (await import('./notificationService.js')).default;
          const sent = await NotificationService.createBulkNotifications(
            adminUserIds,
            {
              type: 'EMERGENCY',
              title: `🚨 EMERGENCY ALERT: ${alert.type}${siteName ? ` at ${siteName}` : ''}`,
              message: `${guard.user.firstName} ${guard.user.lastName} has triggered a ${alert.severity.toLowerCase()} ${alert.type.toLowerCase()} alert${siteName ? ` at site: ${siteName}` : ''}. Location: ${alert.location.address || 'GPS coordinates provided'}`,
              data: {
                alertId: alert.id,
                guardId: alert.guardId,
                type: alert.type,
                severity: alert.severity,
                location: alert.location,
                siteId: siteId,
                siteName: siteName,
                clientId: clientId,
              },
              priority: alert.severity === 'CRITICAL' ? 'urgent' : 'high',
              sendPush: true,
            },
            guardCompany.securityCompanyId,
            actorUserId
          );

          logger.info(
            `📱 Emergency notifications sent to ${sent.length} admin(s) for site: ${siteName || 'Unknown'}`
          );
        }
      } else {
        logger.warn(`⚠️  Guard ${guard.id} not linked to a company - admin notifications skipped`);
      }

      // Get emergency contacts for the guard (always notify these)
      const emergencyContacts = await prisma.emergencyContact.findMany({
        where: { guardId: guard.id },
      });

      if (emergencyContacts.length > 0) {
        logger.info(`📞 Guard has ${emergencyContacts.length} emergency contact(s) configured`);
        // TODO: Send SMS/email notifications to emergency contacts if configured
      }

      // Send push notifications (if configured)
      // await NotificationService.sendPushNotifications(adminNotifications);
    } catch (error) {
      logger.error('Error sending emergency notifications:', error);
      throw error;
    }
  }

  private async getIncidentDescription(incidentId: string): Promise<string> {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: { description: true },
    });
    return incident?.description || '';
  }

  /**
   * Notify guard, client, and admins when an emergency is acknowledged or resolved.
   */
  private async notifyEmergencyStatusChange(
    alertId: string,
    actorUserId: string,
    action: 'ACKNOWLEDGED' | 'RESOLVED' | 'FALSE_ALARM',
    resolution?: string,
  ): Promise<void> {
    try {
      const incident = await prisma.incident.findUnique({
        where: { id: alertId },
        include: {
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              guard: { select: { id: true } },
            },
          },
          location: { select: { name: true } },
        },
      });

      if (!incident?.reporter?.guard) {
        return;
      }

      const guardId = incident.reporter.guard.id;
      const guardUserId = incident.reporter.id;
      const guardName =
        `${incident.reporter.firstName || ''} ${incident.reporter.lastName || ''}`.trim() ||
        'Guard';

      const actor = await prisma.user.findUnique({
        where: { id: actorUserId },
        select: { id: true, firstName: true, lastName: true, role: true },
      });

      const actorName = actor
        ? `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || 'Responder'
        : 'Responder';
      const actorRoleLabel =
        actor?.role === 'CLIENT' ? 'Client' : actor?.role === 'ADMIN' ? 'Admin' : 'Responder';

      const shift = await prisma.shift.findFirst({
        where: { guardId },
        orderBy: { updatedAt: 'desc' },
        select: {
          clientId: true,
          client: { select: { userId: true } },
          site: { select: { name: true, clientId: true } },
        },
      });

      const siteName = shift?.site?.name || incident.location?.name || 'the site';
      const clientUserId = shift?.client?.userId || null;

      const guardCompany = await prisma.companyGuard.findFirst({
        where: { guardId, isActive: true },
        select: { securityCompanyId: true },
      });

      const securityCompanyId = guardCompany?.securityCompanyId || undefined;
      let adminUserIds: string[] = [];

      if (securityCompanyId) {
        const companyAdmins = await prisma.companyUser.findMany({
          where: { securityCompanyId, isActive: true },
          select: { userId: true },
        });
        adminUserIds = companyAdmins.map((cu) => cu.userId).filter(Boolean);
      }

      const statusPayload = {
        alertId,
        guardId,
        guardName,
        siteName,
        action,
        actorUserId,
        actorName,
        actorRole: actor?.role || 'ADMIN',
        actorRoleLabel,
        resolution: resolution || undefined,
        timestamp: new Date().toISOString(),
      };

      let title = '';
      let message = '';

      if (action === 'ACKNOWLEDGED') {
        title = 'Emergency Response Dispatched';
        message = `${actorName} (${actorRoleLabel}) acknowledged the emergency for ${guardName} at ${siteName}. Assistance is being dispatched.`;
      } else if (action === 'FALSE_ALARM') {
        title = 'Emergency Closed — False Alarm';
        message = `${actorName} (Admin) marked the emergency for ${guardName} at ${siteName} as a false alarm.`;
      } else {
        title = 'Emergency Resolved';
        message = `${actorName} (Admin) resolved the emergency for ${guardName} at ${siteName}.`;
      }

      if (resolution && action !== 'ACKNOWLEDGED') {
        message += ` Notes: ${resolution}`;
      }

      const recipientIds = new Set<string>([
        guardUserId,
        ...adminUserIds,
        ...(clientUserId ? [clientUserId] : []),
      ]);

      const NotificationService = (await import('./notificationService.js')).default;
      await NotificationService.createBulkNotifications(
        Array.from(recipientIds),
        {
          type: 'EMERGENCY',
          title,
          message,
          data: {
            ...statusPayload,
            type: 'emergency',
            alertId,
          },
          priority: action === 'ACKNOWLEDGED' ? 'high' : 'normal',
          sendPush: true,
        },
        securityCompanyId,
        actorUserId,
      );

      for (const userId of recipientIds) {
        websocketService.broadcastToUser(userId, 'emergency_status_update', statusPayload);
      }

      websocketService.sendToSpecificGuard(
        guardId,
        action === 'ACKNOWLEDGED' ? 'emergency_acknowledged' : 'emergency_resolved',
        statusPayload,
      );

      websocketService.broadcastToAdmins(
        action === 'ACKNOWLEDGED' ? 'emergency_acknowledged' : 'emergency_resolved',
        statusPayload,
      );
    } catch (error) {
      logger.error('Error notifying emergency status change:', error);
    }
  }

  private mapIncidentTypeToEmergencyType(type: string): EmergencyAlert['type'] {
    switch (type) {
      case 'MEDICAL_EMERGENCY': return 'MEDICAL';
      case 'FIRE': return 'FIRE';
      case 'SECURITY_BREACH': return 'SECURITY';
      default: return 'CUSTOM';
    }
  }

  private mapIncidentStatusToEmergencyStatus(status: string): EmergencyAlert['status'] {
    switch (status) {
      case 'REPORTED': return 'ACTIVE';
      case 'INVESTIGATING': return 'ACKNOWLEDGED';
      case 'RESOLVED': return 'RESOLVED';
      case 'CLOSED': return 'FALSE_ALARM';
      default: return 'ACTIVE';
    }
  }
}

export default EmergencyService;
