import { Request, Response, NextFunction } from 'express';
import adminClientService from '../services/adminClientService.js';
import { AuthRequest } from '../middleware/auth.js';
import { resolveSecurityCompanyId } from '../utils/companyAuth.js';

export class AdminClientController {
  async getClients(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string | undefined;

      const result = await adminClientService.getClients({ 
        page, 
        limit, 
        search,
        securityCompanyId: companyResult.securityCompanyId, // undefined for SUPER_ADMIN = all clients
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminClientController();
