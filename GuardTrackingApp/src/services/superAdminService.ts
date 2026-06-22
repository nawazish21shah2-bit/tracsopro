/**
 * Super Admin Service - Frontend service for Super Admin functionality
 */

import { superAdminApi } from './api/superAdminApi';
import {
  normalizePagination,
  PaginationMeta,
  unwrapApiPayload,
} from '../utils/paginationUtils';

export interface MetricGrowth {
  current: number;
  previous: number;
  growth: number;
}

export interface PlatformOverview {
  period?: string;
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  activeUsers: number;
  totalGuards: number;
  activeGuards: number;
  totalClients: number;
  totalSites: number;
  activeSites: number;
  totalRevenue: number;
  growth?: {
    revenue: MetricGrowth;
    companies: MetricGrowth;
    users: MetricGrowth;
    guards: MetricGrowth;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    resource: string;
    userId?: string;
    timestamp: string;
    details?: any;
  }>;
}

export interface PlatformAnalyticsResponse {
  period: string;
  summary: {
    revenue: MetricGrowth;
    users: MetricGrowth;
    companies: MetricGrowth;
    guards: MetricGrowth;
  };
  charts: {
    revenue: { labels: string[]; data: number[] };
    users: { labels: string[]; data: number[] };
  };
}

export interface SecurityCompany {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionStartDate: string;
  subscriptionEndDate?: string;
  maxGuards: number;
  maxClients: number;
  maxSites: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    guards: number;
    clients: number;
    sites: number;
  };
}

export interface BillingOverview {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: {
    amount: number;
    count: number;
  };
  overduePayments: {
    amount: number;
    count: number;
  };
  recentTransactions: any[];
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  securityCompanyId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

function safeParseJson(value: unknown): unknown {
  if (value == null) return undefined;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

class SuperAdminService {
  static async getPlatformOverview(params: { period?: string } = {}): Promise<PlatformOverview> {
    try {
      const response = await superAdminApi.get('/super-admin/overview', { params });
      const data = unwrapApiPayload<{
        period?: string;
        overview?: Record<string, number>;
        growth?: PlatformOverview['growth'];
        recentActivity?: PlatformOverview['recentActivity'];
      }>(response);

      return {
        period: data.period,
        totalCompanies: data.overview?.totalCompanies || 0,
        activeCompanies: data.overview?.activeCompanies || 0,
        totalUsers: data.overview?.totalUsers || 0,
        activeUsers: data.overview?.activeUsers || 0,
        totalGuards: data.overview?.totalGuards || 0,
        activeGuards: data.overview?.activeGuards || 0,
        totalClients: data.overview?.totalClients || 0,
        totalSites: data.overview?.totalSites || 0,
        activeSites: data.overview?.activeSites || 0,
        totalRevenue: data.overview?.totalRevenue || 0,
        growth: data.growth,
        recentActivity: (data.recentActivity || []).map((activity: any) => ({
          id: activity.id,
          action: activity.action,
          resource: activity.resource,
          userId: activity.userId,
          timestamp: activity.timestamp,
          details: safeParseJson(activity.newValues),
        })),
      };
    } catch (error) {
      console.error('Error fetching platform overview:', error);
      throw error;
    }
  }

  async getSecurityCompanies(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    plan?: string;
  } = {}): Promise<{
    companies: SecurityCompany[];
    pagination: PaginationMeta;
  }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const response = await superAdminApi.get('/super-admin/companies', { params });
    const payload = unwrapApiPayload<{
      companies?: unknown[];
      pagination?: Partial<PaginationMeta>;
    }>(response);
    const companies = (payload.companies || []).map((company: any) =>
      SuperAdminService.transformCompany(company)
    );
    return {
      companies,
      pagination: normalizePagination(payload.pagination, {
        page,
        limit,
        total: payload.pagination?.total ?? companies.length,
      }),
    };
  }

  async createSecurityCompany(data: {
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
  }): Promise<{
    company: SecurityCompany;
    adminCredentials?: { email: string; temporaryPassword: string };
  }> {
    const response = await superAdminApi.post('/super-admin/companies', data);
    const payload = unwrapApiPayload<Record<string, unknown>>(response) ?? {};
    const companyPayload = payload.company ?? payload;
    const adminCredentials =
      payload.adminCredentials ??
      (data.adminPassword && (data.adminEmail || data.email)
        ? {
            email: (data.adminEmail || data.email).trim().toLowerCase(),
            temporaryPassword: data.adminPassword,
          }
        : undefined);

    return {
      company: SuperAdminService.transformCompany(companyPayload),
      adminCredentials,
    };
  }

  async updateSecurityCompany(companyId: string, data: Partial<SecurityCompany>): Promise<SecurityCompany> {
    const response = await superAdminApi.put(`/super-admin/companies/${companyId}`, data);
    return SuperAdminService.transformCompany(unwrapApiPayload(response));
  }

  async deleteSecurityCompany(companyId: string): Promise<{ id: string }> {
    const response = await superAdminApi.delete(`/super-admin/companies/${companyId}`);
    return unwrapApiPayload(response);
  }

  async toggleCompanyStatus(companyId: string, isActive: boolean): Promise<SecurityCompany> {
    const response = await superAdminApi.patch(`/super-admin/companies/${companyId}/status`, { isActive });
    return SuperAdminService.transformCompany(unwrapApiPayload(response));
  }

  async getPlatformAnalytics(params: {
    startDate?: string;
    endDate?: string;
    period?: string;
  } = {}): Promise<PlatformAnalyticsResponse> {
    const response = await superAdminApi.get('/super-admin/analytics', { params });
    return unwrapApiPayload(response);
  }

  async getBillingOverview(): Promise<BillingOverview> {
    const response = await superAdminApi.get('/super-admin/billing');
    return unwrapApiPayload(response);
  }

  async getPaymentRecords(params: {
    page?: number;
    limit?: number;
    status?: string;
    companyId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  } = {}): Promise<{
    records: any[];
    pagination: PaginationMeta;
  }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const response = await superAdminApi.get('/super-admin/payments', { params });
    const payload = unwrapApiPayload<{
      records?: any[];
      pagination?: Partial<PaginationMeta>;
    }>(response);
    const records = payload.records || [];
    return {
      records,
      pagination: normalizePagination(payload.pagination, {
        page,
        limit,
        total: payload.pagination?.total ?? records.length,
      }),
    };
  }

  async getPaymentRecordById(paymentId: string): Promise<any> {
    const response = await superAdminApi.get(`/super-admin/payments/${paymentId}`);
    return unwrapApiPayload(response);
  }

  async updatePaymentStatus(
    paymentId: string,
    status: string,
    paidDate?: string,
    paymentMethod?: string
  ): Promise<any> {
    const response = await superAdminApi.patch(`/super-admin/payments/${paymentId}/status`, {
      status,
      paidDate,
      paymentMethod,
    });
    return unwrapApiPayload(response);
  }

  async getPaymentAnalytics(params: {
    startDate?: string;
    endDate?: string;
    companyId?: string;
  } = {}): Promise<any> {
    const response = await superAdminApi.get('/super-admin/payments/analytics', { params });
    return unwrapApiPayload(response);
  }

  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    userId?: string;
    companyId?: string;
    search?: string;
  } = {}): Promise<{
    logs: AuditLog[];
    pagination: PaginationMeta;
  }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const response = await superAdminApi.get('/super-admin/audit-logs', { params });
    const payload = unwrapApiPayload<{
      logs?: any[];
      pagination?: Partial<PaginationMeta>;
    }>(response);
    const logs = (payload.logs || []).map((log: any) => {
      const user = log.user;
      const userName = user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
        : log.userId
          ? 'User'
          : 'System';
      return {
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        timestamp: log.timestamp,
        userId: log.userId,
        userName,
        userEmail: user?.email,
        securityCompanyId: log.securityCompanyId,
        oldValues: safeParseJson(log.oldValues),
        newValues: safeParseJson(log.newValues),
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      };
    });
    return {
      logs,
      pagination: normalizePagination(payload.pagination, {
        page,
        limit,
        total: payload.pagination?.total ?? logs.length,
      }),
    };
  }

  async getPlatformSettings(): Promise<any> {
    const response = await superAdminApi.get('/super-admin/settings');
    return unwrapApiPayload(response);
  }

  async updatePlatformSettings(settings: any): Promise<{ success: boolean }> {
    const response = await superAdminApi.put('/super-admin/settings', settings);
    return unwrapApiPayload(response);
  }

  async getCompanyById(companyId: string): Promise<SecurityCompany> {
    const response = await superAdminApi.get(`/super-admin/companies/${companyId}`);
    return SuperAdminService.transformCompany(unwrapApiPayload(response));
  }

  async getCompanySubscription(companyId: string): Promise<any> {
    const response = await superAdminApi.get(`/super-admin/companies/${companyId}/subscription`);
    return unwrapApiPayload(response);
  }

  async createCompanySubscriptionCheckout(
    companyId: string,
    data: { priceId: string; trialDays?: number }
  ): Promise<{ id: string; url: string | null }> {
    const response = await superAdminApi.post(
      `/super-admin/companies/${companyId}/subscription/checkout`,
      data
    );
    return unwrapApiPayload(response);
  }

  async getCompanyBillingPortal(companyId: string): Promise<{ url: string }> {
    const response = await superAdminApi.get(`/super-admin/companies/${companyId}/billing-portal`);
    return unwrapApiPayload(response);
  }

  async searchUsers(params: {
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    users: Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      isActive: boolean;
    }>;
    pagination: PaginationMeta;
  }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const response = await superAdminApi.get('/super-admin/users', { params });
    const payload = unwrapApiPayload<{
      users?: Array<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isActive: boolean;
      }>;
      pagination?: Partial<PaginationMeta>;
    }>(response);
    const users = payload.users || [];
    return {
      users,
      pagination: normalizePagination(payload.pagination, {
        page,
        limit,
        total: payload.pagination?.total ?? users.length,
      }),
    };
  }

  async impersonateUser(targetUserId: string): Promise<any> {
    const response = await superAdminApi.post('/super-admin/impersonate', { targetUserId });
    return unwrapApiPayload(response);
  }

  async exportPlatformData(): Promise<any> {
    const response = await superAdminApi.post('/super-admin/export-data');
    return unwrapApiPayload(response);
  }

  private static transformCompany(data: any): SecurityCompany {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      country: data.country,
      subscriptionPlan: data.subscriptionPlan,
      subscriptionStatus: data.subscriptionStatus,
      subscriptionStartDate: data.subscriptionStartDate
        ? new Date(data.subscriptionStartDate).toISOString()
        : new Date().toISOString(),
      subscriptionEndDate: data.subscriptionEndDate
        ? new Date(data.subscriptionEndDate).toISOString()
        : undefined,
      maxGuards: data.maxGuards || 0,
      maxClients: data.maxClients || 0,
      maxSites: data.maxSites || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString(),
      _count: data._count || { users: 0, guards: 0, clients: 0, sites: 0 },
    };
  }
}

export default SuperAdminService;
export { SuperAdminService };
export const superAdminService = new SuperAdminService();
