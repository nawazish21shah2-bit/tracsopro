import { Router } from 'express';
import trackingController from '../controllers/trackingController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Tracking routes
router.post('/location', trackingController.recordLocation);
router.get('/:guardId', trackingController.getGuardTrackingHistory);
router.get('/:guardId/latest', trackingController.getLatestLocation);
router.get('/active/locations', trackingController.getActiveGuardsLocations);

export default router;
