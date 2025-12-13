import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import invitationController from '../controllers/invitationController.js';

const router = Router();

// All invitation routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Create new invitation
router.post('/', invitationController.createInvitation);

// Get all invitations for company
router.get('/', invitationController.getInvitations);

// Get invitation by ID
router.get('/:id', invitationController.getInvitationById);

// Revoke invitation (deactivate)
router.put('/:id/revoke', invitationController.revokeInvitation);

// Delete invitation
router.delete('/:id', invitationController.deleteInvitation);

export default router;

