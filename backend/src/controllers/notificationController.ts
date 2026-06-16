import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import notificationService from '../services/notificationService.js';
import { isFirebaseAdminInitialized } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import prisma from '../config/database.js';

export class NotificationController {
  /**
   * Get user notifications
   * GET /api/notifications
   */
  async getNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const securityCompanyId = req.securityCompanyId; // Multi-tenant filter
      const { page = 1, limit = 50, unreadOnly, type } = req.query;

      const result = await notificationService.getUserNotifications(
        userId,
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          unreadOnly: unreadOnly === 'true',
          type: type as any,
        },
        securityCompanyId
      );

      res.json({
        success: true,
        data: result.notifications,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit as string)),
        },
        unreadCount: result.unreadCount,
      });
    } catch (error) {
      logger.error('Error getting notifications:', error);
      next(error);
    }
  }

  /**
   * Mark notification as read
   * PUT /api/notifications/:id/read
   */
  async markAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      await notificationService.markAsRead(id, userId);

      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * PUT /api/notifications/read-all
   */
  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;

      const result = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: `${result.count} notifications marked as read`,
        data: result,
      });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      next(error);
    }
  }

  /**
   * Delete notification
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      await notificationService.deleteNotification(id, userId);

      res.json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (error) {
      logger.error('Error deleting notification:', error);
      next(error);
    }
  }

  /**
   * Delete all notifications for the current user
   * DELETE /api/notifications
   */
  async clearAllNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const result = await notificationService.deleteAllNotifications(userId);

      res.json({
        success: true,
        message: `${result.count} notifications deleted`,
        data: result,
      });
    } catch (error) {
      logger.error('Error clearing all notifications:', error);
      next(error);
    }
  }

  /**
   * Push diagnostics for the current user (device token + Firebase status)
   * GET /api/notifications/push-status
   */
  async getPushStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const token = await prisma.deviceToken.findFirst({
        where: { userId, isActive: true },
        orderBy: { updatedAt: 'desc' },
        select: { platform: true, updatedAt: true, token: true },
      });

      res.json({
        success: true,
        data: {
          firebaseConfigured: isFirebaseAdminInitialized(),
          hasDeviceToken: Boolean(token),
          platform: token?.platform ?? null,
          tokenRegisteredAt: token?.updatedAt ?? null,
          tokenPreview: token?.token ? `${token.token.slice(0, 12)}...` : null,
        },
      });
    } catch (error) {
      logger.error('Error getting push status:', error);
      next(error);
    }
  }

  /**
   * Send a test push notification to the current user's device
   * POST /api/notifications/test-push
   */
  async sendTestPush(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;

      if (!isFirebaseAdminInitialized()) {
        res.status(503).json({
          success: false,
          message:
            'Firebase Admin is not configured on the server. Add backend/keys/firebase-service-account.json',
        });
        return;
      }

      const deviceToken = await prisma.deviceToken.findFirst({
        where: { userId, isActive: true },
        orderBy: { updatedAt: 'desc' },
      });

      if (!deviceToken) {
        res.status(400).json({
          success: false,
          message: 'No device token for this user. Open the app on your phone and log in first.',
        });
        return;
      }

      const notification = await notificationService.createNotification({
        userId,
        type: 'SYSTEM',
        title: 'TracSOpro Test',
        message: 'Push notifications are working!',
        data: { test: true },
        sendPush: true,
        priority: 'high',
      });

      res.json({
        success: true,
        message: 'Test notification sent',
        data: { notificationId: notification?.id ?? null },
      });
    } catch (error) {
      logger.error('Error sending test push:', error);
      next(error);
    }
  }

  /**
   * Register device token for push notifications
   * POST /api/notifications/register-device
   */
  async registerDevice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { token, platform, deviceId } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Device token is required',
        });
      }

      await notificationService.registerDeviceToken(
        userId,
        token,
        platform as 'ios' | 'android',
        deviceId
      );

      logger.info(`Device token registered for user ${userId}`);

      res.json({
        success: true,
        message: 'Device token registered successfully',
      });
    } catch (error) {
      logger.error('Error registering device token:', error);
      next(error);
    }
  }

  /**
   * Record a notification event (delivered/opened) from client
   * POST /api/notifications/record-event
   * body: { notificationId?: string, eventType: 'DELIVERED' | 'OPENED', notificationType?: string }
   */
  async recordEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { notificationId, eventType, notificationType } = req.body;
      if (!eventType) {
        return res.status(400).json({ success: false, message: 'eventType is required' });
      }

      let metricType = '';
      if (eventType === 'DELIVERED') metricType = 'NOTIFICATIONS_DELIVERED';
      else if (eventType === 'OPENED') metricType = 'NOTIFICATIONS_OPENED';
      else return res.status(400).json({ success: false, message: 'Invalid eventType' });

      await prisma.platformAnalytics.create({
        data: {
          securityCompanyId: null,
          metricType,
          metricValue: 1,
          dimensions: { userId, notificationId: notificationId || null, notificationType: notificationType || null },
          timestamp: new Date(),
        },
      });

      res.json({ success: true, message: 'Event recorded' });
    } catch (error) {
      logger.error('Error recording notification event:', error);
      next(error);
    }
  }

  /**
   * Get aggregated notification stats
   * GET /api/notifications/stats?start=YYYY-MM-DD&end=YYYY-MM-DD&metric=NOTIFICATIONS_SENT
   */
  async getNotificationStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { start, end, metric } = req.query;
      const where: any = {};
      if (metric) where.metricType = metric;
      if (start || end) {
        where.timestamp = {};
        if (start) where.timestamp.gte = new Date(start as string);
        if (end) {
          const endDate = new Date(end as string);
          // include full day
          endDate.setHours(23, 59, 59, 999);
          where.timestamp.lte = endDate;
        }
      }

      const rows = await prisma.platformAnalytics.findMany({ where, orderBy: { timestamp: 'asc' } });

      // Aggregate counts by metricType and day
      const aggregated: Record<string, Record<string, number>> = {};
      rows.forEach(r => {
        const key = r.metricType;
        const day = r.timestamp.toISOString().slice(0, 10);
        aggregated[key] = aggregated[key] || {};
        aggregated[key][day] = (aggregated[key][day] || 0) + (r.metricValue || 0);
      });

      res.json({ success: true, data: aggregated });
    } catch (error) {
      logger.error('Error fetching notification stats:', error);
      next(error);
    }
  }
}

export default new NotificationController();

