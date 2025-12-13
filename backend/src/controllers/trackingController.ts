import { Request, Response, NextFunction } from 'express';
import trackingService from '../services/trackingService.js';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';

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

  async getGuardTrackingHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { guardId } = req.params;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const limit = parseInt(req.query.limit as string) || 100;
      const securityCompanyId = req.securityCompanyId; // Multi-tenant filter

      // Multi-tenant: Validate guard belongs to admin's company (unless SUPER_ADMIN)
      if (req.user?.role !== 'SUPER_ADMIN' && securityCompanyId) {
        const guard = await prisma.guard.findUnique({
          where: { id: guardId },
          include: {
            companyGuards: {
              where: { securityCompanyId, isActive: true },
              take: 1,
            },
          },
        });

        if (!guard || guard.companyGuards.length === 0) {
          return res.status(403).json({
            success: false,
            error: 'Guard not found or does not belong to your company',
          });
        }
      }

      const records = await trackingService.getGuardTrackingHistory(guardId, startDate, endDate, limit, securityCompanyId);

      res.json({
        success: true,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLatestLocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { guardId } = req.params;
      const securityCompanyId = req.securityCompanyId; // Multi-tenant filter

      // Multi-tenant: Validate guard belongs to admin's company (unless SUPER_ADMIN)
      if (req.user?.role !== 'SUPER_ADMIN' && securityCompanyId) {
        const guard = await prisma.guard.findUnique({
          where: { id: guardId },
          include: {
            companyGuards: {
              where: { securityCompanyId, isActive: true },
              take: 1,
            },
          },
        });

        if (!guard || guard.companyGuards.length === 0) {
          return res.status(403).json({
            success: false,
            error: 'Guard not found or does not belong to your company',
          });
        }
      }

      const location = await trackingService.getLatestLocation(guardId);

      res.json({
        success: true,
        data: location,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveGuardsLocations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const securityCompanyId = req.securityCompanyId; // Multi-tenant filter
      const locations = await trackingService.getActiveGuardsLocations(securityCompanyId);

      res.json({
        success: true,
        data: locations,
      });
    } catch (error) {
      next(error);
    }
  }

  async recordGeofenceEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { guardId, geofenceId, eventType, location, timestamp } = req.body;
      
      const event = await trackingService.recordGeofenceEvent({
        guardId,
        geofenceId,
        eventType,
        location,
        timestamp,
      });

      res.status(201).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  async getGeofenceEvents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { guardId } = req.params;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const securityCompanyId = req.securityCompanyId; // Multi-tenant filter

      // Multi-tenant: Validate guard belongs to admin's company (unless SUPER_ADMIN)
      if (req.user?.role !== 'SUPER_ADMIN' && securityCompanyId) {
        const guard = await prisma.guard.findUnique({
          where: { id: guardId },
          include: {
            companyGuards: {
              where: { securityCompanyId, isActive: true },
              take: 1,
            },
          },
        });

        if (!guard || guard.companyGuards.length === 0) {
          return res.status(403).json({
            success: false,
            error: 'Guard not found or does not belong to your company',
          });
        }
      }

      const events = await trackingService.getGeofenceEvents(guardId, startDate, endDate);

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRealTimeLocationData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const locationData = await trackingService.getRealTimeLocationData();

      res.json({
        success: true,
        data: locationData,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkLocationInGeofences(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { guardId } = req.params;
      const { latitude, longitude } = req.body;

      const geofenceChecks = await trackingService.checkLocationInGeofences(guardId, latitude, longitude);

      res.json({
        success: true,
        data: geofenceChecks,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLocationAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const analytics = await trackingService.getLocationAnalytics(startDate, endDate);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TrackingController();
