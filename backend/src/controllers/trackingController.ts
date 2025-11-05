import { Request, Response, NextFunction } from 'express';
import trackingService from '../services/trackingService.js';
import { AuthRequest } from '../middleware/auth.js';

export class TrackingController {
  async recordLocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { guardId, latitude, longitude, accuracy, batteryLevel, timestamp } = req.body;
      
      const record = await trackingService.recordLocation(guardId, {
        latitude,
        longitude,
        accuracy,
        batteryLevel,
        timestamp,
      });

      res.status(201).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async getGuardTrackingHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { guardId } = req.params;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const limit = parseInt(req.query.limit as string) || 100;

      const records = await trackingService.getGuardTrackingHistory(guardId, startDate, endDate, limit);

      res.json({
        success: true,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLatestLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { guardId } = req.params;
      const location = await trackingService.getLatestLocation(guardId);

      res.json({
        success: true,
        data: location,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveGuardsLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const locations = await trackingService.getActiveGuardsLocations();

      res.json({
        success: true,
        data: locations,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TrackingController();
