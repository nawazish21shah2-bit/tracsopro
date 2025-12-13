import prisma from '../config/database.js';
import websocketService from './websocketService.js';
import { logger } from '../utils/logger.js';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  sendPush?: boolean;
  sendEmail?: boolean;
  sendSMS?: boolean;
}

export interface NotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  shiftReminders: boolean;
  incidentAlerts: boolean;
}

export class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Create and send notification to a single user
   * Multi-tenant: Validates user belongs to company if securityCompanyId provided
   */
  async createNotification(
    data: CreateNotificationData,
    securityCompanyId?: string
  ): Promise<any> {
    try {
      // Multi-tenant: Validate user belongs to company if provided
      if (securityCompanyId) {
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
          include: {
            companyUsers: { where: { securityCompanyId, isActive: true }, take: 1 },
            guard: { include: { companyGuards: { where: { securityCompanyId, isActive: true }, take: 1 } } },
            client: { include: { companyClients: { where: { securityCompanyId, isActive: true }, take: 1 } } },
          },
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Check if user belongs to company
        const belongsToCompany =
          (user.role === 'ADMIN' && user.companyUsers.length > 0) ||
          (user.role === 'GUARD' && user.guard?.companyGuards.length > 0) ||
          (user.role === 'CLIENT' && user.client?.companyClients.length > 0) ||
          user.role === 'SUPER_ADMIN';

        if (!belongsToCompany) {
          throw new Error('User does not belong to the specified company');
        }
      }

      // Get user notification preferences
      const preferences = await this.getUserNotificationPreferences(data.userId);

      // Check if user wants this type of notification
      if (!this.shouldSendNotification(data.type, preferences)) {
        logger.debug(`Notification skipped for user ${data.userId} - preferences disabled`);
        return null;
      }

      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data ? JSON.stringify(data.data) : null,
          isRead: false,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Send via WebSocket (real-time)
      websocketService.sendNotification(data.userId, {
        title: data.title,
        message: data.message,
        type: data.type,
        data: data.data,
        id: notification.id,
        createdAt: notification.createdAt,
      });

      // Send push notification if enabled
      if (data.sendPush !== false && preferences.pushNotifications) {
        await this.sendPushNotification(data.userId, {
          title: data.title,
          body: data.message,
          type: data.type,
          data: data.data,
          priority: data.priority || 'normal',
        });
      }

      // Send email notification if enabled
      if (data.sendEmail && preferences.emailNotifications) {
        await this.sendEmailNotification(data.userId, {
          title: data.title,
          message: data.message,
          type: data.type,
        });
      }

      // Send SMS notification if enabled
      if (data.sendSMS && preferences.smsNotifications) {
        await this.sendSMSNotification(data.userId, {
          message: data.message,
          type: data.type,
        });
      }

      logger.info(`Notification created and sent: ${notification.id} to user ${data.userId}`);
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create and send notifications to multiple users
   * Multi-tenant: Filters users by company if securityCompanyId provided
   */
  async createBulkNotifications(
    userIds: string[],
    data: Omit<CreateNotificationData, 'userId'>,
    securityCompanyId?: string
  ): Promise<any[]> {
    try {
      // Multi-tenant: Filter users by company if provided
      let validUserIds = userIds;
      if (securityCompanyId) {
        const [companyAdmins, companyGuards, companyClients] = await Promise.all([
          prisma.companyUser.findMany({
            where: { securityCompanyId, isActive: true, userId: { in: userIds } },
            select: { userId: true },
          }),
          prisma.companyGuard.findMany({
            where: { securityCompanyId, isActive: true },
            select: { guard: { select: { userId: true } } },
          }),
          prisma.companyClient.findMany({
            where: { securityCompanyId, isActive: true },
            select: { client: { select: { userId: true } } },
          }),
        ]);

        const companyUserIds = new Set([
          ...companyAdmins.map(cu => cu.userId),
          ...companyGuards.map(cg => cg.guard.userId).filter(Boolean),
          ...companyClients.map(cc => cc.client.userId).filter(Boolean),
        ]);

        // Also include SUPER_ADMIN users
        const superAdmins = await prisma.user.findMany({
          where: { id: { in: userIds }, role: 'SUPER_ADMIN' },
          select: { id: true },
        });

        validUserIds = [
          ...Array.from(companyUserIds),
          ...superAdmins.map(u => u.id),
        ];
      }

      // Create notifications for all valid users
      const notifications = await Promise.all(
        validUserIds.map(userId =>
          this.createNotification(
            { ...data, userId },
            securityCompanyId
          ).catch(error => {
            logger.error(`Failed to create notification for user ${userId}:`, error);
            return null;
          })
        )
      );

      return notifications.filter(n => n !== null);
    } catch (error) {
      logger.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   * Multi-tenant: Filters by company if securityCompanyId provided
   */
  async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
    } = {},
    securityCompanyId?: string
  ): Promise<{ notifications: any[]; total: number; unreadCount: number }> {
    try {
      // Multi-tenant: Validate user belongs to company if provided
      if (securityCompanyId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            companyUsers: { where: { securityCompanyId, isActive: true }, take: 1 },
            guard: { include: { companyGuards: { where: { securityCompanyId, isActive: true }, take: 1 } } },
            client: { include: { companyClients: { where: { securityCompanyId, isActive: true }, take: 1 } } },
          },
        });

        if (!user) {
          throw new Error('User not found');
        }

        const belongsToCompany =
          (user.role === 'ADMIN' && user.companyUsers.length > 0) ||
          (user.role === 'GUARD' && user.guard?.companyGuards.length > 0) ||
          (user.role === 'CLIENT' && user.client?.companyClients.length > 0) ||
          user.role === 'SUPER_ADMIN';

        if (!belongsToCompany) {
          throw new Error('User does not belong to the specified company');
        }
      }

      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;

      const where: any = { userId };
      if (options.unreadOnly) {
        where.isRead = false;
      }
      if (options.type) {
        where.type = options.type;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId, isRead: false } }),
      ]);

      return {
        notifications: notifications.map(n => ({
          ...n,
          data: n.data ? JSON.parse(n.data) : null,
        })),
        total,
        unreadCount,
      };
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<any> {
    try {
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      return await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    try {
      const result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      return { count: result.count };
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      });
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  private async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      if (!userSettings) {
        // Return default preferences
        return {
          pushNotifications: true,
          emailNotifications: true,
          smsNotifications: false,
          shiftReminders: true,
          incidentAlerts: true,
        };
      }

      return {
        pushNotifications: userSettings.pushNotifications,
        emailNotifications: userSettings.emailNotifications,
        smsNotifications: userSettings.smsNotifications,
        shiftReminders: userSettings.shiftReminders,
        incidentAlerts: userSettings.incidentAlerts,
      };
    } catch (error) {
      logger.error('Error getting notification preferences:', error);
      // Return default preferences on error
      return {
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        shiftReminders: true,
        incidentAlerts: true,
      };
    }
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  private shouldSendNotification(
    type: NotificationType,
    preferences: NotificationPreferences
  ): boolean {
    switch (type) {
      case 'SHIFT_REMINDER':
        return preferences.shiftReminders;
      case 'INCIDENT_ALERT':
      case 'EMERGENCY':
        return preferences.incidentAlerts;
      case 'MESSAGE':
      case 'SYSTEM':
        return preferences.pushNotifications;
      default:
        return preferences.pushNotifications;
    }
  }

  /**
   * Send push notification via FCM
   */
  private async sendPushNotification(
    userId: string,
    payload: {
      title: string;
      body: string;
      type: string;
      data?: any;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
    }
  ): Promise<void> {
    try {
      // Get user's FCM token
      const deviceToken = await this.getDeviceToken(userId);
      if (!deviceToken) {
        logger.debug(`No device token found for user ${userId}`);
        return;
      }

      // TODO: Implement FCM push notification sending
      // This would use Firebase Admin SDK or a push notification service
      // For now, log the notification
      logger.info(`Push notification queued for user ${userId}:`, {
        title: payload.title,
        body: payload.body,
        type: payload.type,
      });

      // Example FCM implementation (commented out until FCM is configured):
      // const admin = require('firebase-admin');
      // await admin.messaging().send({
      //   token: deviceToken,
      //   notification: {
      //     title: payload.title,
      //     body: payload.body,
      //   },
      //   data: {
      //     type: payload.type,
      //     ...payload.data,
      //   },
      //   android: {
      //     priority: payload.priority === 'urgent' || payload.priority === 'high' ? 'high' : 'normal',
      //   },
      //   apns: {
      //     headers: {
      //       'apns-priority': payload.priority === 'urgent' || payload.priority === 'high' ? '10' : '5',
      //     },
      //   },
      // });
    } catch (error) {
      logger.error('Error sending push notification:', error);
      // Don't throw - push notifications are not critical
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    userId: string,
    data: { title: string; message: string; type: string }
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true },
      });

      if (!user || !user.email) {
        logger.debug(`No email found for user ${userId}`);
        return;
      }

      // TODO: Implement email sending
      // This would use your email service (e.g., SendGrid, AWS SES)
      logger.info(`Email notification queued for user ${userId} (${user.email}):`, data);
    } catch (error) {
      logger.error('Error sending email notification:', error);
      // Don't throw - email notifications are not critical
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(
    userId: string,
    data: { message: string; type: string }
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true },
      });

      if (!user || !user.phone) {
        logger.debug(`No phone found for user ${userId}`);
        return;
      }

      // TODO: Implement SMS sending
      // This would use your SMS service (e.g., Twilio, AWS SNS)
      logger.info(`SMS notification queued for user ${userId} (${user.phone}):`, data);
    } catch (error) {
      logger.error('Error sending SMS notification:', error);
      // Don't throw - SMS notifications are not critical
    }
  }

  /**
   * Get device token for push notifications
   */
  private async getDeviceToken(userId: string): Promise<string | null> {
    try {
      const deviceToken = await prisma.deviceToken.findFirst({
        where: { userId, isActive: true },
        orderBy: { updatedAt: 'desc' },
      });
      return deviceToken?.token || null;
    } catch (error) {
      logger.error('Error getting device token:', error);
      return null;
    }
  }

  /**
   * Register or update device token for push notifications
   */
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android',
    deviceId?: string
  ): Promise<void> {
    try {
      await prisma.deviceToken.upsert({
        where: {
          userId_token: {
            userId,
            token,
          },
        },
        update: {
          platform,
          deviceId,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          userId,
          token,
          platform,
          deviceId,
          isActive: true,
        },
      });
      logger.info(`Device token registered for user ${userId}, platform: ${platform}`);
    } catch (error) {
      logger.error('Error registering device token:', error);
      throw error;
    }
  }
}

export default NotificationService.getInstance();

