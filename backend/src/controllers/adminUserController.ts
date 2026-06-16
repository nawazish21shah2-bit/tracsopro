import { Request, Response, NextFunction } from 'express';
import adminUserService from '../services/adminUserService.js';
import { AuthRequest } from '../middleware/auth.js';
import { resolveSecurityCompanyId } from '../utils/companyAuth.js';

export class AdminUserController {
  async getUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }

      const result = await adminUserService.getUsers({
        page,
        limit,
        role,
        search,
        isActive,
        securityCompanyId: companyResult.securityCompanyId, // Multi-tenant filter
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive } = req.body as { isActive: boolean };

      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }

      const user = await adminUserService.updateUserStatus(
        id,
        Boolean(isActive),
        companyResult.securityCompanyId,
      );
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, role } = req.body;

      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }

      const user = await adminUserService.updateUser(
        id,
        {
          firstName,
          lastName,
          email,
          role,
        },
        companyResult.securityCompanyId,
      );

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

      const result = await adminUserService.deleteUser(
        id,
        companyResult.securityCompanyId,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, firstName, lastName, role, phone, department } = req.body;

      if (!email || !password || !firstName || !role) {
        res.status(400).json({
          success: false,
          message: 'Email, password, first name, and role are required',
        });
        return;
      }

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

      const user = await adminUserService.createUser({
        email,
        password,
        firstName,
        lastName: lastName?.trim() ?? '',
        role,
        phone,
        securityCompanyId: companyResult.securityCompanyId,
        department,
      });

      res.status(201).json({ success: true, data: user });
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        res.status(409).json({ success: false, message: error.message });
      } else {
        next(error);
      }
    }
  }
}

export default new AdminUserController();
