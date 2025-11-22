import express from 'express';
import SuperAdminService from '../services/superAdminService';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import prisma from '../config/database';

const router = express.Router();

// Apply authentication and super admin check to all routes
router.use(authenticateToken);
router.use(requireSuperAdmin);

/**
 * GET /api/super-admin/overview
 * Get platform overview statistics
 */
router.get('/overview', async (req, res) => {
  try {
    const overview = await SuperAdminService.getPlatformOverview();
    res.json(overview);
  } catch (error) {
    console.error('Error getting platform overview:', error);
    res.status(500).json({ error: 'Failed to get platform overview' });
  }
});

/**
 * GET /api/super-admin/companies
 * Get all security companies with pagination and filters
 */
router.get('/companies', async (req, res) => {
  try {
    const { page, limit, search, status, plan } = req.query;
    
    const result = await SuperAdminService.getSecurityCompanies({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      status: status as string,
      plan: plan as string
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error getting security companies:', error);
    res.status(500).json({ error: 'Failed to get security companies' });
  }
});

/**
 * GET /api/super-admin/companies/:id
 * Get a single security company by ID
 */
router.get('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const company = await prisma.securityCompany.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            guards: true,
            clients: true,
            sites: true
          }
        }
      }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(company);
  } catch (error) {
    console.error('Error getting security company:', error);
    res.status(500).json({ error: 'Failed to get security company' });
  }
});

/**
 * POST /api/super-admin/companies
 * Create a new security company
 */
router.post('/companies', async (req, res) => {
  try {
    const company = await SuperAdminService.createSecurityCompany(req.body);
    
    // Log the action
    await SuperAdminService.logAction({
      userId: req.userId,
      action: 'CREATE_COMPANY',
      resource: 'SecurityCompany',
      resourceId: company.id,
      newValues: company,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    
    res.status(201).json(company);
  } catch (error) {
    console.error('Error creating security company:', error);
    res.status(500).json({ error: 'Failed to create security company' });
  }
});

/**
 * PUT /api/super-admin/companies/:id
 * Update security company
 */
router.put('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get old company data for logging
    const oldCompany = await prisma.securityCompany.findUnique({
      where: { id }
    });
    
    const company = await SuperAdminService.updateSecurityCompany(id, req.body);
    
    // Log the action
    await SuperAdminService.logAction({
      userId: req.userId,
      action: 'UPDATE_COMPANY',
      resource: 'SecurityCompany',
      resourceId: id,
      oldValues: oldCompany,
      newValues: company,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    
    res.json(company);
  } catch (error) {
    console.error('Error updating security company:', error);
    res.status(500).json({ error: 'Failed to update security company' });
  }
});

/**
 * GET /api/super-admin/companies/:id
 * Get a single security company by ID
 */
router.get('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const company = await SuperAdminService.getSecurityCompany(id);
    res.json(company);
  } catch (error) {
    console.error('Error getting security company:', error);
    res.status(500).json({ error: 'Failed to get security company' });
  }
});

/**
 * DELETE /api/super-admin/companies/:id
 * Delete a security company by ID
 */
router.delete('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await SuperAdminService.deleteSecurityCompany(id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting security company:', error);
    res.status(500).json({ error: 'Failed to delete security company' });
  }
});

/**
 * PATCH /api/super-admin/companies/:id/status
 * Toggle security company status (activate/suspend)
 */
router.patch('/companies/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const company = await SuperAdminService.toggleCompanyStatus(id, isActive);
    
    // Log the action
    await SuperAdminService.logAction({
      userId: req.userId,
      action: isActive ? 'ACTIVATE_COMPANY' : 'SUSPEND_COMPANY',
      resource: 'SecurityCompany',
      resourceId: id,
      newValues: { isActive, subscriptionStatus: company.subscriptionStatus },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    
    res.json(company);
  } catch (error) {
    console.error('Error toggling company status:', error);
    res.status(500).json({ error: 'Failed to toggle company status' });
  }
});

/**
 * GET /api/super-admin/analytics
 * Get platform analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate, metricType } = req.query;
    
    const analytics = await SuperAdminService.getPlatformAnalytics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      metricType: metricType as string
    });
    
    res.json(analytics);
  } catch (error) {
    console.error('Error getting platform analytics:', error);
    res.status(500).json({ error: 'Failed to get platform analytics' });
  }
});

/**
 * GET /api/super-admin/billing
 * Get billing overview
 */
router.get('/billing', async (req, res) => {
  try {
    const billing = await SuperAdminService.getBillingOverview();
    res.json(billing);
  } catch (error) {
    console.error('Error getting billing overview:', error);
    res.status(500).json({ error: 'Failed to get billing overview' });
  }
});

/**
 * GET /api/super-admin/audit-logs
 * Get system audit logs
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const { page, limit, action, resource, userId, companyId } = req.query;
    
    const logs = await SuperAdminService.getAuditLogs({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      action: action as string,
      resource: resource as string,
      userId: userId as string,
      companyId: companyId as string
    });
    
    res.json(logs);
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

/**
 * GET /api/super-admin/settings
 * Get platform settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await SuperAdminService.getPlatformSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error getting platform settings:', error);
    res.status(500).json({ error: 'Failed to get platform settings' });
  }
});

/**
 * PUT /api/super-admin/settings
 * Update platform settings
 */
router.put('/settings', async (req, res) => {
  try {
    const result = await SuperAdminService.updatePlatformSettings(req.body);
    
    // Log the action
    await SuperAdminService.logAction({
      userId: req.userId,
      action: 'UPDATE_PLATFORM_SETTINGS',
      resource: 'PlatformSettings',
      newValues: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error updating platform settings:', error);
    res.status(500).json({ error: 'Failed to update platform settings' });
  }
});

/**
 * POST /api/super-admin/impersonate
 * Impersonate a user and get access tokens
 */
router.post('/impersonate', async (req: any, res) => {
  try {
    const { targetUserId } = req.body || {};
    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    const actingUserId = req.userId as string;
    const result = await SuperAdminService.impersonateUser({ targetUserId, actingUserId });
    res.json(result);
  } catch (error) {
    console.error('Error impersonating user:', error);
    res.status(500).json({ error: 'Failed to impersonate user' });
  }
});

/**
 * GET /api/super-admin/payments
 * Get payment records with filters and pagination
 */
router.get('/payments', async (req, res) => {
  try {
    const { 
      page, 
      limit, 
      status, 
      companyId, 
      type, 
      startDate, 
      endDate,
      search 
    } = req.query;
    
    const result = await SuperAdminService.getPaymentRecords({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
      companyId: companyId as string,
      type: type as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error getting payment records:', error);
    res.status(500).json({ error: 'Failed to get payment records' });
  }
});

/**
 * GET /api/super-admin/payments/:id
 * Get payment record by ID
 */
router.get('/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await SuperAdminService.getPaymentRecordById(id);
    res.json(record);
  } catch (error: any) {
    console.error('Error getting payment record:', error);
    if (error.message === 'Payment record not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get payment record' });
    }
  }
});

/**
 * PATCH /api/super-admin/payments/:id/status
 * Update payment record status
 */
router.patch('/payments/:id/status', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status, paidDate, paymentMethod } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const record = await SuperAdminService.updatePaymentStatus(
      id,
      status,
      paidDate ? new Date(paidDate) : undefined,
      paymentMethod
    );

    // Log the action
    await SuperAdminService.logAction({
      userId: req.userId,
      action: 'UPDATE_PAYMENT_STATUS',
      resource: 'BillingRecord',
      resourceId: id,
      newValues: { status, paidDate, paymentMethod },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    
    res.json(record);
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

/**
 * GET /api/super-admin/payments/analytics
 * Get payment analytics
 */
router.get('/payments/analytics', async (req, res) => {
  try {
    const { startDate, endDate, companyId } = req.query;
    
    const analytics = await SuperAdminService.getPaymentAnalytics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      companyId: companyId as string
    });
    
    res.json(analytics);
  } catch (error) {
    console.error('Error getting payment analytics:', error);
    res.status(500).json({ error: 'Failed to get payment analytics' });
  }
});

export default router;
