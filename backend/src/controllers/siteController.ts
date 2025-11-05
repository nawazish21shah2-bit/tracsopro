import { Request, Response, NextFunction } from 'express';
import siteService from '../services/siteService.js';
import { AuthRequest } from '../middleware/auth.js';

export class SiteController {
  // Create a new site
  async createSite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = req.clientId;
      if (!clientId) {
        res.status(400).json({
          success: false,
          message: 'Client ID not found. User must be a client.'
        });
        return;
      }
      const site = await siteService.createSite(clientId, req.body);
      
      res.status(201).json({
        success: true,
        data: site,
        message: 'Site created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all sites for a client
  async getClientSites(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = req.clientId;
      if (!clientId) {
        res.status(400).json({
          success: false,
          message: 'Client ID not found. User must be a client.'
        });
        return;
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await siteService.getClientSites(clientId, page, limit);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all active sites (for guards)
  async getActiveSites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const result = await siteService.getAllActiveSites(page, limit, search);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get site by ID
  async getSiteById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const site = await siteService.getSiteById(id, req.userId!, req.user?.role!);
      
      res.json({
        success: true,
        data: site
      });
    } catch (error) {
      next(error);
    }
  }

  // Update site
  async updateSite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const clientId = req.clientId!;
      
      const site = await siteService.updateSite(id, clientId, req.body);
      
      res.json({
        success: true,
        data: site,
        message: 'Site updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete site
  async deleteSite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const clientId = req.clientId!;
      
      const result = await siteService.deleteSite(id, clientId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SiteController();
