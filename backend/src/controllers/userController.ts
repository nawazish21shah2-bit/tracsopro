import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

class UserController {
  /**
   * Upload profile picture
   * POST /users/profile-picture
   */
  async uploadProfilePicture(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      const file = req.file;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      // Generate the URL for the uploaded file
      const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
      const profilePictureUrl = `${baseUrl}/uploads/profile-pictures/${file.filename}`;

      // Get the user to check their role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          role: true,
          profilePictureUrl: true,
        },
      });

      if (!user) {
        // Delete the uploaded file since user doesn't exist
        fs.unlinkSync(file.path);
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Delete old profile picture if exists
      if (user.profilePictureUrl) {
        try {
          const oldFilename = user.profilePictureUrl.split('/').pop();
          if (oldFilename) {
            const oldFilePath = path.join(process.cwd(), 'uploads', 'profile-pictures', oldFilename);
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          }
        } catch (err) {
          logger.warn('Failed to delete old profile picture:', err);
        }
      }

      // Update user's profile picture URL
      await prisma.user.update({
        where: { id: userId },
        data: { profilePictureUrl },
      });

      // If user is a guard, also update the guard profile
      if (user.role === 'GUARD') {
        await prisma.guard.updateMany({
          where: { userId },
          data: { profilePictureUrl },
        });
      }

      logger.info(`Profile picture uploaded for user ${userId}`);

      res.json({
        success: true,
        data: {
          url: profilePictureUrl,
        },
        message: 'Profile picture uploaded successfully',
      });
    } catch (error: any) {
      logger.error('Error uploading profile picture:', error);
      next(error);
    }
  }

  /**
   * Update profile picture URL directly
   * PATCH /users/profile-picture
   */
  async updateProfilePictureUrl(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;
      const { profilePictureUrl } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Get the user to check their role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Update user's profile picture URL
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profilePictureUrl },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          profilePictureUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // If user is a guard, also update the guard profile
      if (user.role === 'GUARD') {
        await prisma.guard.updateMany({
          where: { userId },
          data: { profilePictureUrl },
        });
      }

      logger.info(`Profile picture URL updated for user ${userId}`);

      res.json({
        success: true,
        data: updatedUser,
        message: 'Profile picture updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating profile picture URL:', error);
      next(error);
    }
  }

  /**
   * Remove profile picture
   * DELETE /users/profile-picture
   */
  async removeProfilePicture(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Get the user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          role: true,
          profilePictureUrl: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Delete the profile picture file if it exists and is hosted locally
      if (user.profilePictureUrl && user.profilePictureUrl.includes('/uploads/profile-pictures/')) {
        try {
          const filename = user.profilePictureUrl.split('/').pop();
          if (filename) {
            const filePath = path.join(process.cwd(), 'uploads', 'profile-pictures', filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        } catch (err) {
          logger.warn('Failed to delete profile picture file:', err);
        }
      }

      // Update user's profile picture URL to null
      await prisma.user.update({
        where: { id: userId },
        data: { profilePictureUrl: null },
      });

      // If user is a guard, also update the guard profile
      if (user.role === 'GUARD') {
        await prisma.guard.updateMany({
          where: { userId },
          data: { profilePictureUrl: null },
        });
      }

      logger.info(`Profile picture removed for user ${userId}`);

      res.json({
        success: true,
        data: null,
        message: 'Profile picture removed successfully',
      });
    } catch (error: any) {
      logger.error('Error removing profile picture:', error);
      next(error);
    }
  }
}

export default new UserController();

