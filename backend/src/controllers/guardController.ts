import { Request, Response, NextFunction } from 'express';
import guardService from '../services/guardService.js';
import { AuthRequest } from '../middleware/auth.js';

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

  async getGuardById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const guard = await guardService.getGuardById(req.params.id);
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

  async updateGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const guard = await guardService.updateGuard(req.params.id, req.body);
      res.json({
        success: true,
        data: guard,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await guardService.deleteGuard(req.params.id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async addEmergencyContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contact = await guardService.addEmergencyContact(req.params.id, req.body);
      res.status(201).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }

  async addQualification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qualification = await guardService.addQualification(req.params.id, req.body);
      res.status(201).json({
        success: true,
        data: qualification,
      });
    } catch (error) {
      next(error);
    }
  }

  async getGuardPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const metrics = await guardService.getGuardPerformance(req.params.id, months);
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
