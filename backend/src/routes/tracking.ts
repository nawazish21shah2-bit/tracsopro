import { Router } from 'express';
import trackingController from '../controllers/trackingController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Tracking routes - Guards can record their own location
router.post('/location', authorize('GUARD'), trackingController.recordLocation);
router.get('/history/:guardId', authorize('ADMIN', 'CLIENT'), trackingController.getGuardTrackingHistory);
router.get('/:guardId/latest', authorize('ADMIN', 'CLIENT'), trackingController.getLatestLocation);
router.get('/live-locations', authorize('ADMIN', 'CLIENT'), trackingController.getActiveGuardsLocations);

// Geofencing routes - Guards only
router.post('/geofence-event', authorize('GUARD'), trackingController.recordGeofenceEvent);
router.get('/geofence-events/:guardId', authorize('ADMIN', 'CLIENT'), trackingController.getGeofenceEvents);
router.post('/check-geofences/:guardId', authorize('GUARD'), trackingController.checkLocationInGeofences);

// Real-time and analytics routes - Admin and Client only
router.get('/real-time-data', authorize('ADMIN', 'CLIENT'), trackingController.getRealTimeLocationData);
router.get('/analytics', authorize('ADMIN'), trackingController.getLocationAnalytics);

export default router;
