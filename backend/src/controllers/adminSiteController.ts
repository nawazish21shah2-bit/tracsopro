import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import adminSiteService from '../services/adminSiteService.js';
import { resolveSecurityCompanyId } from '../utils/companyAuth.js';

export class AdminSiteController {
  async getSites(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const clientId = req.query.clientId as string | undefined;
      const search = req.query.search as string | undefined;
      const isActiveParam = req.query.isActive as string | undefined;

      const isActive =
        typeof isActiveParam === 'string'
          ? isActiveParam.toLowerCase() === 'true'
          : undefined;

      const result = await adminSiteService.getSites({
        page,
        limit,
        clientId,
        isActive,
        search,
      }, companyResult.securityCompanyId);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createSite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyResult = resolveSecurityCompanyId(
        req,
        req.body.securityCompanyId,
        'Security company ID is required in request body for SUPER_ADMIN.'
      );
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }

      const site = await adminSiteService.createSite(req.body, companyResult.securityCompanyId as string);
      res.status(201).json({ success: true, data: site });
    } catch (error) {
      next(error);
    }
  }

  async updateSite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }

      const site = await adminSiteService.updateSite(id, req.body, companyResult.securityCompanyId);
      res.json({ success: true, data: site });
    } catch (error) {
      next(error);
    }
  }

  async deleteSite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }

      const result = await adminSiteService.deleteSite(id, companyResult.securityCompanyId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminSiteController();
