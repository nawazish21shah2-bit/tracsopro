import { Request, Response, NextFunction } from 'express';
import adminUserService from '../services/adminUserService.js';

export class AdminUserController {
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const role = req.query.role as 'GUARD' | 'ADMIN' | 'CLIENT' | 'SUPER_ADMIN' | undefined;
      const search = req.query.search as string | undefined;
      const isActiveParam = req.query.isActive as string | undefined;

      const isActive =
        typeof isActiveParam === 'string'
          ? isActiveParam.toLowerCase() === 'true'
          : undefined;

      const result = await adminUserService.getUsers({
        page,
        limit,
        role,
        search,
        isActive,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body as { isActive: boolean };

      const user = await adminUserService.updateUserStatus(id, Boolean(isActive));
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, role } = req.body;

      const user = await adminUserService.updateUser(id, {
        firstName,
        lastName,
        email,
        role,
      });

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await adminUserService.deleteUser(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminUserController();
