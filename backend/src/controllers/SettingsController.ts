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
      
      // Validate settings
      const validSettings: any = {};
      if (typeof settings.pushNotifications === 'boolean') {
        validSettings.pushNotifications = settings.pushNotifications;
      }
      if (typeof settings.emailNotifications === 'boolean') {
        validSettings.emailNotifications = settings.emailNotifications;
      }
      if (typeof settings.smsNotifications === 'boolean') {
        validSettings.smsNotifications = settings.smsNotifications;
      }
      if (typeof settings.shiftReminders === 'boolean') {
        validSettings.shiftReminders = settings.shiftReminders;
      }
      if (typeof settings.incidentAlerts === 'boolean') {
        validSettings.incidentAlerts = settings.incidentAlerts;
      }
      if (settings.timezone !== undefined) {
        validSettings.timezone = settings.timezone;
      }
      if (settings.language !== undefined && typeof settings.language === 'string') {
        validSettings.language = settings.language;
      }
      
      const updatedSettings = await this.settingsService.updateNotificationSettings(userId, validSettings);
      
      res.json({
        success: true,
        data: updatedSettings,
        message: 'Notification settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update notification settings'
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
      
      // Validate and sanitize input
      const validData: any = {};
      if (profileData.firstName !== undefined && typeof profileData.firstName === 'string') {
        const trimmed = profileData.firstName.trim();
        if (trimmed.length > 0 && trimmed.length <= 50) {
          validData.firstName = trimmed;
        }
      }
      if (profileData.lastName !== undefined && typeof profileData.lastName === 'string') {
        const trimmed = profileData.lastName.trim();
        if (trimmed.length > 0 && trimmed.length <= 50) {
          validData.lastName = trimmed;
        }
      }
      if (profileData.phone !== undefined) {
        if (profileData.phone === null || profileData.phone === '') {
          validData.phone = null;
        } else if (typeof profileData.phone === 'string' && profileData.phone.length <= 20) {
          validData.phone = profileData.phone.trim();
        }
      }
      if (profileData.timezone !== undefined) {
        validData.timezone = profileData.timezone || null;
      }
      if (profileData.language !== undefined && typeof profileData.language === 'string') {
        validData.language = profileData.language;
      }
      
      if (Object.keys(validData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }
      
      const updatedProfile = await this.settingsService.updateProfileSettings(userId, validData);
      
      res.json({
        success: true,
        data: updatedProfile,
        message: 'Profile settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating profile settings:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update profile settings'
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
      
      // Validate required fields
      if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Subject is required'
        });
      }
      
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }
      
      if (subject.trim().length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Subject must be 200 characters or less'
        });
      }
      
      if (message.trim().length > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Message must be 5000 characters or less'
        });
      }
      
      const validCategory = ['technical', 'billing', 'general', 'urgent'].includes(category?.toLowerCase())
        ? category.toLowerCase()
        : 'general';
      
      const ticket = await this.settingsService.createSupportTicket(userId, {
        subject: subject.trim(),
        message: message.trim(),
        category: validCategory as 'technical' | 'billing' | 'general' | 'urgent'
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
        message: error instanceof Error ? error.message : 'Failed to submit support request'
      });
    }
  }

  /**
   * @swagger
   * /api/settings/support/tickets:
   *   get:
   *     summary: Get user's support tickets
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
   *         description: Support tickets retrieved successfully
   */
  async getSupportTickets(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await this.settingsService.getSupportTickets(userId, page, limit);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting support tickets:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get support tickets'
      });
    }
  }

  /**
   * @swagger
   * /api/settings/support/tickets/:id:
   *   get:
   *     summary: Get support ticket by ID
   *     tags: [Settings]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Support ticket retrieved successfully
   */
  async getSupportTicketById(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      
      const ticket = await this.settingsService.getSupportTicketById(id, userId);
      
      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      console.error('Error getting support ticket:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get support ticket'
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

  /**
   * @swagger
   * /api/settings/company:
   *   get:
   *     summary: Get company details (Clients only)
   *     tags: [Settings]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Company details retrieved successfully
   */
  async getCompanyDetails(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      // Check if user is a client
      if (req.user!.role !== 'CLIENT') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Clients only.'
        });
      }
      
      const profile = await this.settingsService.getProfileSettings(userId);
      
      res.json({
        success: true,
        data: profile.client || null
      });
    } catch (error) {
      console.error('Error getting company details:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get company details'
      });
    }
  }

  /**
   * @swagger
   * /api/settings/company:
   *   put:
   *     summary: Update company details (Clients only)
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
   *               companyName:
   *                 type: string
   *               companyRegistrationNumber:
   *                 type: string
   *               taxId:
   *                 type: string
   *               address:
   *                 type: string
   *               city:
   *                 type: string
   *               state:
   *                 type: string
   *               zipCode:
   *                 type: string
   *               country:
   *                 type: string
   *               website:
   *                 type: string
   *     responses:
   *       200:
   *         description: Company details updated successfully
   */
  async updateCompanyDetails(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const companyData = req.body;
      
      // Check if user is a client
      if (req.user!.role !== 'CLIENT') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Clients only.'
        });
      }
      
      // Validate and sanitize input
      const validData: any = {};
      if (companyData.companyName !== undefined && typeof companyData.companyName === 'string') {
        const trimmed = companyData.companyName.trim();
        if (trimmed.length > 0 && trimmed.length <= 200) {
          validData.companyName = trimmed;
        }
      }
      if (companyData.companyRegistrationNumber !== undefined && typeof companyData.companyRegistrationNumber === 'string') {
        validData.companyRegistrationNumber = companyData.companyRegistrationNumber.trim();
      }
      if (companyData.taxId !== undefined && typeof companyData.taxId === 'string') {
        validData.taxId = companyData.taxId.trim();
      }
      if (companyData.address !== undefined && typeof companyData.address === 'string') {
        validData.address = companyData.address.trim();
      }
      if (companyData.city !== undefined && typeof companyData.city === 'string') {
        validData.city = companyData.city.trim();
      }
      if (companyData.state !== undefined && typeof companyData.state === 'string') {
        validData.state = companyData.state.trim();
      }
      if (companyData.zipCode !== undefined && typeof companyData.zipCode === 'string') {
        validData.zipCode = companyData.zipCode.trim();
      }
      if (companyData.country !== undefined && typeof companyData.country === 'string') {
        validData.country = companyData.country.trim();
      }
      if (companyData.website !== undefined && typeof companyData.website === 'string') {
        validData.website = companyData.website.trim();
      }
      
      if (Object.keys(validData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }
      
      const updatedCompany = await this.settingsService.updateCompanyDetails(userId, validData);
      
      res.json({
        success: true,
        data: updatedCompany,
        message: 'Company details updated successfully'
      });
    } catch (error) {
      console.error('Error updating company details:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update company details'
      });
    }
  }

  /**
   * @swagger
   * /api/settings/change-password:
   *   post:
   *     summary: Change user password
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
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *               newPassword:
   *                 type: string
   *     responses:
   *       200:
   *         description: Password changed successfully
   */
  async changePassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || typeof currentPassword !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Current password is required'
        });
      }

      if (!newPassword || typeof newPassword !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'New password is required'
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long'
        });
      }

      // Use AuthService to change password
      const { AuthService } = await import('../services/authService');
      const authService = new AuthService();
      await authService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to change password'
      });
    }
  }
}
