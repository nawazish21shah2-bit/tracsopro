import { Request, Response, NextFunction } from 'express';
import adminSiteService from '../services/adminSiteService.js';

export class AdminSiteController {
  async getSites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createSite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const site = await adminSiteService.createSite(req.body);
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
