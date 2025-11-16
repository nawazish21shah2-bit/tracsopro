import { Router } from 'express';
import emergencyController from '../controllers/emergencyController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /emergency/alert:
 *   post:
 *     summary: Trigger emergency alert
 *     description: Guards can trigger emergency alerts with location and details
 *     tags: [Emergency]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - severity
 *               - location
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [PANIC, MEDICAL, SECURITY, FIRE, CUSTOM]
 *                 example: PANIC
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 example: CRITICAL
 *               location:
 *                 type: object
 *                 required:
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 40.7128
 *                   longitude:
 *                     type: number
 *                     example: -74.0060
 *                   accuracy:
 *                     type: number
 *                     example: 10
 *                   address:
 *                     type: string
 *                     example: "123 Main St, New York, NY"
 *               message:
 *                 type: string
 *                 example: "Suspicious activity observed"
 *     responses:
 *       201:
 *         description: Emergency alert triggered successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Guards only
 */
router.post('/alert', authorize('GUARD'), emergencyController.triggerEmergencyAlert);

/**
 * @swagger
 * /emergency/alert/{alertId}/acknowledge:
 *   post:
 *     summary: Acknowledge emergency alert
 *     description: Admins and clients can acknowledge emergency alerts
 *     tags: [Emergency]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *         description: Emergency alert ID
 *     responses:
 *       200:
 *         description: Alert acknowledged successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins and clients only
 *       404:
 *         description: Alert not found
 */
router.post('/alert/:alertId/acknowledge', authorize('ADMIN', 'CLIENT'), emergencyController.acknowledgeEmergencyAlert);

/**
 * @swagger
 * /emergency/alert/{alertId}/resolve:
 *   post:
 *     summary: Resolve emergency alert
 *     description: Admins can resolve emergency alerts with resolution details
 *     tags: [Emergency]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *         description: Emergency alert ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resolution
 *             properties:
 *               resolution:
 *                 type: string
 *                 example: "False alarm - security check completed"
 *               status:
 *                 type: string
 *                 enum: [RESOLVED, FALSE_ALARM]
 *                 default: RESOLVED
 *                 example: RESOLVED
 *     responses:
 *       200:
 *         description: Alert resolved successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins only
 *       404:
 *         description: Alert not found
 */
router.post('/alert/:alertId/resolve', authorize('ADMIN'), emergencyController.resolveEmergencyAlert);

/**
 * @swagger
 * /emergency/alerts/active:
 *   get:
 *     summary: Get active emergency alerts
 *     description: Get all currently active emergency alerts
 *     tags: [Emergency]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active alerts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EmergencyAlert'
 *                 count:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins and clients only
 */
router.get('/alerts/active', authorize('ADMIN', 'CLIENT'), emergencyController.getActiveEmergencyAlerts);

/**
 * @swagger
 * /emergency/guard/{guardId}/history:
 *   get:
 *     summary: Get emergency alert history for a guard
 *     description: Get emergency alert history for a specific guard
 *     tags: [Emergency]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: guardId
 *         required: true
 *         schema:
 *           type: string
 *         description: Guard ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of alerts to return
 *     responses:
 *       200:
 *         description: Guard emergency history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Guards can only see their own history
 *       404:
 *         description: Guard not found
 */
router.get('/guard/:guardId/history', emergencyController.getGuardEmergencyHistory);

/**
 * @swagger
 * /emergency/statistics:
 *   get:
 *     summary: Get emergency statistics
 *     description: Get emergency alert statistics and analytics
 *     tags: [Emergency]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
 *     responses:
 *       200:
 *         description: Emergency statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins only
 */
router.get('/statistics', authorize('ADMIN'), emergencyController.getEmergencyStatistics);

export default router;
