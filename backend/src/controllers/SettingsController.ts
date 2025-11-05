import { Request, Response } from 'express';
import { SettingsService } from '../services/SettingsService';
import { AuthRequest } from '../middleware/auth';

export class SettingsController {
  private settingsService: SettingsService;

  constructor() {
    this.settingsService = new SettingsService();
  }

  /**
   * @swagger
   * /api/settings/notifications:
   *   get:
   *     summary: Get user notification settings
   *     tags: [Settings]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Notification settings retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     pushNotifications:
   *                       type: boolean
   *                     emailNotifications:
   *                       type: boolean
   *                     smsNotifications:
   *                       type: boolean
   *                     shiftReminders:
   *                       type: boolean
   *                     incidentAlerts:
   *                       type: boolean
   */
  async getNotificationSettings(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const settings = await this.settingsService.getNotificationSettings(userId);
      
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error getting notification settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification settings'
      });
    }
  }

  /**
   * @swagger
   * /api/settings/notifications:
   *   put:
   *     summary: Update user notification settings
   *     tags: [Settings]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               pushNotifications:
   *                 type: boolean
   *               emailNotifications:
   *                 type: boolean
   *               smsNotifications:
   *                 type: boolean
   *               shiftReminders:
   *                 type: boolean
   *               incidentAlerts:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Notification settings updated successfully
   */
  async updateNotificationSettings(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const settings = req.body;
      
      const updatedSettings = await this.settingsService.updateNotificationSettings(userId, settings);
      
      res.json({
        success: true,
        data: updatedSettings,
        message: 'Notification settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification settings'
      });
    }
  }

  /**
   * @swagger
   * /api/settings/profile:
   *   get:
   *     summary: Get user profile settings
   *     tags: [Settings]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile settings retrieved successfully
   */
  async getProfileSettings(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const profile = await this.settingsService.getProfileSettings(userId);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error('Error getting profile settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile settings'
      });
    }
  }

  /**
   * @swagger
   * /api/settings/profile:
   *   put:
   *     summary: Update user profile settings
   *     tags: [Settings]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               phone:
   *                 type: string
   *               timezone:
   *                 type: string
   *     responses:
   *       200:
   *         description: Profile settings updated successfully
   */
  async updateProfileSettings(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const profileData = req.body;
      
      const updatedProfile = await this.settingsService.updateProfileSettings(userId, profileData);
      
      res.json({
        success: true,
        data: updatedProfile,
        message: 'Profile settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating profile settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile settings'
      });
    }
  }

  /**
   * @swagger
   * /api/settings/support/contact:
   *   post:
   *     summary: Submit support request
   *     tags: [Settings]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - subject
   *               - message
   *             properties:
   *               subject:
   *                 type: string
   *               message:
   *                 type: string
   *               category:
   *                 type: string
   *                 enum: [technical, billing, general, urgent]
   *     responses:
   *       200:
   *         description: Support request submitted successfully
   */
  async submitSupportRequest(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { subject, message, category } = req.body;
      
      const ticket = await this.settingsService.createSupportTicket(userId, {
        subject,
        message,
        category: category || 'general'
      });
      
      res.json({
        success: true,
        data: ticket,
        message: 'Support request submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting support request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit support request'
      });
    }
  }

  /**
   * @swagger
   * /api/settings/attendance-history:
   *   get:
   *     summary: Get user attendance history (Guards only)
   *     tags: [Settings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Attendance history retrieved successfully
   */
  async getAttendanceHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Check if user is a guard
      if (req.user!.role !== 'GUARD') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Guards only.'
        });
      }
      
      const history = await this.settingsService.getAttendanceHistory(userId, page, limit);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error getting attendance history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get attendance history'
      });
    }
  }

  /**
   * @swagger
   * /api/settings/past-jobs:
   *   get:
   *     summary: Get user past jobs (Guards only)
   *     tags: [Settings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Past jobs retrieved successfully
   */
  async getPastJobs(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Check if user is a guard
      if (req.user!.role !== 'GUARD') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Guards only.'
        });
      }
      
      const jobs = await this.settingsService.getPastJobs(userId, page, limit);
      
      res.json({
        success: true,
        data: jobs
      });
    } catch (error) {
      console.error('Error getting past jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get past jobs'
      });
    }
  }
}
