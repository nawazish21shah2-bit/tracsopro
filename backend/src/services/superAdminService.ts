import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AuthService } from './authService.js';
import PaymentService from './paymentService.js';
import {
  parsePeriod,
  getPeriodRanges,
  metricWithGrowth,
  getChartBucketCount,
  buildChartLabels,
  getBucketDateRange,
} from '../utils/superAdminAnalyticsUtils.js';

const prisma = new PrismaClient();

export class SuperAdminService {
  /**
   * Check if platform maintenance mode is enabled
   */
  static async isMaintenanceModeEnabled(): Promise<boolean> {
    try {
      const settings = await this.getPlatformSettings();
      const general = settings.GENERAL || {};
      const val =
        general['maintenance.mode'] ??
        general['GENERAL.maintenance.mode'];
      return String(val).toLowerCase() === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Get platform overview statistics with period-based growth
   */
  static async getPlatformOverview(params: { period?: string } = {}) {
    try {
      const period = parsePeriod(params.period);
      const { currentStart, currentEnd, previousStart, previousEnd } =
        getPeriodRanges(period);

      const [
        totalCompanies,
        activeCompanies,
        totalUsers,
        activeUsers,
        totalGuards,
        activeGuards,
        totalClients,
        totalSites,
        activeSites,
        allTimeRevenue,
        recentActivity,
        currentPeriodRevenue,
        previousPeriodRevenue,
        companiesCurrent,
        companiesPrevious,
        activeUsersCurrent,
        activeUsersPrevious,
        activeGuardsCurrent,
        activeGuardsPrevious,
      ] = await Promise.all([
        prisma.securityCompany.count(),
        prisma.securityCompany.count({ where: { isActive: true } }),
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.guard.count(),
        prisma.guard.count({ where: { status: 'ACTIVE' } }),
        prisma.client.count(),
        prisma.site.count(),
        prisma.site.count({ where: { isActive: true } }),
        prisma.billingRecord.aggregate({
          where: { status: 'PAID' },
          _sum: { amount: true },
        }),
        prisma.systemAuditLog.findMany({
          take: 10,
          orderBy: { timestamp: 'desc' },
        }),
        prisma.billingRecord.aggregate({
          where: {
            status: 'PAID',
            paidDate: { gte: currentStart, lte: currentEnd },
          },
          _sum: { amount: true },
        }),
        prisma.billingRecord.aggregate({
          where: {
            status: 'PAID',
            paidDate: { gte: previousStart, lte: previousEnd },
          },
          _sum: { amount: true },
        }),
        prisma.securityCompany.count({
          where: { createdAt: { gte: currentStart, lte: currentEnd } },
        }),
        prisma.securityCompany.count({
          where: { createdAt: { gte: previousStart, lte: previousEnd } },
        }),
        prisma.user.count({
          where: {
            isActive: true,
            createdAt: { lte: currentEnd },
          },
        }),
        prisma.user.count({
          where: {
            isActive: true,
            createdAt: { lte: previousEnd },
          },
        }),
        prisma.guard.count({
          where: {
            status: 'ACTIVE',
            createdAt: { lte: currentEnd },
          },
        }),
        prisma.guard.count({
          where: {
            status: 'ACTIVE',
            createdAt: { lte: previousEnd },
          },
        }),
      ]);

      const revenueCurrent = currentPeriodRevenue._sum.amount || 0;
      const revenuePrevious = previousPeriodRevenue._sum.amount || 0;

      return {
        period,
        overview: {
          totalCompanies,
          activeCompanies,
          totalUsers,
          activeUsers,
          totalGuards,
          activeGuards,
          totalClients,
          totalSites,
          activeSites,
          totalRevenue: allTimeRevenue._sum.amount || 0,
        },
        growth: {
          revenue: metricWithGrowth(revenueCurrent, revenuePrevious),
          companies: metricWithGrowth(companiesCurrent, companiesPrevious),
          users: metricWithGrowth(activeUsersCurrent, activeUsersPrevious),
          guards: metricWithGrowth(activeGuardsCurrent, activeGuardsPrevious),
        },
        recentActivity,
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
    adminFirstName?: string;
    adminLastName?: string;
    adminEmail?: string;
    adminPassword?: string;
    createAdmin?: boolean;
  }) {
    try {
      const createAdmin = data.createAdmin !== false;
      const adminEmail = (data.adminEmail || data.email).toLowerCase().trim();
      const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (createAdmin) {
        const existingUser = await prisma.user.findUnique({
          where: { email: adminEmail },
        });
        if (existingUser) {
          throw new Error('An account with this admin email already exists');
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.securityCompany.create({
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            country: data.country,
            subscriptionPlan: data.subscriptionPlan as any,
            subscriptionStatus: 'TRIAL',
            subscriptionStartDate: new Date(),
            subscriptionEndDate: trialEnd,
            maxGuards: data.maxGuards,
            maxClients: data.maxClients,
            maxSites: data.maxSites,
          },
        });

        await tx.subscription.create({
          data: {
            securityCompanyId: company.id,
            plan: data.subscriptionPlan as any,
            status: 'TRIAL',
            startDate: new Date(),
            endDate: trialEnd,
            amount: 0,
            billingCycle: 'MONTHLY',
          },
        });

        let adminCredentials: { email: string; temporaryPassword: string } | null = null;

        if (createAdmin) {
          const temporaryPassword =
            data.adminPassword?.trim() ||
            crypto.randomBytes(6).toString('base64url');
          const hashedPassword = await bcrypt.hash(
            temporaryPassword,
            parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
          );

          const adminUser = await tx.user.create({
            data: {
              email: adminEmail,
              password: hashedPassword,
              firstName: data.adminFirstName?.trim() || 'Company',
              lastName: data.adminLastName?.trim() || 'Admin',
              phone: data.phone || null,
              role: 'ADMIN',
              isEmailVerified: true,
              isActive: true,
            },
          });

          await tx.companyUser.create({
            data: {
              securityCompanyId: company.id,
              userId: adminUser.id,
              role: 'OWNER',
              isActive: true,
            },
          });

          adminCredentials = {
            email: adminEmail,
            temporaryPassword,
          };
        }

        return { company, adminCredentials };
      });

      return result;
    } catch (error) {
      console.error('Error creating security company:', error);
      if (error instanceof Error) {
        throw error;
      }
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
   * Get platform analytics with computed time series
   */
  static async getPlatformAnalytics(params: {
    startDate?: Date;
    endDate?: Date;
    period?: string;
    metricType?: string;
  }) {
    try {
      const period = parsePeriod(params.period);
      const endDate = params.endDate || new Date();
      const startDate =
        params.startDate ||
        getPeriodRanges(period).currentStart;
      const { previousStart, previousEnd } = getPeriodRanges(period);

      const bucketCount = getChartBucketCount(period);
      const labels = buildChartLabels(period, startDate, bucketCount);

      const revenueData: number[] = [];
      const userData: number[] = [];

      for (let i = 0; i < bucketCount; i++) {
        const { bucketStart, bucketEnd } = getBucketDateRange(
          period,
          startDate,
          endDate,
          i,
          bucketCount
        );

        const [revenueAgg, userCount] = await Promise.all([
          prisma.billingRecord.aggregate({
            where: {
              status: 'PAID',
              paidDate: { gte: bucketStart, lte: bucketEnd },
            },
            _sum: { amount: true },
          }),
          prisma.user.count({
            where: { createdAt: { lte: bucketEnd } },
          }),
        ]);

        revenueData.push(revenueAgg._sum.amount || 0);
        userData.push(userCount);
      }

      const [
        revenueCurrent,
        revenuePrevious,
        usersCurrent,
        usersPrevious,
        companiesCurrent,
        companiesPrevious,
        guardsCurrent,
        guardsPrevious,
      ] = await Promise.all([
        prisma.billingRecord.aggregate({
          where: {
            status: 'PAID',
            paidDate: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
        prisma.billingRecord.aggregate({
          where: {
            status: 'PAID',
            paidDate: { gte: previousStart, lte: previousEnd },
          },
          _sum: { amount: true },
        }),
        prisma.user.count({ where: { createdAt: { lte: endDate } } }),
        prisma.user.count({ where: { createdAt: { lte: previousEnd } } }),
        prisma.securityCompany.count({
          where: { createdAt: { lte: endDate } },
        }),
        prisma.securityCompany.count({
          where: { createdAt: { lte: previousEnd } },
        }),
        prisma.guard.count({
          where: { status: 'ACTIVE', createdAt: { lte: endDate } },
        }),
        prisma.guard.count({
          where: { status: 'ACTIVE', createdAt: { lte: previousEnd } },
        }),
      ]);

      return {
        period,
        summary: {
          revenue: metricWithGrowth(
            revenueCurrent._sum.amount || 0,
            revenuePrevious._sum.amount || 0
          ),
          users: metricWithGrowth(usersCurrent, usersPrevious),
          companies: metricWithGrowth(companiesCurrent, companiesPrevious),
          guards: metricWithGrowth(guardsCurrent, guardsPrevious),
        },
        charts: {
          revenue: { labels, data: revenueData },
          users: { labels, data: userData },
        },
        dateRange: { startDate, endDate },
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
    search?: string;
  }) {
    try {
      const { page = 1, limit = 50, action, resource, userId, companyId, search } = params;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (action && action !== 'ALL') {
        if (['LOGIN', 'LOGOUT'].includes(action)) {
          where.action = action;
        } else {
          where.action = { contains: action, mode: 'insensitive' };
        }
      }
      if (resource) where.resource = resource;
      if (userId) where.userId = userId;
      if (companyId) where.securityCompanyId = companyId;
      if (search) {
        where.OR = [
          { action: { contains: search, mode: 'insensitive' } },
          { resource: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [logs, total] = await Promise.all([
        prisma.systemAuditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { timestamp: 'desc' },
        }),
        prisma.systemAuditLog.count({ where }),
      ]);

      const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))] as string[];
      const users =
        userIds.length > 0
          ? await prisma.user.findMany({
              where: { id: { in: userIds } },
              select: { id: true, firstName: true, lastName: true, email: true },
            })
          : [];
      const userMap = new Map(users.map((u) => [u.id, u]));

      const enrichedLogs = logs.map((log) => ({
        ...log,
        user: log.userId ? userMap.get(log.userId) || null : null,
      }));

      return {
        logs: enrichedLogs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
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
        orderBy: { category: 'asc' },
      });

      const grouped = settings.reduce((acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = {};
        }
        let normalizedKey = setting.key;
        const categoryPrefix = `${setting.category}.`;
        if (normalizedKey.startsWith(categoryPrefix)) {
          normalizedKey = normalizedKey.slice(categoryPrefix.length);
        }
        acc[setting.category][normalizedKey] = setting.value;
        return acc;
      }, {} as Record<string, Record<string, string>>);

      return grouped;
    } catch (error) {
      console.error('Error getting platform settings:', error);
      throw new Error('Failed to get platform settings');
    }
  }

  /**
   * Update platform settings
   */
  static async updatePlatformSettings(settings: { [key: string]: Record<string, unknown> }) {
    try {
      const ops: Promise<unknown>[] = [];

      for (const [category, categorySettings] of Object.entries(settings)) {
        for (const [key, value] of Object.entries(categorySettings)) {
          ops.push(
            (async () => {
              const existing = await prisma.platformSettings.findFirst({
                where: {
                  securityCompanyId: null,
                  OR: [{ key }, { key: `${category}.${key}` }],
                },
                select: { id: true, key: true },
              });
              if (existing) {
                return prisma.platformSettings.update({
                  where: { id: existing.id },
                  data: { value: String(value), key },
                });
              }
              return prisma.platformSettings.create({
                data: {
                  key,
                  value: String(value),
                  category: category as 'GENERAL' | 'SECURITY' | 'BILLING' | 'NOTIFICATIONS' | 'INTEGRATIONS' | 'FEATURES',
                  isGlobal: true,
                },
              });
            })()
          );
        }
      }

      await Promise.all(ops);
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

  /**
   * Get payment records with filters and pagination
   */
  static async getPaymentRecords(params: {
    page?: number;
    limit?: number;
    status?: string;
    companyId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        companyId, 
        type, 
        startDate, 
        endDate,
        search 
      } = params;
      const skip = (page - 1) * limit;

      const where: any = {};
      
      if (status) where.status = status;
      if (companyId) where.securityCompanyId = companyId;
      if (type) where.type = type;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }
      if (search) {
        where.OR = [
          { description: { contains: search, mode: 'insensitive' } },
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { securityCompany: { name: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const [records, total] = await Promise.all([
        prisma.billingRecord.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            securityCompany: {
              select: {
                id: true,
                name: true,
                email: true,
                subscriptionPlan: true
              }
            }
          }
        }),
        prisma.billingRecord.count({ where })
      ]);

      return {
        records,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting payment records:', error);
      throw new Error('Failed to get payment records');
    }
  }

  /**
   * Get payment record by ID
   */
  static async getPaymentRecordById(paymentId: string) {
    try {
      const record = await prisma.billingRecord.findUnique({
        where: { id: paymentId },
        include: {
          securityCompany: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              city: true,
              state: true,
              zipCode: true,
              country: true,
              subscriptionPlan: true,
              subscriptionStatus: true
            }
          }
        }
      });

      if (!record) {
        throw new Error('Payment record not found');
      }

      let subscription = null;
      if (record.subscriptionId) {
        subscription = await prisma.subscription.findUnique({
          where: { id: record.subscriptionId },
          select: {
            id: true,
            plan: true,
            status: true,
            billingCycle: true
          }
        });
      }

      return { ...record, subscription };
    } catch (error) {
      console.error('Error getting payment record:', error);
      throw error;
    }
  }

  /**
   * Update payment record status
   */
  static async updatePaymentStatus(
    paymentId: string, 
    status: string, 
    paidDate?: Date,
    paymentMethod?: string
  ) {
    try {
      const updateData: any = { status };
      
      if (status === 'PAID' && paidDate) {
        updateData.paidDate = paidDate;
      }
      if (paymentMethod) {
        updateData.paymentMethod = paymentMethod;
      }

      const record = await prisma.billingRecord.update({
        where: { id: paymentId },
        data: updateData,
        include: {
          securityCompany: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return record;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw new Error('Failed to update payment status');
    }
  }

  /**
   * Get payment analytics
   */
  static async getPaymentAnalytics(params: {
    startDate?: Date;
    endDate?: Date;
    companyId?: string;
  }) {
    try {
      const { startDate, endDate, companyId } = params;
      
      const where: any = {};
      if (companyId) where.securityCompanyId = companyId;
      if (startDate || endDate) {
        where.paidDate = {};
        if (startDate) where.paidDate.gte = startDate;
        if (endDate) where.paidDate.lte = endDate;
      }

      const [
        totalRevenue,
        monthlyRevenue,
        byStatus,
        byType,
        byCompany,
        recentPayments
      ] = await Promise.all([
        // Total revenue
        prisma.billingRecord.aggregate({
          where: { ...where, status: 'PAID' },
          _sum: { amount: true },
          _count: true
        }),
        // Monthly revenue
        prisma.billingRecord.aggregate({
          where: {
            ...where,
            status: 'PAID',
            paidDate: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          },
          _sum: { amount: true },
          _count: true
        }),
        // By status
        prisma.billingRecord.groupBy({
          by: ['status'],
          where,
          _sum: { amount: true },
          _count: true
        }),
        // By type
        prisma.billingRecord.groupBy({
          by: ['type'],
          where: { ...where, status: 'PAID' },
          _sum: { amount: true },
          _count: true
        }),
        // By company (top 10)
        prisma.billingRecord.groupBy({
          by: ['securityCompanyId'],
          where: { ...where, status: 'PAID' },
          _sum: { amount: true },
          _count: true,
          orderBy: { _sum: { amount: 'desc' } },
          take: 10
        }),
        // Recent payments
        prisma.billingRecord.findMany({
          where: { ...where, status: 'PAID' },
          take: 10,
          orderBy: { paidDate: 'desc' },
          include: {
            securityCompany: {
              select: {
                name: true
              }
            }
          }
        })
      ]);

      // Get company names for top companies
      const companyIds = byCompany.map(c => c.securityCompanyId);
      const companies = await prisma.securityCompany.findMany({
        where: { id: { in: companyIds } },
        select: { id: true, name: true }
      });
      const companyMap = new Map(companies.map(c => [c.id, c.name]));

      return {
        totalRevenue: {
          amount: totalRevenue._sum.amount || 0,
          count: totalRevenue._count
        },
        monthlyRevenue: {
          amount: monthlyRevenue._sum.amount || 0,
          count: monthlyRevenue._count
        },
        byStatus: byStatus.map(s => ({
          status: s.status,
          amount: s._sum.amount || 0,
          count: s._count
        })),
        byType: byType.map(t => ({
          type: t.type,
          amount: t._sum.amount || 0,
          count: t._count
        })),
        topCompanies: byCompany.map(c => ({
          companyId: c.securityCompanyId,
          companyName: companyMap.get(c.securityCompanyId) || 'Unknown',
          amount: c._sum.amount || 0,
          count: c._count
        })),
        recentPayments
      };
    } catch (error) {
      console.error('Error getting payment analytics:', error);
      throw new Error('Failed to get payment analytics');
    }
  }

  /**
   * Export platform data snapshot
   */
  static async exportPlatformData(userId?: string) {
    try {
      const exportId = `export_${Date.now()}`;
      const [
        companies,
        userCounts,
        billingSummary,
        auditLogs,
      ] = await Promise.all([
        prisma.securityCompany.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
            isActive: true,
            createdAt: true,
          },
        }),
        prisma.user.groupBy({
          by: ['role'],
          _count: true,
        }),
        prisma.billingRecord.groupBy({
          by: ['status'],
          _sum: { amount: true },
          _count: true,
        }),
        prisma.systemAuditLog.findMany({
          take: 500,
          orderBy: { timestamp: 'desc' },
        }),
      ]);

      const payload = {
        exportId,
        exportedAt: new Date().toISOString(),
        companies,
        userCounts,
        billingSummary,
        auditLogs,
      };

      await this.logAction({
        userId,
        action: 'EXPORT_PLATFORM_DATA',
        resource: 'PlatformExport',
        resourceId: exportId,
        newValues: { companyCount: companies.length, auditLogCount: auditLogs.length },
      });

      return {
        exportId,
        status: 'completed',
        data: payload,
      };
    } catch (error) {
      console.error('Error exporting platform data:', error);
      throw new Error('Failed to export platform data');
    }
  }

  /**
   * Get company subscription info + plan catalog (super admin)
   */
  static async getCompanySubscriptionInfo(companyId: string) {
    const company = await this.getSecurityCompany(companyId);
    const svc = PaymentService.getInstance();
    const availablePlans = svc.getPlanCatalog();
    const subscription = company.subscriptions?.[0] || null;

    return {
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        subscriptionPlan: company.subscriptionPlan,
        subscriptionStatus: company.subscriptionStatus,
        isActive: company.isActive,
      },
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            stripeSubscriptionId: subscription.stripeSubscriptionId,
          }
        : null,
      availablePlans,
    };
  }

  /**
   * Create Stripe checkout session for a company (super admin on behalf)
   */
  static async createCompanySubscriptionCheckout(
    companyId: string,
    params: { priceId: string; trialDays?: number }
  ) {
    const company = await prisma.securityCompany.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    });
    if (!company) {
      throw new Error('Company not found');
    }

    const svc = PaymentService.getInstance();
    return svc.createSubscriptionCheckoutSession({
      securityCompanyId: companyId,
      priceId: params.priceId,
      trialDays: params.trialDays ?? 14,
      successUrl:
        process.env.STRIPE_SUCCESS_URL ||
        `${process.env.FRONTEND_URL || 'https://example.com'}/admin/subscription?success=true`,
      cancelUrl:
        process.env.STRIPE_CANCEL_URL ||
        `${process.env.FRONTEND_URL || 'https://example.com'}/admin/subscription?canceled=true`,
    });
  }

  /**
   * Get Stripe billing portal for a company
   */
  static async getCompanyBillingPortal(companyId: string) {
    const company = await prisma.securityCompany.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!company) {
      throw new Error('Company not found');
    }

    const svc = PaymentService.getInstance();
    return svc.createBillingPortalSession({
      securityCompanyId: companyId,
      returnUrl:
        process.env.BILLING_PORTAL_RETURN_URL ||
        `${process.env.FRONTEND_URL || 'https://example.com'}/admin/subscription`,
    });
  }

  /**
   * Search users for impersonation / admin lookup
   */
  static async searchUsers(params: {
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
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
}

export default SuperAdminService;
