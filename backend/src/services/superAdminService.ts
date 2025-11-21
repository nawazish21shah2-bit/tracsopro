import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

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

      // Log the action (userId should be passed from route handler)
      // This will be called from route handler with userId

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

      // Log the action (userId should be passed from route handler)
      // This will be called from route handler with userId

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

      // Log the action (userId should be passed from route handler)
      // This will be called from route handler with userId

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
          oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
          newValues: params.newValues ? JSON.stringify(params.newValues) : null
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
      const updates = [];
      
      for (const [category, categorySettings] of Object.entries(settings)) {
        for (const [key, value] of Object.entries(categorySettings as any)) {
          updates.push(
            prisma.platformSettings.upsert({
              where: {
                securityCompanyId_key: {
                  securityCompanyId: null,
                  key: `${category}.${key}`
                }
              },
              update: { value: String(value) },
              create: {
                key: `${category}.${key}`,
                value: String(value),
                category: category as any,
                isGlobal: true
              }
            })
          );
        }
      }

      await Promise.all(updates);

      // Log the action (userId should be passed from route handler)
      // This will be called from route handler with userId

      return { success: true };
    } catch (error) {
      console.error('Error updating platform settings:', error);
      throw new Error('Failed to update platform settings');
    }
  }
}

export default SuperAdminService;
