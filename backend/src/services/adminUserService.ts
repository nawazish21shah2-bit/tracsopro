import prisma from '../config/database.js';

export class AdminUserService {
  async getUsers(params: {
    page?: number;
    limit?: number;
    role?: 'GUARD' | 'ADMIN' | 'CLIENT' | 'SUPER_ADMIN';
    search?: string;
    isActive?: boolean;
  }) {
    const { page = 1, limit = 50, role, search, isActive } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          guard: {
            select: {
              id: true,
              department: true,
              status: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If guard, optionally sync guard status
    if (user.role === 'GUARD') {
      await prisma.guard.updateMany({
        where: { userId: user.id },
        data: { status: isActive ? 'ACTIVE' : 'SUSPENDED' },
      });
    }

    return user;
  }

  async updateUser(userId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: 'GUARD' | 'ADMIN' | 'CLIENT' | 'SUPER_ADMIN';
  }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async deleteUser(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
    return { id: userId };
  }
}

export default new AdminUserService();
