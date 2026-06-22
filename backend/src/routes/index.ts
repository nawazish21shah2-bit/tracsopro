import { Router } from 'express';
import authRoutes from './auth.js';
import guardRoutes from './guards.js';
import clientRoutes from './clients.js';
import trackingRoutes from './tracking.js';
import incidentRoutes from './incidents.js';
import incidentReportRoutes from './incidentReports.js';
import shiftRoutes from './shifts.js';
import shiftReportRoutes from './shiftReports.js';
import settingsRoutes from './settingsRoutes.js';
import siteRoutes from './sites.js';
import emergencyRoutes from './emergency.js';
import paymentRoutes from './payments.js';
import chatRoutes from './chat.js';
import superAdminRoutes from './superAdmin';
import adminUserRoutes from './adminUsers.js';
import adminSiteRoutes from './adminSites.js';
import adminClientRoutes from './adminClients.js';
import adminShiftRoutes from './adminShifts.js';
import adminRoutes from './admin.js';
import operationsRoutes from './operations.js';
import invitationRoutes from './invitations.js';
import notificationRoutes from './notifications.js';
import userRoutes from './users.js';
import subscriptionRoutes from './subscription.js';
import supportRoutes from './supportRoutes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  const payload: Record<string, string> = {
    status: 'ok',
    time: new Date().toISOString(),
  };
  if (process.env.NODE_ENV !== 'production') {
    payload.environment = process.env.NODE_ENV || 'development';
  }
  res.json({ success: true, data: payload });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/guards', guardRoutes);
router.use('/clients', clientRoutes);
router.use('/tracking', trackingRoutes);
router.use('/incidents', incidentRoutes);
router.use('/incident-reports', incidentReportRoutes);
router.use('/shifts', shiftRoutes);
router.use('/shift-reports', shiftReportRoutes);
router.use('/settings', settingsRoutes);
router.use('/sites', siteRoutes);
router.use('/emergency', emergencyRoutes);
router.use('/payments', paymentRoutes);
router.use('/chat', chatRoutes);
// Register specific admin routes BEFORE the generic /admin route
// This ensures Express matches specific paths first
router.use('/admin/users', adminUserRoutes);
router.use('/admin/sites', adminSiteRoutes);
router.use('/admin/clients', adminClientRoutes);
router.use('/admin/shifts', adminShiftRoutes);
router.use('/admin/operations', operationsRoutes);
router.use('/admin/invitations', invitationRoutes);
// Register generic /admin route LAST to avoid catching specific routes
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/support', supportRoutes);
router.use('/super-admin', superAdminRoutes);

export default router;
