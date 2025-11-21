/**
 * Operations Routes - Admin Operations Center
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import operationsController from '../controllers/operationsController.js';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Operations metrics
router.get('/metrics', operationsController.getOperationsMetrics);

// Guard statuses
router.get('/guards', operationsController.getGuardStatuses);

export default router;

