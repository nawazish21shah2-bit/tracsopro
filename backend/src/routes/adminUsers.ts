import { Router } from 'express';
import adminUserController from '../controllers/adminUserController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All admin user routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Create user (admin-created, bypasses invitation codes)
router.post('/', adminUserController.createUser.bind(adminUserController));

// List users with optional filters
router.get('/', adminUserController.getUsers.bind(adminUserController));

// Update user basic data
router.put('/:id', adminUserController.updateUser.bind(adminUserController));

// Update user active status (suspend/activate)
router.patch('/:id/status', adminUserController.updateUserStatus.bind(adminUserController));

// Delete user
router.delete('/:id', adminUserController.deleteUser.bind(adminUserController));

export default router;
