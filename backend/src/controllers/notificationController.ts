import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import notificationService from '../services/notificationService.js';
import { logger } from '../utils/logger.js';

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
}

export default new NotificationController();

