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

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      time: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// API routes
router.use('/auth', authRoutes);
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
router.use('/admin/users', adminUserRoutes);
router.use('/admin/sites', adminSiteRoutes);
router.use('/admin/clients', adminClientRoutes);
router.use('/admin/shifts', adminShiftRoutes);
// Test route for Super Admin
router.get('/super-admin-test', (req, res) => {
  res.json({ success: true, message: 'Super Admin routes are working!' });
});

// Super Admin routes with simple test
router.get('/super-admin/test', (req, res) => {
  res.json({ success: true, message: 'Super Admin endpoint working!' });
});

router.use('/super-admin', superAdminRoutes);

// Legacy routes for backward compatibility with in-memory server
router.get('/locations', (req, res) => {
  res.json({ success: true, data: [] });
});

router.get('/messages', (req, res) => {
  res.json({ success: true, data: [] });
});

router.post('/messages', (req, res) => {
  res.json({ success: true, data: { id: 'msg-1', ...req.body } });
});

router.get('/notifications', (req, res) => {
  res.json({ success: true, data: [] });
});

router.put('/notifications/:id/read', (req, res) => {
  res.json({ success: true, data: null });
});

export default router;
