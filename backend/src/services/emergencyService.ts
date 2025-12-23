import { PrismaClient } from '@prisma/client';
import websocketService from './websocketService.js';

const prisma = new PrismaClient();

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
}

export class EmergencyService {
  private static instance: EmergencyService;

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
      // Note: WebSocket broadcasting will be implemented when websocketService is properly configured
      console.log(`Broadcasting emergency alert for site: ${siteName || 'Unknown'} (Site ID: ${siteId || 'N/A'})`);

      // Log emergency event
      console.log(`🚨 EMERGENCY ALERT: ${data.type} - Guard: ${guard.user.firstName} ${guard.user.lastName} (${guard.employeeId})`);

      return emergencyAlert;
    } catch (error) {
      console.error('Error triggering emergency alert:', error);
      throw error;
    }
  }

  /**
   * Acknowledge emergency alert
   */
  async acknowledgeEmergencyAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    try {
      await prisma.incident.update({
        where: { id: alertId },
        data: {
          status: 'INVESTIGATING',
          updatedAt: new Date(),
        },
      });

      // Broadcast acknowledgment
      console.log('Broadcasting emergency acknowledgment');

      console.log(`✓ Emergency alert ${alertId} acknowledged by ${acknowledgedBy}`);
    } catch (error) {
      console.error('Error acknowledging emergency alert:', error);
      throw error;
    }
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
      await prisma.incident.update({
        where: { id: alertId },
        data: {
          status: status === 'RESOLVED' ? 'RESOLVED' : 'CLOSED',
          resolvedAt: new Date(),
          description: `${await this.getIncidentDescription(alertId)}\n\nResolution: ${resolution}`,
          updatedAt: new Date(),
        },
      });

      // Broadcast resolution
      console.log('Broadcasting emergency resolution');

      console.log(`✓ Emergency alert ${alertId} resolved by ${resolvedBy}: ${status}`);
    } catch (error) {
      console.error('Error resolving emergency alert:', error);
      throw error;
    }
  }

  /**
   * Get active emergency alerts
   */
  async getActiveEmergencyAlerts(securityCompanyId?: string): Promise<EmergencyAlert[]> {
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
            include: {
              guard: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return incidents.map(incident => ({
        id: incident.id,
        guardId: incident.reporter.guard?.id || '',
        type: this.mapIncidentTypeToEmergencyType(incident.type),
        severity: incident.severity,
        location: {
          latitude: 0, // You'll need to store this in the incident
          longitude: 0,
        },
        message: incident.description,
        status: incident.status === 'REPORTED' ? 'ACTIVE' : 'ACKNOWLEDGED',
        createdAt: incident.createdAt,
        acknowledgedAt: incident.status === 'INVESTIGATING' ? incident.updatedAt : undefined,
        resolvedAt: incident.resolvedAt || undefined,
      }));
    } catch (error) {
      console.error('Error getting active emergency alerts:', error);
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
      console.error('Error getting guard emergency history:', error);
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

      // Notify the client who owns the site
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
          // Use centralized notification service
          const NotificationService = (await import('./notificationService.js')).default;
          await NotificationService.createNotification({
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
          });

          console.log(`📱 Emergency notification sent to client: ${client.user.email}`);
        }
      } else {
        console.warn(`⚠️  No client found for site (Site ID: ${siteId}) - client notification skipped`);
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
          // Use centralized notification service for bulk notifications
          const NotificationService = (await import('./notificationService.js')).default;
          await NotificationService.createBulkNotifications(
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
            guardCompany.securityCompanyId
          );

          console.log(`📱 Emergency notifications sent to ${adminUserIds.length} admin(s) for site: ${siteName || 'Unknown'}`);
        }
      } else {
        console.warn(`⚠️  Guard ${guard.id} not linked to a company - admin notifications skipped`);
      }

      // Get emergency contacts for the guard (always notify these)
      const emergencyContacts = await prisma.emergencyContact.findMany({
        where: { guardId: guard.id },
      });

      if (emergencyContacts.length > 0) {
        console.log(`📞 Guard has ${emergencyContacts.length} emergency contact(s) configured`);
        // TODO: Send SMS/email notifications to emergency contacts if configured
      }

      // Send push notifications (if configured)
      // await NotificationService.sendPushNotifications(adminNotifications);
    } catch (error) {
      console.error('Error sending emergency notifications:', error);
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
