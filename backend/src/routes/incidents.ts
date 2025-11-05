import { Router } from 'express';
import incidentController from '../controllers/incidentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Incident routes
router.get('/', incidentController.getAllIncidents);
router.get('/stats', incidentController.getIncidentStats);
router.get('/:id', incidentController.getIncidentById);
router.post('/', incidentController.createIncident);
router.put('/:id', authorize('ADMIN'), incidentController.updateIncident);

// Evidence
router.post('/:id/evidence', incidentController.addEvidence);

export default router;
