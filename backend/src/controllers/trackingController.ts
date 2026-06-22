import { Request, Response, NextFunction } from 'express';
import trackingService from '../services/trackingService.js';
import { AuthRequest } from '../middleware/auth.js';
import { resolveSecurityCompanyId } from '../utils/companyAuth.js';
import prisma from '../config/database.js';

export class TrackingController {
  async recordLocation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { latitude, longitude, accuracy, batteryLevel, timestamp } = req.body;
      const guardId = req.body.guardId || req.guardId;
      
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
      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }
      const securityCompanyId = companyResult.securityCompanyId;

      // Multi-tenant: Validate guard belongs to admin's company (unless SUPER_ADMIN)
      if (req.user?.role !== 'SUPER_ADMIN') {
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
      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }
      const securityCompanyId = companyResult.securityCompanyId;

      // Multi-tenant: Validate guard belongs to admin's company (unless SUPER_ADMIN)
      if (req.user?.role !== 'SUPER_ADMIN') {
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
      const clientId = req.user?.role === 'CLIENT' ? req.clientId : undefined;
      const locations = await trackingService.getActiveGuardsLocations(securityCompanyId, clientId);

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
      const { geofenceId, eventType, location, timestamp } = req.body;
      const guardId = req.body.guardId || req.guardId;
      
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
      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }
      const securityCompanyId = companyResult.securityCompanyId;

      // Multi-tenant: Validate guard belongs to admin's company (unless SUPER_ADMIN)
      if (req.user?.role !== 'SUPER_ADMIN') {
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

  async getRealTimeLocationData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }

      const clientId = req.user?.role === 'CLIENT' ? req.clientId : undefined;
      const locationData = await trackingService.getRealTimeLocationData(
        companyResult.securityCompanyId,
        clientId
      );

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

  async getLocationAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }

      const analytics = await trackingService.getLocationAnalytics(startDate, endDate, companyResult.securityCompanyId);

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
