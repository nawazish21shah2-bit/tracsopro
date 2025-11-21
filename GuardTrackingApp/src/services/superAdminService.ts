/**
 * Super Admin Service - Frontend service for Super Admin functionality
 */

import apiService from './api';

export interface PlatformOverview {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  activeUsers: number;
  totalGuards: number;
  activeGuards: number;
  totalClients: number;
  totalSites: number;
  totalRevenue: number;
  recentActivity: Array<{
    id: string;
    action: string;
    resource: string;
    userId?: string;
    timestamp: string;
    details?: any;
  }>;
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
  securityCompanyId?: string;
  oldValues?: any;
  newValues?: any;
}

class SuperAdminService {
  /**
   * Get platform overview statistics
   */
  static async getPlatformOverview(): Promise<PlatformOverview> {
    try {
      const response = await apiService.get('/super-admin/overview');
      const data = response.data;
      
      // Transform backend response to frontend format
      return {
        totalCompanies: data.overview?.totalCompanies || 0,
        activeCompanies: data.overview?.activeCompanies || 0,
        totalUsers: data.overview?.totalUsers || 0,
        activeUsers: data.overview?.activeUsers || 0,
        totalGuards: data.overview?.totalGuards || 0,
        activeGuards: data.overview?.activeGuards || 0,
        totalClients: data.overview?.totalClients || 0,
        totalSites: data.overview?.totalSites || 0,
        totalRevenue: data.overview?.totalRevenue || 0,
        recentActivity: (data.recentActivity || []).map((activity: any) => ({
          id: activity.id,
          action: activity.action,
          resource: activity.resource,
          userId: activity.userId,
          timestamp: activity.timestamp,
          details: activity.newValues ? (typeof activity.newValues === 'string' ? JSON.parse(activity.newValues) : activity.newValues) : undefined,
        })),
      };
    } catch (error) {
      console.error('Error fetching platform overview:', error);
      throw error;
    }
  }

  /**
   * Get all security companies with pagination and filters
   */
  // Instance method used by screens
  async getSecurityCompanies(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    plan?: string;
  } = {}): Promise<{
    companies: SecurityCompany[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response = await apiService.get('/super-admin/companies', {
        params,
      });
      const companies = (response.data.companies || []).map((company: any) => 
        SuperAdminService.transformCompany(company)
      );
      return {
        companies,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }

  /**
   * Create a new security company
   */
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
  }): Promise<SecurityCompany> {
    try {
      const response = await apiService.post('/super-admin/companies', data);
      return SuperAdminService.transformCompany(response.data);
    } catch (error) {
      console.error('Error creating security company:', error);
      throw error;
    }
  }

  /**
   * Update security company
   */
  async updateSecurityCompany(companyId: string, data: Partial<SecurityCompany>): Promise<SecurityCompany> {
    try {
      const response = await apiService.put(`/super-admin/companies/${companyId}`, data);
      return SuperAdminService.transformCompany(response.data);
    } catch (error) {
      console.error('Error updating security company:', error);
      throw error;
    }
  }

  /**
   * Toggle security company status (activate/suspend)
   */
  async toggleCompanyStatus(companyId: string, isActive: boolean): Promise<SecurityCompany> {
    try {
      const response = await apiService.patch(`/super-admin/companies/${companyId}/status`, { isActive });
      return SuperAdminService.transformCompany(response.data);
    } catch (error) {
      console.error('Error toggling company status:', error);
      throw error;
    }
  }

  /**
   * Get platform analytics
   */
  async getPlatformAnalytics(params: {
    startDate?: string;
    endDate?: string;
    metricType?: string;
  } = {}): Promise<any> {
    try {
      const response = await apiService.get('/super-admin/analytics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching platform analytics:', error);
      throw error;
    }
  }

  /**
   * Get billing overview
   */
  async getBillingOverview(): Promise<BillingOverview> {
    try {
      const response = await apiService.get('/super-admin/billing');
      return response.data;
    } catch (error) {
      console.error('Error fetching billing overview:', error);
      throw error;
    }
  }

  /**
   * Get system audit logs
   */
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    userId?: string;
    companyId?: string;
  } = {}): Promise<{
    logs: AuditLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response = await apiService.get('/super-admin/audit-logs', { params });
      const logs = (response.data.logs || []).map((log: any) => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        timestamp: log.timestamp,
        userId: log.userId,
        securityCompanyId: log.securityCompanyId,
        oldValues: log.oldValues ? (typeof log.oldValues === 'string' ? JSON.parse(log.oldValues) : log.oldValues) : undefined,
        newValues: log.newValues ? (typeof log.newValues === 'string' ? JSON.parse(log.newValues) : log.newValues) : undefined,
      }));
      return {
        logs,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Get platform settings
   */
  async getPlatformSettings(): Promise<any> {
    try {
      const response = await apiService.get('/super-admin/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching platform settings:', error);
      throw error;
    }
  }

  /**
   * Update platform settings
   */
  async updatePlatformSettings(settings: any): Promise<{ success: boolean }> {
    try {
      const response = await apiService.put('/super-admin/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating platform settings:', error);
      throw error;
    }
  }

  /**
   * Get company by ID
   */
  async getCompanyById(companyId: string): Promise<SecurityCompany> {
    try {
      const response = await apiService.get(`/super-admin/companies/${companyId}`);
      return SuperAdminService.transformCompany(response.data);
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  }

  /**
   * Transform backend company data to frontend format
   */
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
      subscriptionStartDate: data.subscriptionStartDate ? new Date(data.subscriptionStartDate).toISOString() : new Date().toISOString(),
      subscriptionEndDate: data.subscriptionEndDate ? new Date(data.subscriptionEndDate).toISOString() : undefined,
      maxGuards: data.maxGuards || 0,
      maxClients: data.maxClients || 0,
      maxSites: data.maxSites || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString(),
      _count: data._count || {
        users: 0,
        guards: 0,
        clients: 0,
        sites: 0
      }
    };
  }
}

export default SuperAdminService;
export { SuperAdminService };
export const superAdminService = new SuperAdminService();
