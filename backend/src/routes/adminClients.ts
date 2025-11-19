import { Router } from 'express';
import adminClientController from '../controllers/adminClientController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', adminClientController.getClients.bind(adminClientController));

export default router;
