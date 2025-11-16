import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

interface ClientProfileUpdateData {
  // Individual account fields
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  
  // Company account fields
  companyName?: string;
  companyRegistrationNumber?: string;
  taxId?: string;
  website?: string;
}

export class ClientService {
  async getAllClients(page: number = 1, limit: number = 50, accountType?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (accountType) {
      where.accountType = accountType;
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.client.count({ where }),
    ]);

    return {
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getClientById(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    return client;
  }

  async getClientByUserId(userId: string) {
    const client = await prisma.client.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client profile not found');
    }

    return client;
  }

  async updateClientProfile(userId: string, data: ClientProfileUpdateData) {
    // Find the client by userId
    const client = await prisma.client.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            accountType: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client profile not found');
    }

    // Validate required fields based on account type
    if (client.accountType === 'COMPANY') {
      if (!data.companyName) {
        throw new ValidationError('Company name is required for company accounts');
      }
      if (!data.companyRegistrationNumber) {
        throw new ValidationError('Company registration number is required for company accounts');
      }
    }

    const updated = await prisma.client.update({
      where: { userId },
      data: {
        companyName: data.companyName,
        companyRegistrationNumber: data.companyRegistrationNumber,
        taxId: data.taxId,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country || 'United States',
        website: data.website,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            accountType: true,
          },
        },
      },
    });

    logger.info(`Client profile updated: ${updated.user.email}, ID: ${updated.id}, Type: ${updated.accountType}`);
    return updated;
  }

  async updateClient(id: string, data: any) {
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        companyName: data.companyName,
        companyRegistrationNumber: data.companyRegistrationNumber,
        taxId: data.taxId,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        website: data.website,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    logger.info(`Client updated: ${updated.user.email}, ID: ${updated.id}`);
    return updated;
  }

  async deleteClient(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    await prisma.client.delete({
      where: { id },
    });

    logger.info(`Client deleted: ID: ${id}`);
    return { message: 'Client deleted successfully' };
  }

  async getClientStats() {
    const [totalClients, individualClients, companyClients, activeClients] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { accountType: 'INDIVIDUAL' } }),
      prisma.client.count({ where: { accountType: 'COMPANY' } }),
      prisma.client.count({
        where: {
          user: {
            isActive: true,
          },
        },
      }),
    ]);

    return {
      total: totalClients,
      individual: individualClients,
      company: companyClients,
      active: activeClients,
      inactive: totalClients - activeClients,
    };
  }

  async getDashboardStats(clientId: string) {
    // Mock data for dashboard stats - in real implementation, these would be calculated from actual data
    const stats = {
      guardsOnDuty: 5,
      missedShifts: 1,
      activeSites: 5,
      newReports: 2,
    };

    logger.info(`Dashboard stats requested for client: ${clientId}`);
    return stats;
  }

  async getClientGuards(clientId: string, page: number = 1, limit: number = 50) {
    // Mock data for client guards - in real implementation, this would fetch guards assigned to client
    const guards = [
      {
        id: '1',
        name: 'Mark Husdon',
        pastJobs: 13,
        rating: 4.5,
        availability: 'Available today',
        status: 'Active',
      },
      {
        id: '2',
        name: 'John Smith',
        pastJobs: 8,
        rating: 4.2,
        availability: 'Available today',
        status: 'Active',
      },
    ];

    logger.info(`Guards list requested for client: ${clientId}`);
    return {
      guards,
      pagination: {
        page,
        limit,
        total: guards.length,
        pages: Math.ceil(guards.length / limit),
      },
    };
  }

  async getClientReports(clientId: string, page: number = 1, limit: number = 50) {
    // Mock data for client reports - in real implementation, this would fetch reports for client's sites
    const reports = [
      {
        id: '1',
        type: 'Medical Emergency',
        guardName: 'Mark Husdon',
        site: 'Site Alpha',
        time: '10:30 Am',
        description: 'Visitor collapsed in main lobby',
        status: 'Respond',
        checkInTime: '08:12 am',
      },
      {
        id: '2',
        type: 'Incident',
        guardName: 'Mark Husdon',
        site: 'Site Alpha',
        time: '10:30 Am',
        description: 'Unauthorized vehicle in parking area. License plate recorded',
        status: 'New',
        checkInTime: '08:12 am',
      },
    ];

    logger.info(`Reports list requested for client: ${clientId}`);
    return {
      reports,
      pagination: {
        page,
        limit,
        total: reports.length,
        pages: Math.ceil(reports.length / limit),
      },
    };
  }

  async getClientSites(clientId: string, page: number = 1, limit: number = 50) {
    // Mock data for client sites - in real implementation, this would fetch client's sites
    const sites = [
      {
        id: '1',
        name: 'Park View Plaza',
        address: '1321 Baker Street, NY',
        guardName: 'Mark Husdon',
        status: 'Active',
        checkInTime: '08:12 am',
      },
      {
        id: '2',
        name: 'Central Library',
        address: '1321 Baker Street, NY',
        guardName: 'Mark Husdon',
        status: 'Upcoming',
        shiftTime: '09:00 am - 07:00 pm',
      },
    ];

    logger.info(`Sites list requested for client: ${clientId}`);
    return {
      sites,
      pagination: {
        page,
        limit,
        total: sites.length,
        pages: Math.ceil(sites.length / limit),
      },
    };
  }

  async getClientNotifications(clientId: string, page: number = 1, limit: number = 50) {
    // Mock data for client notifications - in real implementation, this would fetch notifications for client
    const notifications = [
      {
        id: '1',
        guardName: 'Mark Husdon',
        action: 'Checked in at 08:12 am',
        site: 'Site Alpha',
        status: 'Active',
      },
      {
        id: '2',
        guardName: 'Mark Husdon',
        action: 'Sent a incident report',
        site: 'Site Alpha',
        status: 'Active',
      },
    ];

    logger.info(`Notifications list requested for client: ${clientId}`);
    return {
      notifications,
      pagination: {
        page,
        limit,
        total: notifications.length,
        pages: Math.ceil(notifications.length / limit),
      },
    };
  }

  async createClientProfile(userId: string, accountType: 'INDIVIDUAL' | 'COMPANY' = 'INDIVIDUAL') {
    // Check if client profile already exists
    const existingClient = await prisma.client.findUnique({
      where: { userId },
    });

    if (existingClient) {
      return existingClient;
    }

    // Create new client profile
    const client = await prisma.client.create({
      data: {
        userId,
        accountType,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    logger.info(`Client profile created for user: ${userId}`);
    return client;
  }
}

const clientService = new ClientService();
export default clientService;
