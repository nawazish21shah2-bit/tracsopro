import { Request, Response, NextFunction } from 'express';
import incidentService from '../services/incidentService.js';
import { AuthRequest } from '../middleware/auth.js';

export class IncidentController {
  async getAllIncidents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const filters = {
        status: req.query.status as string,
        severity: req.query.severity as string,
        type: req.query.type as string,
        reportedBy: req.query.reportedBy as string,
      };

      const result = await incidentService.getAllIncidents(page, limit, filters);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getIncidentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incident = await incidentService.getIncidentById(req.params.id);
      res.json({
        success: true,
        data: incident,
      });
    } catch (error) {
      next(error);
    }
  }

  async createIncident(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const incident = await incidentService.createIncident(req.userId!, req.body);
      res.status(201).json({
        success: true,
        data: incident,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incident = await incidentService.updateIncident(req.params.id, req.body);
      res.json({
        success: true,
        data: incident,
      });
    } catch (error) {
      next(error);
    }
  }

  async addEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const evidence = await incidentService.addEvidence(req.params.id, req.body);
      res.status(201).json({
        success: true,
        data: evidence,
      });
    } catch (error) {
      next(error);
    }
  }

  async getIncidentStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await incidentService.getIncidentStats(startDate, endDate);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new IncidentController();
