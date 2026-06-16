import express from 'express';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { getSubscriptionOverview } from '../controllers/subscriptionController.js';

const router = express.Router();

router.get(
  '/overview',
  authenticateToken,
  authorize('ADMIN', 'CLIENT'),
  getSubscriptionOverview
);

export default router;
