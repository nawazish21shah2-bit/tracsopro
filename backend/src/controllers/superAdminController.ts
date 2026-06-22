import { Response, NextFunction } from 'express';
import SuperAdminService from '../services/superAdminService.js';
import { AuthRequest } from '../middleware/auth.js';
import { ok, fail } from '../middleware/validate.js';
import { logger } from '../utils/logger.js';

class SuperAdminController {
  async getOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { period } = req.query;
      const overview = await SuperAdminService.getPlatformOverview({
        period: period as string,
      });
      ok(res, overview);
    } catch (error) {
      logger.error('Error getting platform overview', { error });
      next(error);
    }
  }

  async getCompanies(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, status, plan } = req.query;
      const result = await SuperAdminService.getSecurityCompanies({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        status: status as string,
        plan: plan as string,
      });
      ok(res, result);
    } catch (error) {
      logger.error('Error getting security companies', { error });
      next(error);
    }
  }

  async getCompany(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const company = await SuperAdminService.getSecurityCompany(req.params.id);
      ok(res, company);
    } catch (error: any) {
      if (error.message === 'Company not found') {
        return fail(res, error.message, 404);
      }
      next(error);
    }
  }

  async createCompany(req: AuthRequest, res: Response, next: NextFunction) {
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
      ok(res, result, 201);
    } catch (error: any) {
      const message = error?.message || 'Failed to create security company';
      const status = message.includes('already exists') ? 409 : 500;
      fail(res, message, status);
    }
  }

  async impersonate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { targetUserId } = req.body || {};
      if (!targetUserId) {
        return fail(res, 'targetUserId is required', 400);
      }
      const result = await SuperAdminService.impersonateUser({
        targetUserId,
        actingUserId: req.userId as string,
      });
      ok(res, result);
    } catch (error) {
      logger.error('Error impersonating user', { error });
      next(error);
    }
  }

  async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, period } = req.query;
      const analytics = await SuperAdminService.getPlatformAnalytics({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        period: period as string,
      });
      ok(res, analytics);
    } catch (error) {
      next(error);
    }
  }

  async getBilling(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const billing = await SuperAdminService.getBillingOverview();
      ok(res, billing);
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
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
      ok(res, logs);
    } catch (error) {
      next(error);
    }
  }

  async getSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const settings = await SuperAdminService.getPlatformSettings();
      ok(res, settings);
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: AuthRequest, res: Response, next: NextFunction) {
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
      ok(res, result);
    } catch (error) {
      next(error);
    }
  }

  async searchUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, page, limit } = req.query;
      const result = await SuperAdminService.searchUsers({
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      ok(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new SuperAdminController();
