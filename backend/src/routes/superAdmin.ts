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

export default router;
