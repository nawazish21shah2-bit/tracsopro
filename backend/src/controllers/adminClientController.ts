import { Request, Response, NextFunction } from 'express';
import adminClientService from '../services/adminClientService.js';

export class AdminClientController {
  async getClients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string | undefined;

      const result = await adminClientService.getClients({ page, limit, search });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminClientController();
