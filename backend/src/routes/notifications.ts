import { Router } from 'express';
import notificationController from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management endpoints
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Filter unread notifications only
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SHIFT_REMINDER, INCIDENT_ALERT, MESSAGE, SYSTEM, EMERGENCY]
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/', notificationController.getNotifications);

/**
 * @swagger
 * /api/notifications/:id/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put('/:id/read', notificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/:id:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete('/:id', notificationController.deleteNotification);

/**
 * @swagger
 * /api/notifications/register-device:
 *   post:
 *     summary: Register device token for push notifications
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: FCM device token
 *               platform:
 *                 type: string
 *                 enum: [ios, android]
 *               deviceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device token registered successfully
 */
router.post('/register-device', notificationController.registerDevice);

export default router;

