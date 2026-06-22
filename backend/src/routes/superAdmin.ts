import express from 'express';
import superAdminController from '../controllers/superAdminController.js';
import SuperAdminService from '../services/superAdminService.js';
import { authenticateToken, requireSuperAdmin, AuthRequest } from '../middleware/auth.js';
import { ok, fail } from '../middleware/validate.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireSuperAdmin);

router.get('/overview', superAdminController.getOverview.bind(superAdminController));
router.get('/companies', superAdminController.getCompanies.bind(superAdminController));
router.get('/companies/:id', superAdminController.getCompany.bind(superAdminController));
router.post('/companies', superAdminController.createCompany.bind(superAdminController));

router.put('/companies/:id', async (req: AuthRequest, res, next) => {
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
    ok(res, company);
  } catch (error) {
    next(error);
  }
});

router.delete('/companies/:id', async (req: AuthRequest, res, next) => {
  try {
    const result = await SuperAdminService.deleteSecurityCompany(req.params.id);
    await SuperAdminService.logAction({
      userId: req.userId,
      action: 'DELETE_COMPANY',
      resource: 'SecurityCompany',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    ok(res, result);
  } catch (error) {
    next(error);
  }
});

router.patch('/companies/:id/status', async (req: AuthRequest, res, next) => {
  try {
    const { isActive } = req.body;
    const company = await SuperAdminService.toggleCompanyStatus(req.params.id, isActive);
    await SuperAdminService.logAction({
      userId: req.userId,
      action: isActive ? 'ACTIVATE_COMPANY' : 'SUSPEND_COMPANY',
      resource: 'SecurityCompany',
      resourceId: req.params.id,
      newValues: { isActive, subscriptionStatus: company.subscriptionStatus },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    ok(res, company);
  } catch (error) {
    next(error);
  }
});

router.get('/companies/:id/subscription', async (req, res, next) => {
  try {
    const info = await SuperAdminService.getCompanySubscriptionInfo(req.params.id);
    ok(res, info);
  } catch (error: any) {
    if (error.message === 'Company not found') {
      return fail(res, error.message, 404);
    }
    next(error);
  }
});

router.post('/companies/:id/subscription/checkout', async (req: AuthRequest, res, next) => {
  try {
    const { priceId, trialDays } = req.body;
    if (!priceId) {
      return fail(res, 'priceId is required', 400);
    }
    const session = await SuperAdminService.createCompanySubscriptionCheckout(req.params.id, {
      priceId,
      trialDays,
    });
    ok(res, session, 201);
  } catch (error: any) {
    if (error.message === 'Company not found') {
      return fail(res, error.message, 404);
    }
    next(error);
  }
});

router.get('/companies/:id/billing-portal', async (req: AuthRequest, res, next) => {
  try {
    const session = await SuperAdminService.getCompanyBillingPortal(req.params.id);
    ok(res, session);
  } catch (error: any) {
    if (error.message === 'Company not found') {
      return fail(res, error.message, 404);
    }
    next(error);
  }
});

router.get('/analytics', superAdminController.getAnalytics.bind(superAdminController));
router.get('/billing', superAdminController.getBilling.bind(superAdminController));
router.get('/audit-logs', superAdminController.getAuditLogs.bind(superAdminController));
router.get('/settings', superAdminController.getSettings.bind(superAdminController));
router.put('/settings', superAdminController.updateSettings.bind(superAdminController));

router.post('/export-data', async (req: AuthRequest, res, next) => {
  try {
    const result = await SuperAdminService.exportPlatformData(req.userId);
    ok(res, result);
  } catch (error) {
    next(error);
  }
});

router.get('/users', superAdminController.searchUsers.bind(superAdminController));
router.post('/impersonate', superAdminController.impersonate.bind(superAdminController));

router.get('/payments', async (req, res, next) => {
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
    ok(res, result);
  } catch (error) {
    next(error);
  }
});

router.get('/payments/analytics', async (req, res, next) => {
  try {
    const { startDate, endDate, companyId } = req.query;
    const analytics = await SuperAdminService.getPaymentAnalytics({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      companyId: companyId as string,
    });
    ok(res, analytics);
  } catch (error) {
    next(error);
  }
});

router.get('/payments/:id', async (req, res, next) => {
  try {
    const record = await SuperAdminService.getPaymentRecordById(req.params.id);
    ok(res, record);
  } catch (error: any) {
    if (error.message === 'Payment record not found') {
      return fail(res, error.message, 404);
    }
    next(error);
  }
});

router.patch('/payments/:id/status', async (req: AuthRequest, res, next) => {
  try {
    const { status, paidDate, paymentMethod } = req.body;
    if (!status) {
      return fail(res, 'Status is required', 400);
    }
    const record = await SuperAdminService.updatePaymentStatus(
      req.params.id,
      status,
      paidDate ? new Date(paidDate) : undefined,
      paymentMethod
    );
    ok(res, record);
  } catch (error) {
    next(error);
  }
});

export default router;
