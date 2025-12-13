import prisma from '../config/database.js';

export class AdminClientService {
  async getClients(params: { page?: number; limit?: number; search?: string; securityCompanyId?: string } = {}) {
    const { page = 1, limit = 50, search, securityCompanyId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Multi-tenant: Filter by company
    if (securityCompanyId) {
      where.companyClients = {
        some: {
          securityCompanyId,
          isActive: true,
        },
      };
    }

    if (search) {
      const searchCondition = {
        user: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      };
      
      // Combine with existing where conditions
      if (where.companyClients) {
        where.AND = [
          { companyClients: where.companyClients },
          searchCondition,
        ];
        delete where.companyClients;
      } else {
        Object.assign(where, searchCondition);
      }
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
}

export default new AdminClientService();
