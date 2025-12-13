/**
 * Admin Multi-Site and Multi-Guard Tracking Tests
 * Tests that admin can manage multiple sites and track all guards simultaneously
 */

// Mock dependencies - must be before imports
// Use a global to store the mock instance so it's accessible to both mock and tests
(global as any).__mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  },
};

jest.mock('axios', () => {
  const mockInstance = (global as any).__mockAxiosInstance;
  const axiosMock = {
    create: jest.fn(() => mockInstance),
  };
  
  return {
    __esModule: true,
    default: axiosMock,
    ...axiosMock,
  };
});

jest.mock('../../utils/security');
jest.mock('../../config/apiConfig', () => ({
  getApiBaseUrl: () => 'http://localhost:3000/api',
  getConfigInfo: () => ({
    isDev: true,
    apiUrl: 'http://localhost:3000/api',
    wsUrl: 'http://localhost:3000',
    platform: 'ios',
  }),
}));

// Import after mocks are set up
import apiService from '../api';
import operationsService from '../operationsService';
import { securityManager } from '../../utils/security';

describe('Admin Multi-Site and Multi-Guard Tracking', () => {
  const mockAdminUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    role: 'ADMIN',
    firstName: 'Admin',
    lastName: 'User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (securityManager.getTokens as jest.Mock).mockResolvedValue({
      accessToken: 'admin-token',
      refreshToken: 'admin-refresh-token',
    });
  });

  describe('Admin Multi-Site Management', () => {
    it('should retrieve multiple sites simultaneously', async () => {
      const mockSites = {
        success: true,
        data: {
          sites: [
            {
              id: 'site-1',
              name: 'Downtown Office',
              address: '123 Main St',
              isActive: true,
              client: {
                user: {
                  firstName: 'Client',
                  lastName: 'One',
                  email: 'client1@test.com',
                },
              },
            },
            {
              id: 'site-2',
              name: 'Warehouse District',
              address: '456 Industrial Blvd',
              isActive: true,
              client: {
                user: {
                  firstName: 'Client',
                  lastName: 'Two',
                  email: 'client2@test.com',
                },
              },
            },
            {
              id: 'site-3',
              name: 'Shopping Mall',
              address: '789 Commerce Ave',
              isActive: true,
              client: {
                user: {
                  firstName: 'Client',
                  lastName: 'Three',
                  email: 'client3@test.com',
                },
              },
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 3,
            pages: 1,
          },
        },
      };

      (global as any).__mockAxiosInstance.get.mockResolvedValue({ data: mockSites });

      const response = await apiService.getAdminSites({
        page: 1,
        limit: 20,
      });

      expect(response.success).toBe(true);
      expect(response.data.sites).toHaveLength(3);
      expect(response.data.sites[0].name).toBe('Downtown Office');
      expect(response.data.sites[1].name).toBe('Warehouse District');
      expect(response.data.sites[2].name).toBe('Shopping Mall');
      expect((global as any).__mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('/admin/sites')
      );
    });

    it('should filter sites by active status', async () => {
      const mockActiveSites = {
        success: true,
        data: {
          sites: [
            {
              id: 'site-1',
              name: 'Active Site 1',
              isActive: true,
            },
            {
              id: 'site-2',
              name: 'Active Site 2',
              isActive: true,
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            pages: 1,
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockActiveSites });

      const response = await apiService.getAdminSites({
        isActive: true,
      });

      expect(response.success).toBe(true);
      expect(response.data.sites).toHaveLength(2);
      expect(response.data.sites.every((site: any) => site.isActive)).toBe(true);
      expect((global as any).__mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('isActive=true')
      );
    });

    it('should search sites across multiple sites', async () => {
      const mockSearchResults = {
        success: true,
        data: {
          sites: [
            {
              id: 'site-1',
              name: 'Downtown Office',
              address: '123 Main St',
            },
            {
              id: 'site-4',
              name: 'Downtown Plaza',
              address: '321 Main St',
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            pages: 1,
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockSearchResults });

      const response = await apiService.getAdminSites({
        search: 'Downtown',
      });

      expect(response.success).toBe(true);
      expect(response.data.sites).toHaveLength(2);
      expect(
        response.data.sites.every((site: any) =>
          site.name.toLowerCase().includes('downtown')
        )
      ).toBe(true);
    });
  });

  describe('Admin Multi-Guard Tracking', () => {
    it('should retrieve all guards from multiple sites simultaneously', async () => {
      const mockGuardStatuses = {
        success: true,
        data: [
          {
            guardId: 'guard-1',
            guardName: 'John Doe',
            status: 'active',
            location: {
              latitude: 40.7128,
              longitude: -74.006,
              accuracy: 10,
              timestamp: Date.now(),
            },
            currentSite: 'Downtown Office',
            siteId: 'site-1',
            shiftStart: Date.now() - 3600000,
            lastUpdate: Date.now(),
          },
          {
            guardId: 'guard-2',
            guardName: 'Jane Smith',
            status: 'active',
            location: {
              latitude: 40.7589,
              longitude: -73.9851,
              accuracy: 15,
              timestamp: Date.now(),
            },
            currentSite: 'Warehouse District',
            siteId: 'site-2',
            shiftStart: Date.now() - 7200000,
            lastUpdate: Date.now(),
          },
          {
            guardId: 'guard-3',
            guardName: 'Bob Johnson',
            status: 'active',
            location: {
              latitude: 40.7505,
              longitude: -73.9934,
              accuracy: 12,
              timestamp: Date.now(),
            },
            currentSite: 'Shopping Mall',
            siteId: 'site-3',
            shiftStart: Date.now() - 5400000,
            lastUpdate: Date.now(),
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockGuardStatuses });

      const guardStatuses = await operationsService.getGuardStatuses();

      expect(guardStatuses).toHaveLength(3);
      expect(guardStatuses[0].guardName).toBe('John Doe');
      expect(guardStatuses[0].currentSite).toBe('Downtown Office');
      expect(guardStatuses[1].guardName).toBe('Jane Smith');
      expect(guardStatuses[1].currentSite).toBe('Warehouse District');
      expect(guardStatuses[2].guardName).toBe('Bob Johnson');
      expect(guardStatuses[2].currentSite).toBe('Shopping Mall');
      expect((global as any).__mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('/admin/operations/guards')
      );
    });

    it('should track guards from different sites on the same map', async () => {
      const mockGuardStatuses = {
        success: true,
        data: [
          {
            guardId: 'guard-1',
            guardName: 'John Doe',
            status: 'active',
            location: {
              latitude: 40.7128,
              longitude: -74.006,
              accuracy: 10,
              timestamp: Date.now(),
            },
            currentSite: 'Downtown Office',
            siteId: 'site-1',
            shiftStart: Date.now() - 3600000,
            lastUpdate: Date.now(),
          },
          {
            guardId: 'guard-2',
            guardName: 'Jane Smith',
            status: 'active',
            location: {
              latitude: 40.7589,
              longitude: -73.9851,
              accuracy: 15,
              timestamp: Date.now(),
            },
            currentSite: 'Warehouse District',
            siteId: 'site-2',
            shiftStart: Date.now() - 7200000,
            lastUpdate: Date.now(),
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockGuardStatuses });

      const guardStatuses = await operationsService.getGuardStatuses();

      // Verify all guards are returned
      expect(guardStatuses.length).toBeGreaterThanOrEqual(2);

      // Verify guards are from different sites
      const uniqueSites = new Set(
        guardStatuses.map((g) => g.currentSite)
      );
      expect(uniqueSites.size).toBeGreaterThanOrEqual(2);

      // Verify all guards have valid locations
      guardStatuses.forEach((guard) => {
        expect(guard.location.latitude).toBeDefined();
        expect(guard.location.longitude).toBeDefined();
        expect(guard.location.accuracy).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle guards with different statuses from multiple sites', async () => {
      const mockGuardStatuses = {
        success: true,
        data: [
          {
            guardId: 'guard-1',
            guardName: 'John Doe',
            status: 'active',
            location: {
              latitude: 40.7128,
              longitude: -74.006,
              accuracy: 10,
              timestamp: Date.now(),
            },
            currentSite: 'Downtown Office',
            siteId: 'site-1',
            shiftStart: Date.now() - 3600000,
            lastUpdate: Date.now(),
          },
          {
            guardId: 'guard-2',
            guardName: 'Jane Smith',
            status: 'on_break',
            location: {
              latitude: 40.7589,
              longitude: -73.9851,
              accuracy: 15,
              timestamp: Date.now(),
            },
            currentSite: 'Warehouse District',
            siteId: 'site-2',
            shiftStart: Date.now() - 7200000,
            lastUpdate: Date.now(),
          },
          {
            guardId: 'guard-3',
            guardName: 'Bob Johnson',
            status: 'offline',
            location: {
              latitude: 40.7505,
              longitude: -73.9934,
              accuracy: 12,
              timestamp: Date.now() - 300000, // 5 minutes ago
            },
            currentSite: 'Shopping Mall',
            siteId: 'site-3',
            shiftStart: Date.now() - 5400000,
            lastUpdate: Date.now() - 300000,
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockGuardStatuses });

      const guardStatuses = await operationsService.getGuardStatuses();

      expect(guardStatuses).toHaveLength(3);
      expect(guardStatuses[0].status).toBe('active');
      expect(guardStatuses[1].status).toBe('on_break');
      expect(guardStatuses[2].status).toBe('offline');

      // Verify all guards are tracked regardless of status
      guardStatuses.forEach((guard) => {
        expect(guard.guardId).toBeDefined();
        expect(guard.guardName).toBeDefined();
        expect(guard.location).toBeDefined();
      });
    });
  });

  describe('Admin Operations Center - Simultaneous Tracking', () => {
    it('should get operations metrics for all sites and guards', async () => {
      const mockMetrics = {
        success: true,
        data: {
          totalGuards: 10,
          activeGuards: 7,
          guardsOnBreak: 1,
          offlineGuards: 2,
          emergencyAlerts: 0,
          siteCoverage: 85.5,
          averageResponseTime: 12.3,
          incidentsToday: 3,
        },
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockMetrics });

      const metrics = await operationsService.getOperationsMetrics();

      expect(metrics.totalGuards).toBe(10);
      expect(metrics.activeGuards).toBe(7);
      expect(metrics.siteCoverage).toBe(85.5);
      expect((global as any).__mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('/admin/operations/metrics')
      );
    });

    it('should track all guards simultaneously in real-time', async () => {
      const mockRealTimeData = {
        success: true,
        data: [
          {
            guard: {
              id: 'guard-1',
              employeeId: 'EMP001',
              name: 'John Doe',
              status: 'ON_DUTY',
            },
            location: {
              id: 'loc-1',
              guardId: 'guard-1',
              latitude: 40.7128,
              longitude: -74.006,
              accuracy: 10,
              timestamp: new Date(),
            },
            currentShift: {
              id: 'shift-1',
              siteId: 'site-1',
              status: 'IN_PROGRESS',
            },
            lastUpdate: new Date(),
          },
          {
            guard: {
              id: 'guard-2',
              employeeId: 'EMP002',
              name: 'Jane Smith',
              status: 'ON_DUTY',
            },
            location: {
              id: 'loc-2',
              guardId: 'guard-2',
              latitude: 40.7589,
              longitude: -73.9851,
              accuracy: 15,
              timestamp: new Date(),
            },
            currentShift: {
              id: 'shift-2',
              siteId: 'site-2',
              status: 'IN_PROGRESS',
            },
            lastUpdate: new Date(),
          },
          {
            guard: {
              id: 'guard-3',
              employeeId: 'EMP003',
              name: 'Bob Johnson',
              status: 'ACTIVE',
            },
            location: {
              id: 'loc-3',
              guardId: 'guard-3',
              latitude: 40.7505,
              longitude: -73.9934,
              accuracy: 12,
              timestamp: new Date(),
            },
            currentShift: {
              id: 'shift-3',
              siteId: 'site-3',
              status: 'IN_PROGRESS',
            },
            lastUpdate: new Date(),
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockRealTimeData });

      const realTimeData = await operationsService.getRealTimeLocationData();

      expect(realTimeData).toHaveLength(3);
      expect(realTimeData[0].guard.name).toBe('John Doe');
      expect(realTimeData[1].guard.name).toBe('Jane Smith');
      expect(realTimeData[2].guard.name).toBe('Bob Johnson');

      // Verify all guards have location data
      realTimeData.forEach((data) => {
        expect(data.location).toBeDefined();
        expect(data.location.latitude).toBeDefined();
        expect(data.location.longitude).toBeDefined();
        expect(data.guard).toBeDefined();
      });

      expect((global as any).__mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('/tracking/realtime')
      );
    });

    it('should handle multiple guards updating locations simultaneously', async () => {
      const firstUpdate = {
        success: true,
        data: [
          {
            guardId: 'guard-1',
            guardName: 'John Doe',
            status: 'active',
            location: {
              latitude: 40.7128,
              longitude: -74.006,
              accuracy: 10,
              timestamp: Date.now(),
            },
            currentSite: 'Downtown Office',
            lastUpdate: Date.now(),
          },
          {
            guardId: 'guard-2',
            guardName: 'Jane Smith',
            status: 'active',
            location: {
              latitude: 40.7589,
              longitude: -73.9851,
              accuracy: 15,
              timestamp: Date.now(),
            },
            currentSite: 'Warehouse District',
            lastUpdate: Date.now(),
          },
        ],
      };

      const secondUpdate = {
        success: true,
        data: [
          {
            guardId: 'guard-1',
            guardName: 'John Doe',
            status: 'active',
            location: {
              latitude: 40.7130, // Slightly moved
              longitude: -74.0062,
              accuracy: 10,
              timestamp: Date.now() + 30000,
            },
            currentSite: 'Downtown Office',
            lastUpdate: Date.now() + 30000,
          },
          {
            guardId: 'guard-2',
            guardName: 'Jane Smith',
            status: 'active',
            location: {
              latitude: 40.7591, // Slightly moved
              longitude: -73.9853,
              accuracy: 15,
              timestamp: Date.now() + 30000,
            },
            currentSite: 'Warehouse District',
            lastUpdate: Date.now() + 30000,
          },
        ],
      };

      // First call
      (global as any).__mockAxiosInstance.get.mockResolvedValueOnce({ data: firstUpdate });
      const firstStatuses = await operationsService.getGuardStatuses();
      expect(firstStatuses).toHaveLength(2);

      // Second call (simulating real-time update)
      (global as any).__mockAxiosInstance.get.mockResolvedValueOnce({ data: secondUpdate });
      const secondStatuses = await operationsService.getGuardStatuses();
      expect(secondStatuses).toHaveLength(2);

      // Verify locations updated
      expect(secondStatuses[0].location.latitude).not.toBe(
        firstStatuses[0].location.latitude
      );
      expect(secondStatuses[1].location.latitude).not.toBe(
        firstStatuses[1].location.latitude
      );
    });
  });

  describe('Admin Multi-Site Guard Assignment Tracking', () => {
    it('should track guards assigned to different sites simultaneously', async () => {
      const mockGuardStatuses = {
        success: true,
        data: [
          {
            guardId: 'guard-1',
            guardName: 'John Doe',
            status: 'active',
            location: {
              latitude: 40.7128,
              longitude: -74.006,
              accuracy: 10,
              timestamp: Date.now(),
            },
            currentSite: 'Downtown Office',
            siteId: 'site-1',
            shiftStart: Date.now() - 3600000,
            lastUpdate: Date.now(),
          },
          {
            guardId: 'guard-2',
            guardName: 'Jane Smith',
            status: 'active',
            location: {
              latitude: 40.7589,
              longitude: -73.9851,
              accuracy: 15,
              timestamp: Date.now(),
            },
            currentSite: 'Warehouse District',
            siteId: 'site-2',
            shiftStart: Date.now() - 7200000,
            lastUpdate: Date.now(),
          },
          {
            guardId: 'guard-3',
            guardName: 'Bob Johnson',
            status: 'active',
            location: {
              latitude: 40.7505,
              longitude: -73.9934,
              accuracy: 12,
              timestamp: Date.now(),
            },
            currentSite: 'Shopping Mall',
            siteId: 'site-3',
            shiftStart: Date.now() - 5400000,
            lastUpdate: Date.now(),
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockGuardStatuses });

      const guardStatuses = await operationsService.getGuardStatuses();

      // Group guards by site
      const guardsBySite = guardStatuses.reduce((acc, guard) => {
        const site = guard.currentSite;
        if (!acc[site]) {
          acc[site] = [];
        }
        acc[site].push(guard);
        return acc;
      }, {} as Record<string, typeof guardStatuses>);

      // Verify guards are distributed across multiple sites
      const siteCount = Object.keys(guardsBySite).length;
      expect(siteCount).toBeGreaterThanOrEqual(3);

      // Verify each site has at least one guard
      Object.values(guardsBySite).forEach((guards) => {
        expect(guards.length).toBeGreaterThan(0);
      });
    });

    it('should handle empty guard list gracefully', async () => {
      const mockEmptyResponse = {
        success: true,
        data: [],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockEmptyResponse });

      const guardStatuses = await operationsService.getGuardStatuses();

      expect(guardStatuses).toEqual([]);
      expect(Array.isArray(guardStatuses)).toBe(true);
    });

    it('should handle API errors when fetching multiple guards', async () => {
      (global as any).__mockAxiosInstance.get.mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      });

      const guardStatuses = await operationsService.getGuardStatuses();

      // Should return empty array on error (as per service implementation)
      expect(guardStatuses).toEqual([]);
    });
  });
});
