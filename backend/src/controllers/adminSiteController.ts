import { Request, Response, NextFunction } from 'express';
import adminSiteService from '../services/adminSiteService.js';

export class AdminSiteController {
  async getSites(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // SUPER_ADMIN can access all sites (no company filter)
      // Regular ADMIN must have securityCompanyId
      if (req.user?.role !== 'SUPER_ADMIN' && !req.securityCompanyId) {
        return res.status(403).json({
          success: false,
          error: 'Security company ID not found. Admin must be linked to a company.',
        });
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
      }, req.securityCompanyId);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createSite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // SUPER_ADMIN can create sites for any company (must provide securityCompanyId in body)
      // Regular ADMIN uses their own securityCompanyId
      if (req.user?.role === 'SUPER_ADMIN') {
        const { securityCompanyId } = req.body;
        if (!securityCompanyId) {
          return res.status(400).json({
            success: false,
            error: 'Security company ID is required in request body for SUPER_ADMIN.',
          });
        }
        const site = await adminSiteService.createSite(req.body, securityCompanyId);
        res.status(201).json({ success: true, data: site });
        return;
      }
      
      if (!req.securityCompanyId) {
        return res.status(403).json({
          success: false,
          error: 'Security company ID not found. Admin must be linked to a company.',
        });
      }
      const site = await adminSiteService.createSite(req.body, req.securityCompanyId);
      res.status(201).json({ success: true, data: site });
    } catch (error) {
      next(error);
    }
  }

  async updateSite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const site = await adminSiteService.updateSite(id, req.body);
      res.json({ success: true, data: site });
    } catch (error) {
      next(error);
    }
  }

  async deleteSite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await adminSiteService.deleteSite(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminSiteController();
