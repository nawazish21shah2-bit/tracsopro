import { Router } from 'express';
import clientController from '../controllers/clientController.js';
import { authenticate, authorize, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Client routes
router.get('/', authorize('ADMIN'), clientController.getAllClients);
router.get('/my-profile', clientController.getMyProfile); // Client can view their own profile
router.put('/profile', clientController.updateClientProfile); // Client can update their own profile
router.get('/stats', authorize('ADMIN'), clientController.getClientStats);

// Client dashboard routes
router.get('/dashboard/stats', authorize('CLIENT'), clientController.getDashboardStats);
router.get('/my-guards', authorize('CLIENT'), clientController.getMyGuards);
router.get('/guards/:guardId', authorize('CLIENT'), clientController.getGuardProfile);
router.get('/my-reports', authorize('CLIENT'), clientController.getMyReports);
router.get('/my-sites', authorize('CLIENT'), clientController.getMySites);
router.get('/my-shifts', authorize('CLIENT'), clientController.getMyShifts);
router.get('/my-notifications', authorize('CLIENT'), clientController.getMyNotifications);
router.put('/reports/:reportId/respond', authorize('CLIENT'), clientController.respondToReport);

// Client shift creation (Option B - Direct Assignment)
router.post('/shifts', authorize('CLIENT'), clientController.createShift);
router.post('/shifts/bulk', authorize('CLIENT'), clientController.createBulkShifts);
router.put('/shifts/:shiftId', authorize('CLIENT'), clientController.updateShift);
router.delete('/shifts/:shiftId', authorize('CLIENT'), clientController.deleteShift);

// Admin routes
router.get('/:id', requireAdmin, clientController.getClientById);
router.put('/:id', requireAdmin, clientController.updateClient);
router.delete('/:id', requireAdmin, clientController.deleteClient);

export default router;
