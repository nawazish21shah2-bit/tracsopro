import express from 'express';
import SuperAdminService from '../services/superAdminService';
import { authenticateToken, requireSuperAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);
router.use(requireSuperAdmin);

router.get('/overview', async (req, res) => {
  try {
    const { period } = req.query;
    const overview = await SuperAdminService.getPlatformOverview({
      period: period as string,
    });
    res.json(overview);
  } catch (error) {
    console.error('Error getting platform overview:', error);
    res.status(500).json({ error: 'Failed to get platform overview' });
  }
});

router.get('/companies', async (req, res) => {
  try {
    const { page, limit, search, status, plan } = req.query;
    const result = await SuperAdminService.getSecurityCompanies({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      status: status as string,
      plan: plan as string,
    });
    res.json(result);
  } catch (error) {
    console.error('Error getting security companies:', error);
    res.status(500).json({ error: 'Failed to get security companies' });
  }
});

router.get('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const company = await SuperAdminService.getSecurityCompany(id);
    res.json(company);
  } catch (error: any) {
    console.error('Error getting security company:', error);
    if (error.message === 'Company not found') {
      res.status(404).json({ error: 'Company not found' });
    } else {
      res.status(500).json({ error: 'Failed to get security company' });
    }
  }
});

router.post('/companies', async (req: AuthRequest, res) => {
  try {
    const result = await SuperAdminService.createSecurityCompany(req.body);
    await SuperAdminService.logAction({
      userId: req.userId,
      action: 'CREATE_COMPANY',
      resource: 'SecurityCompany',
      resourceId: result.company.id,
      newValues: result.company,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating security company:', error);
    const message = error?.message || 'Failed to create security company';
    const status = message.includes('already exists') ? 409 : 500;
    res.status(status).json({ error: message });
  }
});

router.put('/companies/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const oldCompany = await SuperAdminService.getSecurityCompany(id);
    const company = await SuperAdminService.updateSecurityCompany(id, req.body);
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

router.delete('/companies/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await SuperAdminService.deleteSecurityCompany(id);
    await SuperAdminService.logAction({
      userId: req.userId,
      action: 'DELETE_COMPANY',
      resource: 'SecurityCompany',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.json(result);
  } catch (error) {
    console.error('Error deleting security company:', error);
    res.status(500).json({ error: 'Failed to delete security company' });
  }
});

router.patch('/companies/:id/status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const company = await SuperAdminService.toggleCompanyStatus(id, isActive);
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

router.get('/companies/:id/subscription', async (req, res) => {
  try {
    const info = await SuperAdminService.getCompanySubscriptionInfo(req.params.id);
    res.json(info);
  } catch (error: any) {
    console.error('Error getting company subscription:', error);
    if (error.message === 'Company not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get company subscription' });
    }
  }
});

router.post('/companies/:id/subscription/checkout', async (req: AuthRequest, res) => {
  try {
    const { priceId, trialDays } = req.body;
    if (!priceId) {
      return res.status(400).json({ error: 'priceId is required' });
    }
    const session = await SuperAdminService.createCompanySubscriptionCheckout(
      req.params.id,
      { priceId, trialDays }
    );
    await SuperAdminService.logAction({
      userId: req.userId,
      action: 'CREATE_SUBSCRIPTION_CHECKOUT',
      resource: 'SecurityCompany',
      resourceId: req.params.id,
      newValues: { priceId, trialDays },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.status(201).json(session);
  } catch (error: any) {
    console.error('Error creating subscription checkout:', error);
    if (error.message === 'Company not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create subscription checkout' });
    }
  }
});

router.get('/companies/:id/billing-portal', async (req: AuthRequest, res) => {
  try {
    const session = await SuperAdminService.getCompanyBillingPortal(req.params.id);
    await SuperAdminService.logAction({
      userId: req.userId,
      action: 'OPEN_BILLING_PORTAL',
      resource: 'SecurityCompany',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.json(session);
  } catch (error: any) {
    console.error('Error opening billing portal:', error);
    if (error.message === 'Company not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to open billing portal' });
    }
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;
    const analytics = await SuperAdminService.getPlatformAnalytics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      period: period as string,
    });
    res.json(analytics);
  } catch (error) {
    console.error('Error getting platform analytics:', error);
    res.status(500).json({ error: 'Failed to get platform analytics' });
  }
});

router.get('/billing', async (req, res) => {
  try {
    const billing = await SuperAdminService.getBillingOverview();
    res.json(billing);
  } catch (error) {
    console.error('Error getting billing overview:', error);
    res.status(500).json({ error: 'Failed to get billing overview' });
  }
});

router.get('/audit-logs', async (req, res) => {
  try {
    const { page, limit, action, resource, userId, companyId, search } = req.query;
    const logs = await SuperAdminService.getAuditLogs({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      action: action as string,
      resource: resource as string,
      userId: userId as string,
      companyId: companyId as string,
      search: search as string,
    });
    res.json(logs);
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const settings = await SuperAdminService.getPlatformSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error getting platform settings:', error);
    res.status(500).json({ error: 'Failed to get platform settings' });
  }
});

router.put('/settings', async (req: AuthRequest, res) => {
  try {
    const result = await SuperAdminService.updatePlatformSettings(req.body);
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

router.post('/export-data', async (req: AuthRequest, res) => {
  try {
    const result = await SuperAdminService.exportPlatformData(req.userId);
    res.json(result);
  } catch (error) {
    console.error('Error exporting platform data:', error);
    res.status(500).json({ error: 'Failed to export platform data' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const result = await SuperAdminService.searchUsers({
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

router.post('/impersonate', async (req: AuthRequest, res) => {
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

router.get('/payments', async (req, res) => {
  try {
    const { page, limit, status, companyId, type, startDate, endDate, search } = req.query;
    const result = await SuperAdminService.getPaymentRecords({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
      companyId: companyId as string,
      type: type as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string,
    });
    res.json(result);
  } catch (error) {
    console.error('Error getting payment records:', error);
    res.status(500).json({ error: 'Failed to get payment records' });
  }
});

router.get('/payments/analytics', async (req, res) => {
  try {
    const { startDate, endDate, companyId } = req.query;
    const analytics = await SuperAdminService.getPaymentAnalytics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      companyId: companyId as string,
    });
    res.json(analytics);
  } catch (error) {
    console.error('Error getting payment analytics:', error);
    res.status(500).json({ error: 'Failed to get payment analytics' });
  }
});

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

router.patch('/payments/:id/status', async (req: AuthRequest, res) => {
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

export default router;
