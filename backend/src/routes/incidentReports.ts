// Incident Reports Routes
import { Router } from 'express';
import incidentReportController from '../controllers/incidentReportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Guard routes (authenticated users)
router.post('/', authenticate, incidentReportController.createIncidentReport);
router.get('/', authenticate, incidentReportController.getIncidentReports);
router.get('/:id', authenticate, incidentReportController.getIncidentReportById);
router.put('/:id', authenticate, incidentReportController.updateIncidentReport);
router.delete('/:id', authenticate, incidentReportController.deleteIncidentReport);

// Respond to report (Client/Admin)
router.put('/:id/respond', authenticate, incidentReportController.respondToReport);

// Admin routes
router.get('/admin/all', authenticate, authorize('ADMIN'), incidentReportController.getAllIncidentReports);
router.get('/admin/stats', authenticate, authorize('ADMIN'), incidentReportController.getIncidentReportStats);

export default router;
