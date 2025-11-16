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

      // Notify all admins and relevant clients immediately
      await this.notifyEmergencyContacts(emergencyAlert, guard);

      // Broadcast to all connected admin/client sockets
      // Note: WebSocket broadcasting will be implemented when websocketService is properly configured
      console.log('Broadcasting emergency alert to admins and clients');

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
  async getActiveEmergencyAlerts(): Promise<EmergencyAlert[]> {
    try {
      const incidents = await prisma.incident.findMany({
        where: {
          status: {
            in: ['REPORTED', 'INVESTIGATING'],
          },
          type: {
            in: ['SECURITY_BREACH', 'MEDICAL_EMERGENCY', 'FIRE', 'OTHER'],
          },
        },
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
  async getGuardEmergencyHistory(guardId: string, limit: number = 50): Promise<EmergencyAlert[]> {
    try {
      const guard = await prisma.guard.findUnique({
        where: { id: guardId },
        select: { userId: true },
      });

      if (!guard) {
        throw new Error('Guard not found');
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
   * Send emergency notifications to relevant contacts
   */
  private async notifyEmergencyContacts(alert: EmergencyAlert, guard: any): Promise<void> {
    try {
      // Get all admins
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      // Get emergency contacts for the guard
      const emergencyContacts = await prisma.emergencyContact.findMany({
        where: { guardId: guard.id },
      });

      // Create notifications for admins
      const adminNotifications = admins.map(admin => ({
        userId: admin.id,
        type: 'EMERGENCY' as const,
        title: `🚨 EMERGENCY ALERT: ${alert.type}`,
        message: `${guard.user.firstName} ${guard.user.lastName} has triggered a ${alert.severity.toLowerCase()} ${alert.type.toLowerCase()} alert. Location: ${alert.location.address || 'GPS coordinates provided'}`,
        data: JSON.stringify({
          alertId: alert.id,
          guardId: alert.guardId,
          type: alert.type,
          severity: alert.severity,
          location: alert.location,
        }),
      }));

      await prisma.notification.createMany({
        data: adminNotifications,
      });

      // Send push notifications (if configured)
      // await NotificationService.sendPushNotifications(adminNotifications);

      console.log(`📱 Emergency notifications sent to ${admins.length} admins`);
    } catch (error) {
      console.error('Error sending emergency notifications:', error);
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
