/**
 * Super Admin Service - Frontend service for Super Admin functionality
 */

import apiService from './api';

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
      const response = await apiService.get('/super-admin/overview', { params });
      const data = response.data;

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
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const response = await apiService.get('/super-admin/companies', { params });
    const companies = (response.data.companies || []).map((company: any) =>
      SuperAdminService.transformCompany(company)
    );
    return { companies, pagination: response.data.pagination };
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
    const response = await apiService.post('/super-admin/companies', data);
    const payload = response.data?.data ?? response.data ?? {};
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
    const response = await apiService.put(`/super-admin/companies/${companyId}`, data);
    return SuperAdminService.transformCompany(response.data);
  }

  async deleteSecurityCompany(companyId: string): Promise<{ id: string }> {
    const response = await apiService.delete(`/super-admin/companies/${companyId}`);
    return response.data;
  }

  async toggleCompanyStatus(companyId: string, isActive: boolean): Promise<SecurityCompany> {
    const response = await apiService.patch(`/super-admin/companies/${companyId}/status`, { isActive });
    return SuperAdminService.transformCompany(response.data);
  }

  async getPlatformAnalytics(params: {
    startDate?: string;
    endDate?: string;
    period?: string;
  } = {}): Promise<PlatformAnalyticsResponse> {
    const response = await apiService.get('/super-admin/analytics', { params });
    return response.data;
  }

  async getBillingOverview(): Promise<BillingOverview> {
    const response = await apiService.get('/super-admin/billing');
    return response.data;
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
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const response = await apiService.get('/super-admin/payments', { params });
    return response.data;
  }

  async getPaymentRecordById(paymentId: string): Promise<any> {
    const response = await apiService.get(`/super-admin/payments/${paymentId}`);
    return response.data;
  }

  async updatePaymentStatus(
    paymentId: string,
    status: string,
    paidDate?: string,
    paymentMethod?: string
  ): Promise<any> {
    const response = await apiService.patch(`/super-admin/payments/${paymentId}/status`, {
      status,
      paidDate,
      paymentMethod,
    });
    return response.data;
  }

  async getPaymentAnalytics(params: {
    startDate?: string;
    endDate?: string;
    companyId?: string;
  } = {}): Promise<any> {
    const response = await apiService.get('/super-admin/payments/analytics', { params });
    return response.data;
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
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const response = await apiService.get('/super-admin/audit-logs', { params });
    const logs = (response.data.logs || []).map((log: any) => {
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
    return { logs, pagination: response.data.pagination };
  }

  async getPlatformSettings(): Promise<any> {
    const response = await apiService.get('/super-admin/settings');
    return response.data;
  }

  async updatePlatformSettings(settings: any): Promise<{ success: boolean }> {
    const response = await apiService.put('/super-admin/settings', settings);
    return response.data;
  }

  async getCompanyById(companyId: string): Promise<SecurityCompany> {
    const response = await apiService.get(`/super-admin/companies/${companyId}`);
    return SuperAdminService.transformCompany(response.data);
  }

  async getCompanySubscription(companyId: string): Promise<any> {
    const response = await apiService.get(`/super-admin/companies/${companyId}/subscription`);
    return response.data;
  }

  async createCompanySubscriptionCheckout(
    companyId: string,
    data: { priceId: string; trialDays?: number }
  ): Promise<{ id: string; url: string | null }> {
    const response = await apiService.post(
      `/super-admin/companies/${companyId}/subscription/checkout`,
      data
    );
    return response.data;
  }

  async getCompanyBillingPortal(companyId: string): Promise<{ url: string }> {
    const response = await apiService.get(`/super-admin/companies/${companyId}/billing-portal`);
    return response.data;
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
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const response = await apiService.get('/super-admin/users', { params });
    return response.data;
  }

  async impersonateUser(targetUserId: string): Promise<any> {
    const response = await apiService.post('/super-admin/impersonate', { targetUserId });
    return response.data;
  }

  async exportPlatformData(): Promise<any> {
    const response = await apiService.post('/super-admin/export-data');
    return response.data;
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
