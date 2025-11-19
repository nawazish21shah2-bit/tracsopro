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
  static async getSecurityCompanies(params: {
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
      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      // Fallback to mock data
      const mockCompanies: SecurityCompany[] = [
        {
          id: '1',
          name: 'SecureGuard Solutions',
          email: 'admin@secureguard.com',
          phone: '+1-555-0123',
          address: '123 Security St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          subscriptionPlan: 'PROFESSIONAL',
          subscriptionStatus: 'ACTIVE',
          subscriptionStartDate: '2024-01-01',
          maxGuards: 50,
          maxClients: 20,
          maxSites: 30,
          isActive: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          _count: {
            users: 45,
            guards: 42,
            clients: 18,
            sites: 25,
          },
        },
        {
          id: '2',
          name: 'Elite Protection Services',
          email: 'contact@eliteprotection.com',
          phone: '+1-555-0456',
          address: '456 Guard Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA',
          subscriptionPlan: 'ENTERPRISE',
          subscriptionStatus: 'ACTIVE',
          subscriptionStartDate: '2024-02-01',
          maxGuards: 100,
          maxClients: 50,
          maxSites: 75,
          isActive: true,
          createdAt: '2024-02-01',
          updatedAt: '2024-02-01',
          _count: {
            users: 85,
            guards: 78,
            clients: 35,
            sites: 42,
          },
        },
      ];

      return {
        companies: mockCompanies,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 10,
          total: mockCompanies.length,
          pages: 1,
        },
      };
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
  }): Promise<SecurityCompany> {
    // Mock implementation
    const newCompany: SecurityCompany = {
      id: Date.now().toString(),
      ...data,
      subscriptionStatus: 'TRIAL',
      subscriptionStartDate: new Date().toISOString(),
      maxGuards: data.maxGuards || 10,
      maxClients: data.maxClients || 5,
      maxSites: data.maxSites || 10,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: {
        users: 0,
        guards: 0,
        clients: 0,
        sites: 0
      }
    };
    return newCompany;
  }

  /**
   * Update security company
   */
  async updateSecurityCompany(companyId: string, data: Partial<SecurityCompany>): Promise<SecurityCompany> {
    // Mock implementation
    const updatedCompany: SecurityCompany = {
      id: companyId,
      name: data.name || 'Updated Company',
      email: data.email || 'updated@company.com',
      subscriptionPlan: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
      subscriptionStartDate: '2024-01-01',
      maxGuards: 50,
      maxClients: 20,
      maxSites: 30,
      isActive: true,
      createdAt: '2024-01-01',
      updatedAt: new Date().toISOString(),
      ...data
    };
    return updatedCompany;
  }

  /**
   * Toggle security company status (activate/suspend)
   */
  async toggleCompanyStatus(companyId: string, isActive: boolean): Promise<SecurityCompany> {
    // Mock implementation
    const company: SecurityCompany = {
      id: companyId,
      name: 'Sample Company',
      email: 'sample@company.com',
      subscriptionPlan: 'PROFESSIONAL',
      subscriptionStatus: isActive ? 'ACTIVE' : 'SUSPENDED',
      subscriptionStartDate: '2024-01-01',
      maxGuards: 50,
      maxClients: 20,
      maxSites: 30,
      isActive,
      createdAt: '2024-01-01',
      updatedAt: new Date().toISOString()
    };
    return company;
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
