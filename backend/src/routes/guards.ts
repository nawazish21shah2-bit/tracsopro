import { Router } from 'express';
import guardController from '../controllers/guardController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Guard routes
router.get('/', guardController.getAllGuards);
router.get('/:id', guardController.getGuardById);
router.put('/profile', guardController.updateGuardProfile); // Guard can update their own profile
router.put('/:id', authorize('ADMIN'), guardController.updateGuard);
router.delete('/:id', authorize('ADMIN'), guardController.deleteGuard);

// Emergency contacts
router.post('/:id/emergency-contacts', guardController.addEmergencyContact);

// Qualifications
router.post('/:id/qualifications', guardController.addQualification);

// Performance
router.get('/:id/performance', guardController.getGuardPerformance);

export default router;
