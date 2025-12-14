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
  private firebaseInitialized: boolean = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
      NotificationService.instance.initializeFirebase();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initializeFirebase(): void {
    if (this.firebaseInitialized) return;
    try {
      const { initializeFirebaseAdmin } = require('../config/firebase.js');
      if (initializeFirebaseAdmin()) {
        this.firebaseInitialized = true;
        logger.info('Firebase Admin initialized for NotificationService');
      }
    } catch (error) {
      logger.warn('Firebase Admin initialization failed - push notifications disabled');
    }
  }

  /**
   * Validate user belongs to company (multi-tenant)
   */
  private async validateUserBelongsToCompany(userId: string, securityCompanyId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        companyUsers: { where: { securityCompanyId, isActive: true }, take: 1 },
        guard: { include: { companyGuards: { where: { securityCompanyId, isActive: true }, take: 1 } } },
        client: { include: { companyClients: { where: { securityCompanyId, isActive: true }, take: 1 } } },
      },
    });

    if (!user) return false;

    return (
      user.role === 'SUPER_ADMIN' ||
      (user.role === 'ADMIN' && user.companyUsers.length > 0) ||
      (user.role === 'GUARD' && (user.guard?.companyGuards?.length ?? 0) > 0) ||
      (user.role === 'CLIENT' && (user.client?.companyClients?.length ?? 0) > 0)
    );
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
      // Multi-tenant validation
      if (securityCompanyId && !(await this.validateUserBelongsToCompany(data.userId, securityCompanyId))) {
        throw new Error('User does not belong to the specified company');
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
        data: {
          ...(data.data || {}),
          notificationId: notification.id,
          createdAt: notification.createdAt.toISOString(),
        },
      });

      // Send notifications in parallel (non-blocking)
      const notificationPromises: Promise<void>[] = [];

      if (data.sendPush !== false && preferences.pushNotifications) {
        notificationPromises.push(
          this.sendPushNotification(data.userId, {
            title: data.title,
            body: data.message,
            type: data.type,
            data: data.data,
            priority: data.priority || 'normal',
          }).catch(err => logger.error('Push notification failed:', err))
        );
      }

      if (data.sendEmail && preferences.emailNotifications) {
        notificationPromises.push(
          this.sendEmailNotification(data.userId, {
            title: data.title,
            message: data.message,
            type: data.type,
          }).catch(err => logger.error('Email notification failed:', err))
        );
      }

      if (data.sendSMS && preferences.smsNotifications) {
        notificationPromises.push(
          this.sendSMSNotification(data.userId, {
            message: data.message,
            type: data.type,
          }).catch(err => logger.error('SMS notification failed:', err))
        );
      }

      // Execute all notifications in parallel (don't await - fire and forget)
      Promise.all(notificationPromises).catch(() => {
        // Errors already logged in individual catch blocks
      });

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
      // Multi-tenant validation
      if (securityCompanyId && !(await this.validateUserBelongsToCompany(userId, securityCompanyId))) {
        throw new Error('User does not belong to the specified company');
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
      const deviceToken = await this.getDeviceToken(userId);
      if (!deviceToken) {
        logger.debug(`No device token for user ${userId}`);
        return;
      }

      const firebaseAdmin = (await import('../config/firebase.js')).getFirebaseAdmin();
      if (!firebaseAdmin) {
        logger.warn('Firebase Admin not initialized - skipping push notification');
        return;
      }

      // Convert data values to strings (FCM requirement)
      const stringifiedData: Record<string, string> = {};
      if (payload.data) {
        Object.keys(payload.data).forEach((key) => {
          const value = payload.data![key];
          if (value !== null && value !== undefined) {
            stringifiedData[key] = typeof value === 'string' ? value : JSON.stringify(value);
          }
        });
      }

      const isHighPriority = payload.priority === 'urgent' || payload.priority === 'high';

      const message = {
        token: deviceToken,
        notification: { title: payload.title, body: payload.body },
        data: { type: payload.type, ...stringifiedData },
        android: {
          priority: isHighPriority ? 'high' : 'normal',
          notification: {
            sound: 'default',
            channelId: 'default',
            priority: isHighPriority ? 'max' : 'high',
          },
        },
        apns: {
          headers: { 'apns-priority': isHighPriority ? '10' : '5' },
          payload: {
            aps: { sound: 'default', badge: 1, contentAvailable: true },
          },
        },
      };

      const response = await firebaseAdmin.messaging().send(message);
      logger.info(`Push notification sent to user ${userId}`, { messageId: response });
    } catch (error: any) {
      if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
        logger.warn(`Invalid device token for user ${userId} - marking inactive`);
        await prisma.deviceToken.updateMany({
          where: { userId },
          data: { isActive: false },
        });
      } else {
        logger.error(`Error sending push notification to user ${userId}:`, error);
      }
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

      // Import nodemailer transporter from otpService
      const { getEmailTransporter } = await import('./otpService.js');
      const transporter = getEmailTransporter();

      if (!transporter) {
        logger.warn('Email transporter not configured. Skipping email notification.');
        return;
      }

      // Determine email subject based on notification type
      const subject = this.getEmailSubject(data.type, data.title);
      
      // Generate email HTML content
      const emailHtml = this.generateEmailHtml(data.title, data.message, data.type, user.firstName || 'User');

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@tracsopro.com',
        to: user.email,
        subject: subject,
        html: emailHtml,
        text: `${data.title}\n\n${data.message}`,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Email notification sent successfully to ${user.email}`, { 
        messageId: info.messageId,
        type: data.type 
      });
    } catch (error: any) {
      logger.error('Error sending email notification:', {
        userId,
        error: error.message,
        code: error.code,
      });
      // Don't throw - email notifications are not critical
    }
  }

  /**
   * Get email subject based on notification type
   */
  private getEmailSubject(type: string, title: string): string {
    const prefixes: Record<string, string> = {
      'SHIFT_REMINDER': '📅 Shift Reminder - ',
      'INCIDENT_ALERT': '🚨 Incident Alert - ',
      'EMERGENCY': '🚨 EMERGENCY - ',
      'MESSAGE': '💬 New Message - ',
      'SYSTEM': 'ℹ️ System Notification - ',
    };

    return `${prefixes[type] || '📧 '}${title}`;
  }

  /**
   * Generate HTML email content
   */
  private generateEmailHtml(title: string, message: string, type: string, userName: string): string {
    const colors: Record<string, { primary: string; background: string }> = {
      'SHIFT_REMINDER': { primary: '#1C6CA9', background: '#E3F2FD' },
      'INCIDENT_ALERT': { primary: '#F44336', background: '#FFEBEE' },
      'EMERGENCY': { primary: '#D32F2F', background: '#FFCDD2' },
      'MESSAGE': { primary: '#4CAF50', background: '#E8F5E9' },
      'SYSTEM': { primary: '#757575', background: '#F5F5F5' },
    };

    const colorScheme = colors[type] || colors['SYSTEM'];
    const logoUrl = process.env.EMAIL_LOGO_URL || 'https://via.placeholder.com/180x60/1C6CA9/FFFFFF?text=tracSOpro';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f4f4f4;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-container {
      padding: 40px 30px;
      background-color: ${colorScheme.background};
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-width: 180px;
      height: auto;
      margin-bottom: 20px;
    }
    .content {
      background-color: #ffffff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .title {
      color: ${colorScheme.primary};
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 20px 0;
    }
    .greeting {
      color: #333333;
      font-size: 16px;
      margin: 0 0 15px 0;
    }
    .message {
      color: #666666;
      font-size: 15px;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: ${colorScheme.primary};
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      font-weight: 500;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #999999;
      font-size: 12px;
      border-top: 1px solid #eeeeee;
    }
    .footer-text {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="header">
        <img src="${logoUrl}" alt="tracSOpro Logo" class="logo">
      </div>
      <div class="content">
        <h1 class="title">${title}</h1>
        <p class="greeting">Hello ${userName},</p>
        <div class="message">
          ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">This is an automated email from tracSOpro.</p>
        <p class="footer-text">Need help? Contact us at <a href="mailto:support@tracsopro.com">support@tracsopro.com</a></p>
        <p class="footer-text">© ${new Date().getFullYear()} tracSOpro. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
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

