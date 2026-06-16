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

/** Users who triggered the event — never notify them (e.g. guard who sent the alert). */
export type NotificationExcludeUserIds = string | string[] | undefined;

export class NotificationService {
  private static instance: NotificationService;
  private firebaseInitialized: boolean = false;

  /**
   * Remove actors / duplicates from a recipient list.
   */
  filterRecipients(userIds: string[], excludeUserIds?: NotificationExcludeUserIds): string[] {
    const exclude = new Set(
      (excludeUserIds == null
        ? []
        : Array.isArray(excludeUserIds)
          ? excludeUserIds
          : [excludeUserIds]
      ).filter(Boolean)
    );
    const seen = new Set<string>();
    return userIds.filter((id) => {
      if (!id || exclude.has(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  private shouldSkipActor(userId: string, excludeUserIds?: NotificationExcludeUserIds): boolean {
    if (!excludeUserIds) return false;
    const exclude = Array.isArray(excludeUserIds) ? excludeUserIds : [excludeUserIds];
    return exclude.includes(userId);
  }

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
    securityCompanyId?: string,
    excludeUserIds?: NotificationExcludeUserIds
  ): Promise<any> {
    try {
      if (this.shouldSkipActor(data.userId, excludeUserIds)) {
        logger.debug(`Notification skipped for actor ${data.userId}`);
        return null;
      }

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
        const pushPayload = {
          title: data.title,
          body: data.message,
          type: data.type,
          data: {
            ...(data.data || {}),
            notificationId: notification.id,
          },
          priority: data.priority || 'normal',
        };

        if (data.type === 'EMERGENCY') {
          notificationPromises.push(
            this.sendPushWithRetry(data.userId, pushPayload).catch(err =>
              logger.error('Emergency push notification failed:', err)
            )
          );
        } else {
          notificationPromises.push(
            this.sendPushNotification(data.userId, pushPayload).catch(err =>
              logger.error('Push notification failed:', err)
            )
          );
        }
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
    securityCompanyId?: string,
    excludeUserIds?: NotificationExcludeUserIds
  ): Promise<any[]> {
    try {
      // Multi-tenant: Filter users by company if provided
      let validUserIds = this.filterRecipients(userIds, excludeUserIds);
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

        validUserIds = this.filterRecipients(
          [
            ...Array.from(companyUserIds),
            ...superAdmins.map(u => u.id),
          ],
          excludeUserIds
        );
      }

      if (validUserIds.length === 0) {
        return [];
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
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<{ count: number }> {
    try {
      const result = await prisma.notification.deleteMany({
        where: { userId },
      });
      return { count: result.count };
    } catch (error) {
      logger.error('Error deleting all notifications:', error);
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
   * Send push notification via FCM (fire-and-forget wrapper)
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
    await this.deliverPush(userId, payload);
  }

  /**
   * Attempt FCM delivery once. Returns delivery outcome for retry logic.
   */
  private async deliverPush(
    userId: string,
    payload: {
      title: string;
      body: string;
      type: string;
      data?: any;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
    }
  ): Promise<'delivered' | 'skipped' | 'failed'> {
    let deviceToken: string | null = null;
    try {
      deviceToken = await this.getDeviceToken(userId);
      if (!deviceToken) {
        logger.debug(`No device token for user ${userId}`);
        return 'skipped';
      }

      const firebaseAdmin = (await import('../config/firebase.js')).getFirebaseAdmin();
      if (!firebaseAdmin) {
        logger.warn('Firebase Admin not initialized - skipping push notification');
        return 'failed';
      }

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

      try {
        await prisma.platformAnalytics.create({
          data: {
            securityCompanyId: null,
            metricType: 'NOTIFICATIONS_SENT',
            metricValue: 1,
            dimensions: { userId, notificationType: payload.type },
            timestamp: new Date(),
          },
        });
      } catch (analyticsError) {
        logger.error('Error recording notification sent analytics:', analyticsError);
      }

      return 'delivered';
    } catch (error: any) {
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        if (deviceToken) {
          await this.markDeviceTokenInvalid(deviceToken);
        }
        return 'skipped';
      }

      logger.error(`Error sending push notification to user ${userId}:`, error);
      return 'failed';
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Emergency push delivery with inline retries and persistent queue fallback.
   */
  async sendPushWithRetry(
    userId: string,
    payload: {
      title: string;
      body: string;
      type: string;
      data?: any;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
    },
    options?: { maxInlineAttempts?: number }
  ): Promise<boolean> {
    const maxInlineAttempts = options?.maxInlineAttempts ?? 3;

    for (let attempt = 1; attempt <= maxInlineAttempts; attempt++) {
      const result = await this.deliverPush(userId, payload);
      if (result === 'delivered') {
        return true;
      }
      if (result === 'skipped') {
        return false;
      }
      if (attempt < maxInlineAttempts) {
        await this.sleep(1000 * Math.pow(2, attempt - 1));
      }
    }

    await this.enqueuePushRetry(userId, payload);
    return false;
  }

  private async enqueuePushRetry(
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
      await prisma.pushNotificationRetry.create({
        data: {
          userId,
          title: payload.title,
          body: payload.body,
          type: payload.type,
          payloadData: payload.data ?? undefined,
          priority: payload.priority || 'normal',
          nextRetryAt: new Date(Date.now() + 60_000),
        },
      });
      logger.warn(`Queued push retry for user ${userId} (${payload.type})`);
    } catch (error) {
      logger.error(`Failed to enqueue push retry for user ${userId}:`, error);
    }
  }

  async processPushRetryQueue(limit = 20): Promise<void> {
    const pending = await prisma.pushNotificationRetry.findMany({
      where: {
        status: 'PENDING',
        nextRetryAt: { lte: new Date() },
      },
      take: limit,
      orderBy: { nextRetryAt: 'asc' },
    });

    for (const job of pending) {
      const result = await this.deliverPush(job.userId, {
        title: job.title,
        body: job.body,
        type: job.type,
        data: job.payloadData,
        priority: job.priority as 'low' | 'normal' | 'high' | 'urgent',
      });

      if (result === 'delivered') {
        await prisma.pushNotificationRetry.update({
          where: { id: job.id },
          data: { status: 'SENT', attempts: job.attempts + 1 },
        });
        continue;
      }

      if (result === 'skipped') {
        await prisma.pushNotificationRetry.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            attempts: job.attempts + 1,
            lastError: 'No valid device token',
          },
        });
        continue;
      }

      const attempts = job.attempts + 1;
      if (attempts >= job.maxAttempts) {
        await prisma.pushNotificationRetry.update({
          where: { id: job.id },
          data: {
            status: 'FAILED',
            attempts,
            lastError: 'Max retries exceeded',
          },
        });
      } else {
        const delayMs = Math.min(60_000 * Math.pow(2, attempts - 1), 3_600_000);
        await prisma.pushNotificationRetry.update({
          where: { id: job.id },
          data: {
            attempts,
            nextRetryAt: new Date(Date.now() + delayMs),
            lastError: 'FCM delivery failed',
          },
        });
      }
    }
  }

  startPushRetryProcessor(intervalMs = 60_000): void {
    setInterval(() => {
      this.processPushRetryQueue().catch(err =>
        logger.error('Push retry queue processing failed:', err)
      );
    }, intervalMs);
    logger.info('Push notification retry processor started');
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
   * Mark a specific FCM token as invalid (dead token cleanup).
   */
  async markDeviceTokenInvalid(token: string): Promise<void> {
    const result = await prisma.deviceToken.updateMany({
      where: { token, isActive: true },
      data: { isActive: false, updatedAt: new Date() },
    });
    if (result.count > 0) {
      logger.warn(`Deactivated ${result.count} invalid device token record(s)`);
    }
  }

  /**
   * Remove stale inactive tokens and cap active tokens per user.
   */
  async cleanupStaleDeviceTokens(options?: {
    inactiveDays?: number;
    maxActivePerUser?: number;
  }): Promise<{ deletedInactive: number; deactivatedExcess: number }> {
    const inactiveDays = options?.inactiveDays ?? 30;
    const maxActivePerUser = options?.maxActivePerUser ?? 5;
    const cutoff = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);

    const deletedInactive = await prisma.deviceToken.deleteMany({
      where: {
        isActive: false,
        updatedAt: { lt: cutoff },
      },
    });

    let deactivatedExcess = 0;
    const activeTokens = await prisma.deviceToken.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, userId: true },
    });

    const tokensByUser = new Map<string, string[]>();
    for (const token of activeTokens) {
      const list = tokensByUser.get(token.userId) || [];
      list.push(token.id);
      tokensByUser.set(token.userId, list);
    }

    const excessTokenIds: string[] = [];
    for (const ids of tokensByUser.values()) {
      if (ids.length > maxActivePerUser) {
        excessTokenIds.push(...ids.slice(maxActivePerUser));
      }
    }

    if (excessTokenIds.length > 0) {
      const result = await prisma.deviceToken.updateMany({
        where: { id: { in: excessTokenIds } },
        data: { isActive: false, updatedAt: new Date() },
      });
      deactivatedExcess = result.count;
    }

    if (deletedInactive.count > 0 || deactivatedExcess > 0) {
      logger.info(
        `Device token cleanup: deleted ${deletedInactive.count} inactive, deactivated ${deactivatedExcess} excess`
      );
    }

    return { deletedInactive: deletedInactive.count, deactivatedExcess };
  }

  startDeviceTokenCleanupProcessor(intervalMs = 24 * 60 * 60 * 1000): void {
    setInterval(() => {
      this.cleanupStaleDeviceTokens().catch(err =>
        logger.error('Device token cleanup failed:', err)
      );
    }, intervalMs);
    logger.info('Device token cleanup processor started');
  }

  /**
   * Notify guard when a shift is assigned
   */
  async notifyShiftAssigned(
    guardUserId: string,
    shift: {
      id: string;
      scheduledStartTime: Date;
      scheduledEndTime: Date;
      locationName?: string | null;
      locationAddress?: string | null;
    },
    securityCompanyId?: string
  ): Promise<void> {
    const location = shift.locationName || shift.locationAddress || 'assigned site';
    const start = new Date(shift.scheduledStartTime).toLocaleString();

    await this.createNotification(
      {
        userId: guardUserId,
        type: 'SHIFT_REMINDER',
        title: 'New Shift Assigned',
        message: `You have been assigned a shift at ${location} starting ${start}.`,
        data: { shiftId: shift.id },
        sendPush: true,
      },
      securityCompanyId
    );
  }

  /**
   * Notify company admins when a guard checks in
   */
  async notifyCheckIn(
    guardUserId: string,
    shift: { id: string; guardId: string; locationName?: string | null },
    adminUserIds: string[],
    securityCompanyId: string
  ): Promise<void> {
    const guard = await prisma.user.findUnique({
      where: { id: guardUserId },
      select: { firstName: true, lastName: true },
    });
    const guardName = guard ? `${guard.firstName} ${guard.lastName}` : 'A guard';
    const location = shift.locationName || 'site';

    await this.createBulkNotifications(
      adminUserIds,
      {
        type: 'SYSTEM',
        title: 'Guard Checked In',
        message: `${guardName} checked in at ${location}.`,
        data: { shiftId: shift.id, guardId: shift.guardId },
        sendPush: true,
      },
      securityCompanyId,
      guardUserId
    );
  }

  /**
   * Notify company admins when a guard checks out
   */
  async notifyCheckOut(
    guardUserId: string,
    shift: { id: string; guardId: string; locationName?: string | null },
    adminUserIds: string[],
    securityCompanyId: string
  ): Promise<void> {
    const guard = await prisma.user.findUnique({
      where: { id: guardUserId },
      select: { firstName: true, lastName: true },
    });
    const guardName = guard ? `${guard.firstName} ${guard.lastName}` : 'A guard';
    const location = shift.locationName || 'site';

    await this.createBulkNotifications(
      adminUserIds,
      {
        type: 'SYSTEM',
        title: 'Guard Checked Out',
        message: `${guardName} checked out from ${location}.`,
        data: { shiftId: shift.id, guardId: shift.guardId },
        sendPush: true,
      },
      securityCompanyId,
      guardUserId
    );
  }

  /**
   * Notify chat participants of a new message (excluding sender)
   */
  async notifyChatMessage(
    recipientUserIds: string[],
    payload: {
      senderName: string;
      senderUserId: string;
      chatId: string;
      messageId: string;
      preview: string;
    },
    securityCompanyId?: string
  ): Promise<void> {
    await this.createBulkNotifications(
      recipientUserIds,
      {
        type: 'MESSAGE',
        title: `Message from ${payload.senderName}`,
        message: payload.preview,
        data: {
          conversationId: payload.chatId,
          chatId: payload.chatId,
          messageId: payload.messageId,
        },
        sendPush: true,
      },
      securityCompanyId,
      payload.senderUserId
    );
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
      if (deviceId) {
        await prisma.deviceToken.updateMany({
          where: {
            userId,
            deviceId,
            platform,
            token: { not: token },
            isActive: true,
          },
          data: { isActive: false, updatedAt: new Date() },
        });
      }

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

      await this.cleanupStaleDeviceTokens({ inactiveDays: 30, maxActivePerUser: 5 });

      logger.info(`Device token registered for user ${userId}, platform: ${platform}`);
    } catch (error) {
      logger.error('Error registering device token:', error);
      throw error;
    }
  }
}

export default NotificationService.getInstance();

