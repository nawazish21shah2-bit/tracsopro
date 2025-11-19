import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import adminShiftController from '../controllers/adminShiftController.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.post('/', adminShiftController.createShift);

export default router;
