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
    userId: string;
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
      // TODO: Implement real API call when backend is fully integrated
      // For now, using enhanced mock data with realistic metrics
      return {
        totalCompanies: 25,
        activeCompanies: 23,
        totalUsers: 1250,
        activeUsers: 1180,
        totalGuards: 850,
        activeGuards: 780,
        totalClients: 125,
        totalSites: 340,
        totalRevenue: 125000,
        recentActivity: [
          {
            id: '1',
            action: 'COMPANY_CREATED',
            resource: 'SecurityCompany',
            userId: 'admin-1',
            timestamp: new Date().toISOString(),
            details: { companyName: 'Elite Security Services' },
          },
          {
            id: '2',
            action: 'USER_REGISTERED',
            resource: 'User',
            userId: 'user-123',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            details: { role: 'GUARD', companyName: 'Guardian Protection Co.' },
          },
          {
            id: '3',
            action: 'SUBSCRIPTION_RENEWED',
            resource: 'Subscription',
            userId: 'company-456',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            details: { plan: 'PROFESSIONAL', amount: 299 },
          },
          {
            id: '4',
            action: 'COMPANY_SUSPENDED',
            resource: 'SecurityCompany',
            userId: 'admin-1',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            details: { companyName: 'SecureWatch Solutions', reason: 'Payment overdue' },
          },
        ],
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
    const response = await apiService.getRaw('/super-admin/companies', { params });
    return response.data;
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
    const response = await apiService.postRaw('/super-admin/companies', data);
    return response.data;
  }

  /**
   * Update security company
   */
  async updateSecurityCompany(companyId: string, data: Partial<SecurityCompany>): Promise<SecurityCompany> {
    const response = await apiService.putRaw(`/super-admin/companies/${companyId}`, data);
    return response.data;
  }

  /**
   * Toggle security company status (activate/suspend)
   */
  async toggleCompanyStatus(companyId: string, isActive: boolean): Promise<SecurityCompany> {
    const response = await apiService.patchRaw(`/super-admin/companies/${companyId}/status`, { isActive });
    return response.data;
  }

  async getCompanyById(companyId: string): Promise<SecurityCompany> {
    const response = await apiService.getRaw(`/super-admin/companies/${companyId}`);
    return response.data;
  }

  async deleteCompany(companyId: string): Promise<{ id: string }> {
    const response = await apiService.deleteRaw(`/super-admin/companies/${companyId}`);
    return response.data;
  }

  /**
   * Get platform analytics
   */
  async getPlatformAnalytics(params: {
    startDate?: string;
    endDate?: string;
    metricType?: string;
  } = {}): Promise<any> {
    // Mock analytics data
    return {
      analytics: {
        ACTIVE_GUARDS: [
          { metricValue: 780, timestamp: new Date().toISOString() },
          { metricValue: 765, timestamp: new Date(Date.now() - 86400000).toISOString() }
        ],
        REVENUE: [
          { metricValue: 125000, timestamp: new Date().toISOString() },
          { metricValue: 118000, timestamp: new Date(Date.now() - 86400000).toISOString() }
        ]
      },
      summary: {
        totalMetrics: 10,
        dateRange: params
      }
    };
  }

  /**
   * Get billing overview
   */
  async getBillingOverview(): Promise<BillingOverview> {
    // Mock billing data
    return {
      totalRevenue: 125000,
      monthlyRevenue: 15000,
      pendingPayments: {
        amount: 5000,
        count: 3
      },
      overduePayments: {
        amount: 2500,
        count: 2
      },
      recentTransactions: [
        {
          id: '1',
          amount: 1500,
          description: 'Monthly subscription - SecureGuard Solutions',
          status: 'PAID',
          createdAt: new Date().toISOString()
        }
      ]
    };
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
    // Mock audit logs
    const mockLogs: AuditLog[] = [
      {
        id: '1',
        action: 'CREATE_COMPANY',
        resource: 'SecurityCompany',
        resourceId: '1',
        timestamp: new Date().toISOString(),
        userId: 'admin-1'
      },
      {
        id: '2',
        action: 'UPDATE_SUBSCRIPTION',
        resource: 'Subscription',
        resourceId: '2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        userId: 'admin-1'
      }
    ];

    return {
      logs: mockLogs,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 50,
        total: mockLogs.length,
        pages: 1
      }
    };
  }

  /**
   * Get platform settings
   */
  async getPlatformSettings(): Promise<any> {
    // Mock platform settings
    return {
      GENERAL: {
        'platform.name': 'TRACSOSPRO',
        'platform.version': '1.0.0',
        'maintenance.mode': 'false'
      },
      SECURITY: {
        'auth.session.timeout': '1800',
        'password.min.length': '8',
        'mfa.enabled': 'true'
      },
      BILLING: {
        'trial.duration': '30',
        'payment.methods': 'stripe,paypal',
        'currency.default': 'USD'
      }
    };
  }

  /**
   * Update platform settings
   */
  async updatePlatformSettings(settings: any): Promise<{ success: boolean }> {
    // Mock update - always return success
    console.log('Updating platform settings:', settings);
    return { success: true };
  }
}

export default SuperAdminService;
export { SuperAdminService };
export const superAdminService = new SuperAdminService();
