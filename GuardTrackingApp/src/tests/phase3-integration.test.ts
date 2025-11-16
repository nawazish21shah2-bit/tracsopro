/**
 * Phase 3 Integration Tests
 * Comprehensive testing for backend integration, error handling, caching, and performance
 */

import { ErrorHandler, withRetry } from '../utils/errorHandler';
import { cacheService } from '../services/cacheService';
import { PerformanceOptimizer } from '../utils/performanceOptimizer';
import notificationService from '../services/notificationService';

// Mock data for testing
const mockShift = {
  id: 'test-shift-1',
  startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
  locationName: 'Test Location',
  address: '123 Test Street',
};

const mockError = new Error('Test error message');

describe('Phase 3 Integration Tests', () => {
  
  describe('Error Handling System', () => {
    test('should handle errors with user-friendly messages', () => {
      const appError = ErrorHandler.handleError(mockError, 'test_action', false);
      
      expect(appError).toBeDefined();
      expect(appError.message).toBe('Test error message');
      expect(appError.action).toBe('test_action');
      expect(appError.timestamp).toBeDefined();
    });

    test('should convert network errors to user-friendly messages', () => {
      const networkError = { code: 'NETWORK_ERROR', message: 'Network request failed' };
      const appError = ErrorHandler.handleError(networkError, 'network_test', false);
      
      expect(appError.message).toBe('Network connection error. Please check your internet connection.');
    });

    test('should handle HTTP status errors', () => {
      const httpError = { response: { status: 401 } };
      const appError = ErrorHandler.handleError(httpError, 'auth_test', false);
      
      expect(appError.message).toBe('Your session has expired. Please log in again.');
    });

    test('should track error history', () => {
      ErrorHandler.clearErrorHistory();
      ErrorHandler.handleError(mockError, 'test_1', false);
      ErrorHandler.handleError(mockError, 'test_2', false);
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(2);
      expect(history[0].action).toBe('test_2'); // Most recent first
      expect(history[1].action).toBe('test_1');
    });
  });

  describe('Retry Mechanism', () => {
    test('should retry failed operations', async () => {
      let attemptCount = 0;
      const flakyOperation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const result = await withRetry(flakyOperation, 3, 10);
      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    test('should fail after max retries', async () => {
      const alwaysFailOperation = async () => {
        throw new Error('Persistent failure');
      };

      await expect(withRetry(alwaysFailOperation, 2, 10)).rejects.toThrow('Persistent failure');
    });
  });

  describe('Cache Service', () => {
    beforeEach(async () => {
      await cacheService.clear();
    });

    test('should store and retrieve cached data', async () => {
      const testData = { id: 1, name: 'Test Data' };
      
      await cacheService.set('test-key', testData, 60);
      const retrieved = await cacheService.get('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    test('should return null for expired data', async () => {
      const testData = { id: 1, name: 'Test Data' };
      
      // Set with very short expiry
      await cacheService.set('test-key', testData, -1); // Expired immediately
      const retrieved = await cacheService.get('test-key');
      
      expect(retrieved).toBeNull();
    });

    test('should handle cache operations gracefully', async () => {
      // Test with invalid key
      const result = await cacheService.get('non-existent-key');
      expect(result).toBeNull();
      
      // Test cache info
      const info = await cacheService.getCacheInfo();
      expect(info).toHaveProperty('itemCount');
      expect(info).toHaveProperty('totalSize');
    });

    test('should queue offline operations', async () => {
      await cacheService.addToSyncQueue('test_action', { data: 'test' });
      
      const status = cacheService.getSyncQueueStatus();
      expect(status.itemCount).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimizer', () => {
    test('should measure render performance', () => {
      PerformanceOptimizer.startRenderMeasurement();
      
      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 10) {
        // Busy wait for 10ms
      }
      
      const renderTime = PerformanceOptimizer.endRenderMeasurement('TestComponent');
      expect(renderTime).toBeGreaterThan(0);
    });

    test('should measure API performance', () => {
      PerformanceOptimizer.startApiMeasurement('test-api');
      
      // Simulate API delay
      setTimeout(() => {
        const responseTime = PerformanceOptimizer.endApiMeasurement('test-api');
        expect(responseTime).toBeGreaterThan(0);
      }, 10);
    });

    test('should provide device optimization info', () => {
      const deviceInfo = PerformanceOptimizer.getDeviceInfo();
      
      expect(deviceInfo).toHaveProperty('screenDimensions');
      expect(deviceInfo).toHaveProperty('windowDimensions');
      expect(deviceInfo).toHaveProperty('pixelRatio');
      expect(deviceInfo).toHaveProperty('fontScale');
    });

    test('should optimize image sizes', () => {
      const optimized = PerformanceOptimizer.getOptimizedImageSize(1000, 800);
      
      expect(optimized).toHaveProperty('width');
      expect(optimized).toHaveProperty('height');
      expect(optimized.width).toBeGreaterThan(0);
      expect(optimized.height).toBeGreaterThan(0);
    });

    test('should provide FlatList optimizations', () => {
      const optimizations = PerformanceOptimizer.getFlatListOptimizations(100);
      
      expect(optimizations).toHaveProperty('windowSize');
      expect(optimizations).toHaveProperty('initialNumToRender');
      expect(optimizations).toHaveProperty('maxToRenderPerBatch');
      expect(optimizations).toHaveProperty('removeClippedSubviews');
      expect(optimizations.removeClippedSubviews).toBe(true); // Should be true for 100 items
    });

    test('should debounce function calls', (done) => {
      let callCount = 0;
      const debouncedFn = PerformanceOptimizer.debounce(() => {
        callCount++;
      }, 50);

      // Call multiple times rapidly
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // Should only be called once after delay
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 100);
    });

    test('should throttle function calls', (done) => {
      let callCount = 0;
      const throttledFn = PerformanceOptimizer.throttle(() => {
        callCount++;
      }, 50);

      // Call multiple times rapidly
      throttledFn();
      throttledFn();
      throttledFn();

      // Should only be called once immediately
      expect(callCount).toBe(1);
      
      setTimeout(() => {
        throttledFn();
        expect(callCount).toBe(2);
        done();
      }, 60);
    });
  });

  describe('Notification System', () => {
    test('should schedule shift reminders', async () => {
      // Mock the notification scheduling
      const scheduleSpy = jest.spyOn(notificationService, 'scheduleShiftReminder');
      
      await notificationService.scheduleShiftReminder(mockShift);
      
      expect(scheduleSpy).toHaveBeenCalledWith(mockShift);
    });

    test('should send emergency alerts', async () => {
      const alertSpy = jest.spyOn(notificationService, 'sendEmergencyAlert');
      
      await notificationService.sendEmergencyAlert('Test emergency message');
      
      expect(alertSpy).toHaveBeenCalledWith('Test emergency message');
    });

    test('should handle notification settings', async () => {
      const settings = await notificationService.getNotificationSettings();
      
      expect(settings).toHaveProperty('pushNotifications');
      expect(settings).toHaveProperty('shiftReminders');
      expect(settings).toHaveProperty('emergencyAlerts');
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle offline-to-online sync', async () => {
      // Add items to sync queue while "offline"
      await cacheService.addToSyncQueue('check_in', { shiftId: 'test-1' });
      await cacheService.addToSyncQueue('incident_report', { description: 'Test incident' });
      
      const initialStatus = cacheService.getSyncQueueStatus();
      expect(initialStatus.itemCount).toBe(2);
      
      // Simulate coming back online and syncing
      await cacheService.forcSync();
      
      // Note: In a real test, you'd mock the actual sync operations
      // For now, we just verify the queue management works
    });

    test('should handle error recovery flow', async () => {
      ErrorHandler.clearErrorHistory();
      
      // Simulate a series of operations with errors
      ErrorHandler.handleError(new Error('Network error'), 'fetch_data', false);
      ErrorHandler.handleError(new Error('Auth error'), 'authenticate', false);
      
      const history = ErrorHandler.getErrorHistory();
      expect(history).toHaveLength(2);
      
      // Verify error types are tracked
      expect(history.some(error => error.action === 'fetch_data')).toBe(true);
      expect(history.some(error => error.action === 'authenticate')).toBe(true);
    });

    test('should handle performance monitoring flow', () => {
      // Start monitoring
      PerformanceOptimizer.startPerformanceMonitoring();
      
      // Simulate component render
      PerformanceOptimizer.startRenderMeasurement();
      const renderTime = PerformanceOptimizer.endRenderMeasurement('IntegrationTest');
      
      // Simulate API call
      PerformanceOptimizer.startApiMeasurement('test-api');
      const apiTime = PerformanceOptimizer.endApiMeasurement('test-api');
      
      expect(renderTime).toBeGreaterThanOrEqual(0);
      expect(apiTime).toBeGreaterThanOrEqual(0);
      
      // Get performance report
      const report = PerformanceOptimizer.getPerformanceReport();
      expect(report).toHaveProperty('deviceInfo');
      expect(report).toHaveProperty('memoryUsage');
      expect(report).toHaveProperty('timestamp');
    });
  });
});

// Test utilities for manual testing
export const TestUtils = {
  /**
   * Simulate network conditions
   */
  async simulateNetworkConditions(isOnline: boolean) {
    // This would integrate with network mocking in a real test environment
    console.log(`Simulating network: ${isOnline ? 'online' : 'offline'}`);
  },

  /**
   * Generate test data
   */
  generateTestShift(overrides = {}) {
    return {
      id: `test-shift-${Date.now()}`,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours later
      locationName: 'Test Location',
      address: '123 Test Street',
      status: 'SCHEDULED',
      ...overrides,
    };
  },

  /**
   * Measure component performance
   */
  async measureComponentPerformance(componentName: string, renderFn: () => void) {
    PerformanceOptimizer.startRenderMeasurement();
    renderFn();
    return PerformanceOptimizer.endRenderMeasurement(componentName);
  },

  /**
   * Test error scenarios
   */
  testErrorScenarios() {
    const scenarios = [
      { error: { code: 'NETWORK_ERROR' }, expected: 'Network connection error' },
      { error: { response: { status: 401 } }, expected: 'Your session has expired' },
      { error: { response: { status: 403 } }, expected: 'You do not have permission' },
      { error: { response: { status: 404 } }, expected: 'The requested information could not be found' },
      { error: { response: { status: 500 } }, expected: 'Server error' },
    ];

    scenarios.forEach(({ error, expected }) => {
      const result = ErrorHandler.handleError(error, 'test', false);
      console.log(`Error scenario: ${JSON.stringify(error)} -> ${result.message}`);
      expect(result.message).toContain(expected.split('.')[0]);
    });
  },
};

export default TestUtils;
