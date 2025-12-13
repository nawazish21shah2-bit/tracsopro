import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';

export class AdminUserService {
  async getUsers(params: {
    page?: number;
    limit?: number;
    role?: 'GUARD' | 'ADMIN' | 'CLIENT' | 'SUPER_ADMIN';
    search?: string;
    isActive?: boolean;
    securityCompanyId?: string; // Multi-tenant filter
  }) {
    const { page = 1, limit = 50, role, search, isActive, securityCompanyId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Multi-tenant: Filter by company - simplified logic
    if (securityCompanyId) {
      const companyFilter = {
        some: {
          securityCompanyId,
          isActive: true,
        },
      };

      if (role === 'GUARD') {
        where.guard = { companyGuards: companyFilter };
      } else if (role === 'CLIENT') {
        where.client = { companyClients: companyFilter };
      } else if (role === 'ADMIN') {
        where.companyUsers = companyFilter;
      } else {
        // For all roles, use OR condition
        where.OR = [
          { guard: { companyGuards: companyFilter } },
          { client: { companyClients: companyFilter } },
          { companyUsers: companyFilter },
        ];
      }
    }

    if (role) {
      where.role = role;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search) {
      const searchCondition = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
      
      // Combine with existing where conditions
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          searchCondition,
        ];
        delete where.OR;
      } else {
        where.OR = searchCondition.OR;
      }
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

  /**
   * Create a user as admin (bypasses invitation code requirement)
   * Admin-created users skip email verification and are auto-activated
   */
  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'GUARD' | 'ADMIN' | 'CLIENT';
    phone?: string;
    securityCompanyId?: string;
    department?: string; // For guards
  }) {
    const { email, password, firstName, lastName, role, phone, securityCompanyId, department } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user (skip email verification for admin-created users)
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || null,
          role,
          isActive: true,
          isEmailVerified: true, // Admin-created users are pre-verified
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      // Create role-specific profile
      if (role === 'GUARD') {
        // Generate employeeId (format: EMP-YYYYMMDD-XXXX)
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const random = Math.floor(1000 + Math.random() * 9000);
        const employeeId = `EMP-${date}-${random}`;

        await tx.guard.create({
          data: {
            userId: user.id,
            employeeId,
            department: department || null,
            status: 'ACTIVE',
          },
        });
      } else if (role === 'CLIENT') {
        await tx.client.create({
          data: {
            userId: user.id,
            accountType: 'COMPANY', // Default for admin-created clients
          },
        });
      }

      // Link to company if provided
      if (securityCompanyId) {
        if (role === 'GUARD') {
          const guard = await tx.guard.findUnique({ where: { userId: user.id } });
          if (guard) {
            await tx.companyGuard.create({
              data: {
                guardId: guard.id,
                securityCompanyId,
                isActive: true,
              },
            });
          }
        } else if (role === 'CLIENT') {
          const client = await tx.client.findUnique({ where: { userId: user.id } });
          if (client) {
            await tx.companyClient.create({
              data: {
                clientId: client.id,
                securityCompanyId,
                isActive: true,
              },
            });
          }
        } else if (role === 'ADMIN') {
          await tx.companyUser.create({
            data: {
              userId: user.id,
              securityCompanyId,
              role: 'ADMIN',
              isActive: true,
            },
          });
        }
      }

      return user;
    });

    return result;
  }
}

export default new AdminUserService();
