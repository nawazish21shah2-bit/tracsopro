import express from 'express';
import SuperAdminService from '../services/superAdminService';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';

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
 * POST /api/super-admin/companies
 * Create a new security company
 */
router.post('/companies', async (req, res) => {
  try {
    const company = await SuperAdminService.createSecurityCompany(req.body);
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
    const company = await SuperAdminService.updateSecurityCompany(id, req.body);
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

export default router;
