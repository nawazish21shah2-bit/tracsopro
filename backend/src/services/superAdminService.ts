import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AuthService } from './authService.js';

const prisma = new PrismaClient();

export class SuperAdminService {
  /**
   * Get platform overview statistics
   */
  static async getPlatformOverview() {
    try {
      const [
        totalCompanies,
        activeCompanies,
        totalUsers,
        activeUsers,
        totalGuards,
        activeGuards,
        totalClients,
        totalSites,
        totalRevenue,
        recentActivity
      ] = await Promise.all([
        prisma.securityCompany.count(),
        prisma.securityCompany.count({ where: { isActive: true } }),
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.guard.count(),
        prisma.guard.count({ where: { status: 'ACTIVE' } }),
        prisma.client.count(),
        prisma.site.count({ where: { isActive: true } }),
        prisma.billingRecord.aggregate({
          where: { status: 'PAID' },
          _sum: { amount: true }
        }),
        prisma.systemAuditLog.findMany({
          take: 10,
          orderBy: { timestamp: 'desc' }
        })
      ]);

      return {
        overview: {
          totalCompanies,
          activeCompanies,
          totalUsers,
          activeUsers,
          totalGuards,
          activeGuards,
          totalClients,
          totalSites,
          totalRevenue: totalRevenue._sum.amount || 0
        },
        recentActivity
      };
    } catch (error) {
      console.error('Error getting platform overview:', error);
      throw new Error('Failed to get platform overview');
    }
  }

  /**
   * Get a single security company by ID
   */
  static async getSecurityCompany(companyId: string) {
    try {
      const company = await prisma.securityCompany.findUnique({
        where: { id: companyId },
        include: {
          _count: {
            select: { users: true, guards: true, clients: true, sites: true },
          },
          subscriptions: {
            where: { isActive: true },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!company) {
        throw new Error('Company not found');
      }

      return company;
    } catch (error) {
      console.error('Error getting security company:', error);
      throw new Error('Failed to get security company');
    }
  }

  /**
   * Delete a security company by ID
   */
  static async deleteSecurityCompany(companyId: string) {
    try {
      // Optionally: check constraints or perform cascading cleanup as needed
      const deleted = await prisma.securityCompany.delete({ where: { id: companyId } });

      await this.logAction({
        action: 'DELETE_COMPANY',
        resource: 'SecurityCompany',
        resourceId: companyId,
        oldValues: deleted,
      });

      return { id: companyId };
    } catch (error) {
      console.error('Error deleting security company:', error);
      throw new Error('Failed to delete security company');
    }
  }

  /**
   * Get all security companies with pagination and filters
   */
  static async getSecurityCompanies(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    plan?: string;
  }) {
    try {
      const { page = 1, limit = 10, search, status, plan } = params;
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (status) {
        where.subscriptionStatus = status;
      }
      
      if (plan) {
        where.subscriptionPlan = plan;
      }

      const [companies, total] = await Promise.all([
        prisma.securityCompany.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                users: true,
                guards: true,
                clients: true,
                sites: true
              }
            },
            subscriptions: {
              where: { isActive: true },
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          }
        }),
        prisma.securityCompany.count({ where })
      ]);

      return {
        companies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting security companies:', error);
      throw new Error('Failed to get security companies');
    }
  }

  /**
   * Create a new security company
   */
  static async createSecurityCompany(data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    subscriptionPlan: string;
    maxGuards?: number;
    maxClients?: number;
    maxSites?: number;
  }) {
    try {
      const company = await prisma.securityCompany.create({
        data: {
          ...data,
          subscriptionPlan: data.subscriptionPlan as any,
          subscriptionStatus: 'TRIAL',
          subscriptionStartDate: new Date(),
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days trial
        }
      });

      // Create initial subscription record
      await prisma.subscription.create({
        data: {
          securityCompanyId: company.id,
          plan: data.subscriptionPlan as any,
          status: 'TRIAL',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          amount: 0,
          billingCycle: 'MONTHLY'
        }
      });

      // Log the action
      await this.logAction({
        action: 'CREATE_COMPANY',
        resource: 'SecurityCompany',
        resourceId: company.id,
        newValues: company
      });

      return company;
    } catch (error) {
      console.error('Error creating security company:', error);
      throw new Error('Failed to create security company');
    }
  }

  /**
   * Update security company
   */
  static async updateSecurityCompany(companyId: string, data: any) {
    try {
      const oldCompany = await prisma.securityCompany.findUnique({
        where: { id: companyId }
      });

      const updatedCompany = await prisma.securityCompany.update({
        where: { id: companyId },
        data
      });

      // Log the action
      await this.logAction({
        action: 'UPDATE_COMPANY',
        resource: 'SecurityCompany',
        resourceId: companyId,
        oldValues: oldCompany,
        newValues: updatedCompany
      });

      return updatedCompany;
    } catch (error) {
      console.error('Error updating security company:', error);
      throw new Error('Failed to update security company');
    }
  }

  /**
   * Suspend/Activate security company
   */
  static async toggleCompanyStatus(companyId: string, isActive: boolean) {
    try {
      const company = await prisma.securityCompany.update({
        where: { id: companyId },
        data: { 
          isActive,
          subscriptionStatus: isActive ? 'ACTIVE' : 'SUSPENDED'
        }
      });

      // Log the action
      await this.logAction({
        action: isActive ? 'ACTIVATE_COMPANY' : 'SUSPEND_COMPANY',
        resource: 'SecurityCompany',
        resourceId: companyId,
        newValues: { isActive, subscriptionStatus: company.subscriptionStatus }
      });

      return company;
    } catch (error) {
      console.error('Error toggling company status:', error);
      throw new Error('Failed to toggle company status');
    }
  }

  /**
   * Get platform analytics
   */
  static async getPlatformAnalytics(params: {
    startDate?: Date;
    endDate?: Date;
    metricType?: string;
  }) {
    try {
      const { startDate, endDate, metricType } = params;
      
      const where: any = {};
      
      if (startDate && endDate) {
        where.timestamp = {
          gte: startDate,
          lte: endDate
        };
      }
      
      if (metricType) {
        where.metricType = metricType;
      }

      const analytics = await prisma.platformAnalytics.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: 100
      });

      // Group by metric type and calculate aggregates
      const grouped = analytics.reduce((acc, item) => {
        if (!acc[item.metricType]) {
          acc[item.metricType] = [];
        }
        acc[item.metricType].push(item);
        return acc;
      }, {} as any);

      return {
        analytics: grouped,
        summary: {
          totalMetrics: analytics.length,
          dateRange: { startDate, endDate }
        }
      };
    } catch (error) {
      console.error('Error getting platform analytics:', error);
      throw new Error('Failed to get platform analytics');
    }
  }

  /**
   * Get billing overview
   */
  static async getBillingOverview() {
    try {
      const [
        totalRevenue,
        monthlyRevenue,
        pendingPayments,
        overduePayments,
        recentTransactions
      ] = await Promise.all([
        prisma.billingRecord.aggregate({
          where: { status: 'PAID' },
          _sum: { amount: true }
        }),
        prisma.billingRecord.aggregate({
          where: {
            status: 'PAID',
            paidDate: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          },
          _sum: { amount: true }
        }),
        prisma.billingRecord.aggregate({
          where: { status: 'PENDING' },
          _sum: { amount: true },
          _count: true
        }),
        prisma.billingRecord.aggregate({
          where: { status: 'OVERDUE' },
          _sum: { amount: true },
          _count: true
        }),
        prisma.billingRecord.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            securityCompany: {
              select: { name: true, email: true }
            }
          }
        })
      ]);

      return {
        totalRevenue: totalRevenue._sum.amount || 0,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        pendingPayments: {
          amount: pendingPayments._sum.amount || 0,
          count: pendingPayments._count
        },
        overduePayments: {
          amount: overduePayments._sum.amount || 0,
          count: overduePayments._count
        },
        recentTransactions
      };
    } catch (error) {
      console.error('Error getting billing overview:', error);
      throw new Error('Failed to get billing overview');
    }
  }

  /**
   * Get system audit logs
   */
  static async getAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    userId?: string;
    companyId?: string;
  }) {
    try {
      const { page = 1, limit = 50, action, resource, userId, companyId } = params;
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (action) where.action = action;
      if (resource) where.resource = resource;
      if (userId) where.userId = userId;
      if (companyId) where.securityCompanyId = companyId;

      const [logs, total] = await Promise.all([
        prisma.systemAuditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { timestamp: 'desc' }
        }),
        prisma.systemAuditLog.count({ where })
      ]);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw new Error('Failed to get audit logs');
    }
  }

  /**
   * Log system action
   */
  static async logAction(params: {
    userId?: string;
    securityCompanyId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await prisma.systemAuditLog.create({
        data: {
          ...params,
          // Pass JSON objects directly; omit when not provided for cleaner typing
          oldValues: params.oldValues as any,
          newValues: params.newValues as any
        }
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }

  /**
   * Get platform settings
   */
  static async getPlatformSettings() {
    try {
      const settings = await prisma.platformSettings.findMany({
        where: { isGlobal: true },
        orderBy: { category: 'asc' }
      });

      // Group by category
      const grouped = settings.reduce((acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = {};
        }
        acc[setting.category][setting.key] = setting.value;
        return acc;
      }, {} as any);

      return grouped;
    } catch (error) {
      console.error('Error getting platform settings:', error);
      throw new Error('Failed to get platform settings');
    }
  }

  /**
   * Update platform settings
   */
  static async updatePlatformSettings(settings: { [key: string]: any }) {
    try {
      const ops: Promise<any>[] = [];

      for (const [category, categorySettings] of Object.entries(settings)) {
        for (const [key, value] of Object.entries(categorySettings as any)) {
          const fullKey = `${category}.${key}`;
          ops.push((async () => {
            const existing = await prisma.platformSettings.findFirst({
              where: { securityCompanyId: null, key: fullKey },
              select: { id: true },
            });
            if (existing) {
              return prisma.platformSettings.update({
                where: { id: existing.id },
                data: { value: String(value) },
              });
            } else {
              return prisma.platformSettings.create({
                data: {
                  key: fullKey,
                  value: String(value),
                  category: category as any,
                  isGlobal: true,
                },
              });
            }
          })());
        }
      }

      await Promise.all(ops);

      // Log the action
      await this.logAction({
        action: 'UPDATE_PLATFORM_SETTINGS',
        resource: 'PlatformSettings',
        newValues: settings
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating platform settings:', error);
      throw new Error('Failed to update platform settings');
    }
  }

  /**
   * Impersonate a user (Super Admin only)
   * Returns access and refresh tokens for the target user
   */
  static async impersonateUser(params: { targetUserId: string; actingUserId: string }) {
    try {
      const { targetUserId, actingUserId } = params;

      // Ensure target user exists and is active
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, email: true, isActive: true },
      });

      if (!targetUser || !targetUser.isActive) {
        throw new Error('Target user not found or inactive');
      }

      // Issue tokens for target user
      const authService = new AuthService();
      const result = await authService.loginById(targetUserId);

      // Audit log
      await this.logAction({
        userId: actingUserId,
        action: 'IMPERSONATE_USER',
        resource: 'User',
        resourceId: targetUserId,
        newValues: { targetEmail: targetUser.email },
      });

      return result; // { token, refreshToken, user, expiresIn }
    } catch (error) {
      console.error('Error impersonating user:', error);
      throw new Error('Failed to impersonate user');
    }
  }
}

export default SuperAdminService;
