import { Request, Response, NextFunction } from 'express';
import clientService from '../services/clientService.js';
import { shiftSchedulingService as shiftService } from '../services/shift/index.js';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { resolveSecurityCompanyId } from '../utils/companyAuth.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class ClientController {
  async getAllClients(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 403).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const accountType = req.query.accountType as string;

      const result = await clientService.getAllClients(
        page,
        limit,
        accountType,
        companyResult.securityCompanyId
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getClientById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }

      const client = await clientService.getClientById(
        req.params.id,
        companyResult.securityCompanyId,
      );
      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const client = await clientService.getClientByUserId(req.userId!);
      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateClientProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        companyName, 
        companyRegistrationNumber, 
        taxId, 
        address, 
        city, 
        state, 
        zipCode, 
        country, 
        website 
      } = req.body;
      
      const updatedClient = await clientService.updateClientProfile(req.userId!, {
        companyName,
        companyRegistrationNumber,
        taxId,
        address,
        city,
        state,
        zipCode,
        country,
        website,
      });

      res.json({
        success: true,
        data: updatedClient,
        message: 'Client profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }

      const client = await clientService.updateClient(
        req.params.id,
        req.body,
        companyResult.securityCompanyId,
      );
      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 400).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }

      const result = await clientService.deleteClient(
        req.params.id,
        companyResult.securityCompanyId,
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getClientStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyResult = resolveSecurityCompanyId(req);
      if (companyResult.error) {
        res.status(companyResult.status || 403).json({
          success: false,
          error: companyResult.error,
        });
        return;
      }

      const stats = await clientService.getClientStats(companyResult.securityCompanyId!);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const client = await clientService.getClientByUserId(req.userId!);
      const stats = await clientService.getDashboardStats(client.id);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyGuards(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const client = await clientService.getClientByUserId(req.userId!);
      const result = await clientService.getClientGuards(client.id, page, limit);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getGuardProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { guardId } = req.params;
      const client = await clientService.getClientByUserId(req.userId!);
      const profile = await clientService.getClientGuardProfile(client.id, guardId);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  async getMyReports(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      let client;
      try {
        client = await clientService.getClientByUserId(req.userId!);
      } catch (error: any) {
        // Client not found - return empty list instead of error
        if (error.name === 'NotFoundError' || (error as any).constructor?.name === 'NotFoundError') {
          res.json({
            success: true,
            data: {
              reports: [],
              pagination: {
                page,
                limit,
                total: 0,
                pages: 0,
              },
            },
          });
          return;
        }
        throw error;
      }
      
      if (!client || !client.id) {
        res.json({
          success: true,
          data: {
            reports: [],
            pagination: {
              page,
              limit,
              total: 0,
              pages: 0,
            },
          },
        });
        return;
      }
      
      const result = await clientService.getClientReports(client.id, page, limit);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error in getMyReports controller:', {
        error: error.message,
        stack: error.stack,
        userId: req.userId,
      });
      next(error);
    }
  }

  async getMySites(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const client = await clientService.getClientByUserId(req.userId!);
      const result = await clientService.getClientSites(client.id, page, limit);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyShifts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const { startDate, endDate, status, siteId } = req.query;
      
      const client = await clientService.getClientByUserId(req.userId!);
      
      const shiftService = (await import('../services/shift/index.js')).shiftSchedulingService;
      
      const result = await shiftService.getClientShifts(client.id, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        status: status as any,
        siteId: siteId as string | undefined,
        page,
        limit,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const client = await clientService.getClientByUserId(req.userId!);
      const result = await clientService.getClientNotifications(client.id, page, limit);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async respondToReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;
      const { status, responseNotes } = req.body;
      const client = await clientService.getClientByUserId(req.userId!);
      
      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required',
        });
      }

      const result = await clientService.respondToReport(reportId, client.id, status, responseNotes);
      res.json({
        success: true,
        data: result,
        message: 'Report response saved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a shift (Option B - Client can create shift with optional guard)
   */
  async createShift(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { siteId, guardId, description, scheduledStartTime, scheduledEndTime, notes } = req.body;
      const client = await clientService.getClientByUserId(req.userId!);

      // Validate required fields
      if (!siteId || !scheduledStartTime || !scheduledEndTime) {
        return res.status(400).json({
          success: false,
          error: 'siteId, scheduledStartTime, and scheduledEndTime are required',
        });
      }

      // Verify site belongs to client
      const site = await prisma.site.findUnique({
        where: { id: siteId },
        include: { client: true },
      });

      if (!site) {
        return res.status(404).json({
          success: false,
          error: 'Site not found',
        });
      }

      if (site.clientId !== client.id) {
        return res.status(403).json({
          success: false,
          error: 'Site does not belong to this client',
        });
      }

      // If guardId is provided, verify guard exists and is linked to client's company
      if (guardId) {
        const guard = await prisma.guard.findUnique({
          where: { id: guardId },
        });

        if (!guard) {
          return res.status(404).json({
            success: false,
            error: 'Guard not found',
          });
        }

        const guardCompany = await prisma.companyGuard.findFirst({
          where: { guardId, isActive: true },
        });
        const clientCompany = await prisma.companyClient.findFirst({
          where: { clientId: client.id, isActive: true },
        });

        if (
          !guardCompany ||
          !clientCompany ||
          guardCompany.securityCompanyId !== clientCompany.securityCompanyId
        ) {
          return res.status(403).json({
            success: false,
            error: 'Guard is not in the same company as client',
          });
        }
      }

      // Create shift using shiftService (unified service)
      const shift = await shiftService.createShift({
        guardId: guardId || undefined, // Optional for client - admin can assign later
        siteId,
        clientId: client.id,
        locationName: site.name,
        locationAddress: site.address,
        scheduledStartTime: new Date(scheduledStartTime),
        scheduledEndTime: new Date(scheduledEndTime),
        description: description || `Shift at ${site.name}`,
        notes: notes || undefined,
      });

      res.status(201).json({
        success: true,
        data: shift,
        message: 'Shift created successfully',
      });
    } catch (error) {
        next(error);
    }
  }

  /**
   * Create recurring shifts for a week or month
   */
  async createBulkShifts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { siteId, guardId, description, scheduledStartTime, scheduledEndTime, notes, repeatPattern } = req.body;

      if (!siteId || !scheduledStartTime || !scheduledEndTime) {
        res.status(400).json({
          success: false,
          error: 'siteId, scheduledStartTime, and scheduledEndTime are required',
        });
        return;
      }

      if (!repeatPattern || !['week', 'month'].includes(repeatPattern)) {
        res.status(400).json({
          success: false,
          error: 'repeatPattern must be "week" or "month"',
        });
        return;
      }

      const client = await clientService.getClientByUserId(req.userId!);
      const site = await prisma.site.findFirst({
        where: { id: siteId, clientId: client.id },
      });

      if (!site) {
        res.status(404).json({ success: false, error: 'Site not found' });
        return;
      }

      const companyClient = await prisma.companyClient.findFirst({
        where: { clientId: client.id, isActive: true },
        select: { securityCompanyId: true },
      });

      const shiftServiceModule = (await import('../services/shift/index.js')).shiftSchedulingService;
      const result = await shiftServiceModule.createBulkShifts(
        {
          siteId,
          guardId: guardId || undefined,
          scheduledStartTime: new Date(scheduledStartTime),
          scheduledEndTime: new Date(scheduledEndTime),
          description,
          notes,
          repeatPattern,
        },
        companyClient?.securityCompanyId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: `${result.count} shifts scheduled successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a client's own shift (only SCHEDULED shifts)
   */
  async updateShift(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shiftId } = req.params;
      const { scheduledStartTime, scheduledEndTime, description, notes } = req.body;

      const client = await clientService.getClientByUserId(req.userId!);

      const shiftServiceModule = (await import('../services/shift/index.js')).shiftSchedulingService;
      const updated = await shiftServiceModule.updateShift(
        shiftId,
        {
          scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : undefined,
          scheduledEndTime: scheduledEndTime ? new Date(scheduledEndTime) : undefined,
          description,
          notes,
        },
        { clientId: client.id }
      );

      res.json({ success: true, data: updated, message: 'Shift updated successfully' });
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (error.name === 'ValidationError') {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Delete (cancel) a client's own shift
   */
  async deleteShift(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shiftId } = req.params;
      const client = await clientService.getClientByUserId(req.userId!);

      const shiftServiceModule = (await import('../services/shift/index.js')).shiftSchedulingService;
      await shiftServiceModule.deleteShift(shiftId, { clientId: client.id });

      res.json({ success: true, message: 'Shift deleted successfully' });
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      if (error.name === 'ValidationError') {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }
}

const clientController = new ClientController();
export default clientController;
