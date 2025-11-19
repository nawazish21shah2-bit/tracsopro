import prisma from '../config/database.js';

export class AdminClientService {
  async getClients(params: { page?: number; limit?: number; search?: string } = {}) {
    const { page = 1, limit = 50, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
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
