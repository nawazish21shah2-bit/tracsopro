import { Response, NextFunction } from 'express';
import guardService from '../services/guardService.js';
import { AuthRequest } from '../middleware/auth.js';
import { resolveSecurityCompanyId } from '../utils/companyAuth.js';

export class GuardController {
  async getAllGuards(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;

      const result = await guardService.getAllGuards(page, limit, status, req.securityCompanyId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getGuardById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const guard = await guardService.getGuardById(req.params.id, req.securityCompanyId);
      res.json({
        success: true,
        data: guard,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateGuardProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { experience, profilePictureUrl, idCardFrontUrl, idCardBackUrl, certificationUrls } = req.body;
      
      const updatedGuard = await guardService.updateGuardProfile(req.userId!, {
        experience,
        profilePictureUrl,
        idCardFrontUrl,
        idCardBackUrl,
        certificationUrls,
      });

      res.json({
        success: true,
        data: updatedGuard,
        message: 'Guard profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateGuard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          message: companyResult.error,
        });
        return;
      }

      const guard = await guardService.updateGuard(req.params.id, req.body, companyResult.securityCompanyId);
      res.json({
        success: true,
        data: guard,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteGuard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          message: companyResult.error,
        });
        return;
      }

      const result = await guardService.deleteGuard(req.params.id, companyResult.securityCompanyId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async addEmergencyContact(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const guardId = req.params.id;

      if (req.user?.role === 'GUARD' && req.user.guardId !== guardId) {
        return res.status(403).json({
          success: false,
          message: 'Guards can only add emergency contacts for their own profile.',
        });
      }

      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          message: companyResult.error,
        });
        return;
      }

      const contact = await guardService.addEmergencyContact(guardId, req.body, companyResult.securityCompanyId);
      res.status(201).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }

  async addQualification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const guardId = req.params.id;

      if (req.user?.role === 'GUARD' && req.user.guardId !== guardId) {
        return res.status(403).json({
          success: false,
          message: 'Guards can only add qualifications for their own profile.',
        });
      }

      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          message: companyResult.error,
        });
        return;
      }

      const qualification = await guardService.addQualification(guardId, req.body, companyResult.securityCompanyId);
      res.status(201).json({
        success: true,
        data: qualification,
      });
    } catch (error) {
      next(error);
    }
  }

  async getGuardPerformance(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const guardId = req.params.id;
      const months = parseInt(req.query.months as string) || 6;

      if (req.user?.role === 'GUARD' && req.user.guardId !== guardId) {
        return res.status(403).json({
          success: false,
          message: 'Guards can only view their own performance metrics.',
        });
      }

      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          message: companyResult.error,
        });
        return;
      }

      const metrics = await guardService.getGuardPerformance(guardId, months, companyResult.securityCompanyId);
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new GuardController();
