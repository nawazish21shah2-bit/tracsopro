import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import userController from '../controllers/userController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'profile-pictures');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).userId || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `profile_${userId}_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'));
    }
  },
});

/**
 * @swagger
 * /users/profile-picture:
 *   post:
 *     summary: Upload profile picture
 *     description: Upload a new profile picture for the authenticated user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
 *       400:
 *         description: Invalid file or upload error
 *       401:
 *         description: Unauthorized
 */
router.post('/profile-picture', authenticate, upload.single('profilePicture'), userController.uploadProfilePicture);

/**
 * @swagger
 * /users/profile-picture:
 *   patch:
 *     summary: Update profile picture URL
 *     description: Update the profile picture URL for the authenticated user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profilePictureUrl:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Profile picture URL updated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch('/profile-picture', authenticate, userController.updateProfilePictureUrl);

/**
 * @swagger
 * /users/profile-picture:
 *   delete:
 *     summary: Remove profile picture
 *     description: Remove the profile picture for the authenticated user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile picture removed successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/profile-picture', authenticate, userController.removeProfilePicture);

export default router;

