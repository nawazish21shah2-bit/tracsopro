// Incident Report Controller
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import incidentReportService from '../services/incidentReportService.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

class IncidentReportController {
  async createIncidentReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportType, description, location, mediaFiles } = req.body;
      const guardId = req.userId!;

      if (!reportType || !description) {
        throw new BadRequestError('Report type and description are required');
      }

      const report = await incidentReportService.createIncidentReport({
        guardId,
        reportType,
        description,
        location,
        mediaFiles: mediaFiles || [],
      });

      res.status(201).json({
        success: true,
        data: report,
        message: 'Incident report created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getIncidentReports(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const guardId = req.userId!;
      const { page = 1, limit = 10, reportType, startDate, endDate } = req.query;

      const filters = {
        guardId,
        reportType: reportType as string,
        startDate: startDate as string,
        endDate: endDate as string,
      };

      const reports = await incidentReportService.getIncidentReports(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: reports,
      });
    } catch (error) {
      next(error);
    }
  }

  async getIncidentReportById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const guardId = req.userId!;

      const report = await incidentReportService.getIncidentReportById(id, guardId);

      if (!report) {
        throw new NotFoundError('Incident report not found');
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateIncidentReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const guardId = req.userId!;
      const updateData = req.body;

      const report = await incidentReportService.updateIncidentReport(id, guardId, updateData);

      if (!report) {
        throw new NotFoundError('Incident report not found');
      }

      res.json({
        success: true,
        data: report,
        message: 'Incident report updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteIncidentReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const guardId = req.userId!;

      await incidentReportService.deleteIncidentReport(id, guardId);

      res.json({
        success: true,
        data: null,
        message: 'Incident report deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoints
  async getAllIncidentReports(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, guardId, reportType, startDate, endDate } = req.query;

      const filters = {
        guardId: guardId as string,
        reportType: reportType as string,
        startDate: startDate as string,
        endDate: endDate as string,
      };

      const reports = await incidentReportService.getAllIncidentReports(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: reports,
      });
    } catch (error) {
      next(error);
    }
  }

  async getIncidentReportStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, guardId } = req.query;

      const stats = await incidentReportService.getIncidentReportStats({
        startDate: startDate as string,
        endDate: endDate as string,
        guardId: guardId as string,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new IncidentReportController();
