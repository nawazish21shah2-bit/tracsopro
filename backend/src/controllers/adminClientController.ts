import { Request, Response, NextFunction } from 'express';
import adminClientService from '../services/adminClientService.js';
import { AuthRequest } from '../middleware/auth.js';

export class AdminClientController {
  async getClients(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // SUPER_ADMIN can access all clients (no company filter)
      // Regular ADMIN must have securityCompanyId
      if (req.user?.role !== 'SUPER_ADMIN' && !req.securityCompanyId) {
        return res.status(403).json({
          success: false,
          error: 'Security company ID not found. Admin must be linked to a company.',
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string | undefined;

      const result = await adminClientService.getClients({ 
        page, 
        limit, 
        search,
        securityCompanyId: req.securityCompanyId, // undefined for SUPER_ADMIN = all clients
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminClientController();
