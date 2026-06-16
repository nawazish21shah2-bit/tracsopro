import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService.js';
import otpService from '../services/otpService.js';
import { AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Register request received', { email: req.body?.email, role: req.body?.role });
      const result = await authService.register(req.body);
      const userId = (result as { userId?: string; user?: { id: string } }).userId
        ?? (result as { user?: { id: string } }).user?.id;
      logger.info('Register successful', { email: req.body?.email, userId });
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Register error', { error });
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body as { email?: string };
      logger.info('Login attempt', { email });
      const result = await authService.login(req.body);
      logger.info('Login successful', { email, userId: result.user.id, role: result.user.role });
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Login error', { error });
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required for logout',
        });
        return;
      }
      await authService.logout(refreshToken);
      res.json({
        success: true,
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.userId!);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.userId!, currentPassword, newPassword);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, otp } = req.body;

      if (!userId || !otp) {
        res.status(400).json({
          success: false,
          message: 'User ID and OTP are required',
        });
        return;
      }

      // Validate OTP format
      if (!/^\d{6}$/.test(otp)) {
        res.status(400).json({
          success: false,
          message: 'OTP must be a 6-digit number',
        });
        return;
      }

      const isValid = await otpService.verifyOTP(userId, otp);

      if (!isValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP. Please request a new code.',
        });
        return;
      }

      // Generate auth tokens after successful verification
      const result = await authService.loginById(userId);

      res.json({
        success: true,
        data: result,
        message: 'Email verified successfully',
      });
    } catch (error: any) {
      // Handle rate limiting errors specifically
      if (error.message?.includes('Too many OTP attempts')) {
        res.status(429).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }

  async resendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      await authService.resendOTP(userId);

      res.json({
        success: true,
        message: 'A new OTP has been sent to your email address',
      });
    } catch (error: any) {
      // Handle rate limiting and validation errors
      if (error.message?.includes('Too many') || error.message?.includes('rate limit')) {
        res.status(429).json({
          success: false,
          message: error.message,
        });
        return;
      }
      if (error.message?.includes('already verified')) {
        res.status(400).json({
          success: false,
          message: 'Email is already verified',
        });
        return;
      }
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email address is required',
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Please enter a valid email address',
        });
        return;
      }

      await otpService.sendPasswordResetOTP(email.toLowerCase());

      res.json({
        success: true,
        message: 'If this email is registered, you will receive a password reset code shortly',
      });
    } catch (error: any) {
      // Handle rate limiting errors
      if (error.message?.includes('Too many') || error.message?.includes('rate limit')) {
        res.status(429).json({
          success: false,
          message: error.message,
        });
        return;
      }
      // Don't expose specific error details for security
      res.json({
        success: true,
        message: 'If this email is registered, you will receive a password reset code shortly',
      });
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Email, OTP, and new password are required',
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Please enter a valid email address',
        });
        return;
      }

      // Validate OTP format
      if (!/^\d{6}$/.test(otp)) {
        res.status(400).json({
          success: false,
          message: 'OTP must be a 6-digit number',
        });
        return;
      }

      // Validate password strength
      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
        });
        return;
      }

      const isValid = await otpService.verifyOTPByEmail(email.toLowerCase(), otp);

      if (!isValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP. Please request a new password reset code.',
        });
        return;
      }

      await authService.resetPassword(email.toLowerCase(), newPassword);

      res.json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      });
    } catch (error: any) {
      // Handle rate limiting errors
      if (error.message?.includes('Too many') || error.message?.includes('rate limit')) {
        res.status(429).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      const { firstName, lastName, phone, profilePictureUrl } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const result = await authService.updateProfile(userId, {
        firstName,
        lastName,
        phone,
        profilePictureUrl,
      });

      res.json({
        success: true,
        data: result,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
