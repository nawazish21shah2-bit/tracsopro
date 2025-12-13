import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import adminShiftController from '../controllers/adminShiftController.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/schedule/30-days', adminShiftController.get30DaySchedule);
router.get('/', adminShiftController.getShifts);
router.post('/', adminShiftController.createShift);

export default router;
