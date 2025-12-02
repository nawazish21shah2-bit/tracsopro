import { Router } from 'express';
import clientController from '../controllers/clientController.js';
import { authenticate, authorize } from '../middleware/auth.js';

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
router.get('/my-reports', authorize('CLIENT'), clientController.getMyReports);
router.get('/my-sites', authorize('CLIENT'), clientController.getMySites);
router.get('/my-notifications', authorize('CLIENT'), clientController.getMyNotifications);
router.put('/reports/:reportId/respond', authorize('CLIENT'), clientController.respondToReport);

// Admin routes
router.get('/:id', authorize('ADMIN'), clientController.getClientById);
router.put('/:id', authorize('ADMIN'), clientController.updateClient);
router.delete('/:id', authorize('ADMIN'), clientController.deleteClient);

export default router;
