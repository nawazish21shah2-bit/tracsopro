import { Router } from 'express';
import incidentController from '../controllers/incidentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), incidentController.getAllIncidents);
router.get('/stats', authorize('ADMIN', 'SUPER_ADMIN'), incidentController.getIncidentStats);
router.get('/:id', incidentController.getIncidentById);
router.post('/', incidentController.createIncident);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), incidentController.updateIncident);
router.post('/:id/evidence', incidentController.addEvidence);

export default router;
