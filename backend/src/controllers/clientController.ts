import { Request, Response, NextFunction } from 'express';
import clientService from '../services/clientService.js';
import { AuthRequest } from '../middleware/auth.js';

export class ClientController {
  async getAllClients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const accountType = req.query.accountType as string;

      const result = await clientService.getAllClients(page, limit, accountType);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getClientById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const client = await clientService.getClientById(req.params.id);
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

  async updateClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const client = await clientService.updateClient(req.params.id, req.body);
      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteClient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await clientService.deleteClient(req.params.id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getClientStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await clientService.getClientStats();
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

  async getMyReports(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const client = await clientService.getClientByUserId(req.userId!);
      const result = await clientService.getClientReports(client.id, page, limit);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
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
}

const clientController = new ClientController();
export default clientController;
