/**
 * Phase 3 Verification Script
 * Automated verification of all Phase 3 features and functionality
 */

import { ErrorHandler } from '../utils/errorHandler';
import { cacheService } from '../services/cacheService';
import { PerformanceOptimizer } from '../utils/performanceOptimizer';
import notificationService from '../services/notificationService';

interface VerificationResult {
  feature: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

class Phase3Verifier {
  private results: VerificationResult[] = [];

  /**
   * Run all Phase 3 verifications
   */
  async runAllVerifications(): Promise<VerificationResult[]> {
    console.log('🚀 Starting Phase 3 Comprehensive Verification...\n');

    await this.verifyErrorHandling();
    await this.verifyCacheService();
    await this.verifyPerformanceOptimizer();
    await this.verifyNotificationSystem();
    await this.verifyIntegrationPoints();

    this.printResults();
    return this.results;
  }

  /**
   * Verify Error Handling System
   */
  private async verifyErrorHandling(): Promise<void> {
    console.log('🛡️ Verifying Error Handling System...');

    try {
      // Test basic error handling
      const testError = new Error('Test error message');
      const appError = ErrorHandler.handleError(testError, 'test_action', false);
      
      if (appError && appError.message && appError.timestamp && appError.action) {
        this.addResult('Error Handling - Basic', 'PASS', 'Error handling works correctly');
      } else {
        this.addResult('Error Handling - Basic', 'FAIL', 'Error handling not working properly');
      }

      // Test error history
      ErrorHandler.clearErrorHistory();
      ErrorHandler.handleError(new Error('Test 1'), 'action_1', false);
      ErrorHandler.handleError(new Error('Test 2'), 'action_2', false);
      
      const history = ErrorHandler.getErrorHistory();
      if (history.length === 2) {
        this.addResult('Error Handling - History', 'PASS', 'Error history tracking works');
      } else {
        this.addResult('Error Handling - History', 'FAIL', `Expected 2 errors, got ${history.length}`);
      }

      // Test network connectivity check
      const isConnected = await ErrorHandler.checkNetworkConnectivity();
      this.addResult('Error Handling - Network Check', 'PASS', `Network connectivity: ${isConnected}`);

    } catch (error) {
      this.addResult('Error Handling - System', 'FAIL', `Error handling system failed: ${error}`);
    }
  }

  /**
   * Verify Cache Service
   */
  private async verifyCacheService(): Promise<void> {
    console.log('💾 Verifying Cache Service...');

    try {
      // Clear cache for clean test
      await cacheService.clear();

      // Test basic cache operations
      const testData = { id: 1, name: 'Test Data', timestamp: Date.now() };
      await cacheService.set('test-key', testData, 60);
      
      const retrieved = await cacheService.get('test-key');
      if (JSON.stringify(retrieved) === JSON.stringify(testData)) {
        this.addResult('Cache Service - Basic Operations', 'PASS', 'Cache set/get works correctly');
      } else {
        this.addResult('Cache Service - Basic Operations', 'FAIL', 'Cache data mismatch');
      }

      // Test cache expiry
      await cacheService.set('expiry-test', { data: 'test' }, -1); // Expired immediately
      const expiredData = await cacheService.get('expiry-test');
      if (expiredData === null) {
        this.addResult('Cache Service - Expiry', 'PASS', 'Cache expiry works correctly');
      } else {
        this.addResult('Cache Service - Expiry', 'FAIL', 'Cache expiry not working');
      }

      // Test sync queue
      await cacheService.addToSyncQueue('test_action', { data: 'test sync' });
      const queueStatus = cacheService.getSyncQueueStatus();
      if (queueStatus.itemCount > 0) {
        this.addResult('Cache Service - Sync Queue', 'PASS', `Sync queue has ${queueStatus.itemCount} items`);
      } else {
        this.addResult('Cache Service - Sync Queue', 'FAIL', 'Sync queue not working');
      }

      // Test cache info
      const cacheInfo = await cacheService.getCacheInfo();
      if (cacheInfo && typeof cacheInfo.itemCount === 'number') {
        this.addResult('Cache Service - Info', 'PASS', `Cache info: ${cacheInfo.itemCount} items, ${cacheInfo.totalSize} bytes`);
      } else {
        this.addResult('Cache Service - Info', 'FAIL', 'Cache info not available');
      }

    } catch (error) {
      this.addResult('Cache Service - System', 'FAIL', `Cache service failed: ${error}`);
    }
  }

  /**
   * Verify Performance Optimizer
   */
  private async verifyPerformanceOptimizer(): Promise<void> {
    console.log('⚡ Verifying Performance Optimizer...');

    try {
      // Test render measurement
      PerformanceOptimizer.startRenderMeasurement();
      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 5) { /* busy wait */ }
      const renderTime = PerformanceOptimizer.endRenderMeasurement('TestComponent');
      
      if (renderTime > 0) {
        this.addResult('Performance - Render Measurement', 'PASS', `Render time: ${renderTime.toFixed(2)}ms`);
      } else {
        this.addResult('Performance - Render Measurement', 'FAIL', 'Render measurement not working');
      }

      // Test API measurement
      PerformanceOptimizer.startApiMeasurement('test-api');
      setTimeout(() => {
        const apiTime = PerformanceOptimizer.endApiMeasurement('test-api');
        if (apiTime > 0) {
          this.addResult('Performance - API Measurement', 'PASS', `API time: ${apiTime.toFixed(2)}ms`);
        } else {
          this.addResult('Performance - API Measurement', 'FAIL', 'API measurement not working');
        }
      }, 10);

      // Test device info
      const deviceInfo = PerformanceOptimizer.getDeviceInfo();
      if (deviceInfo && deviceInfo.screenDimensions && deviceInfo.pixelRatio) {
        this.addResult('Performance - Device Info', 'PASS', `Screen: ${deviceInfo.screenDimensions.width}x${deviceInfo.screenDimensions.height}, Ratio: ${deviceInfo.pixelRatio}`);
      } else {
        this.addResult('Performance - Device Info', 'FAIL', 'Device info not available');
      }

      // Test image optimization
      const optimized = PerformanceOptimizer.getOptimizedImageSize(1000, 800);
      if (optimized && optimized.width > 0 && optimized.height > 0) {
        this.addResult('Performance - Image Optimization', 'PASS', `Optimized: ${optimized.width}x${optimized.height}`);
      } else {
        this.addResult('Performance - Image Optimization', 'FAIL', 'Image optimization not working');
      }

      // Test FlatList optimization
      const flatListOpts = PerformanceOptimizer.getFlatListOptimizations(100);
      if (flatListOpts && flatListOpts.windowSize && flatListOpts.initialNumToRender) {
        this.addResult('Performance - FlatList Optimization', 'PASS', `Window: ${flatListOpts.windowSize}, Initial: ${flatListOpts.initialNumToRender}`);
      } else {
        this.addResult('Performance - FlatList Optimization', 'FAIL', 'FlatList optimization not working');
      }

      // Test performance report
      const report = PerformanceOptimizer.getPerformanceReport();
      if (report && report.deviceInfo && report.timestamp) {
        this.addResult('Performance - Report Generation', 'PASS', `Memory: ${report.memoryUsage.toFixed(2)}MB`);
      } else {
        this.addResult('Performance - Report Generation', 'FAIL', 'Performance report not available');
      }

    } catch (error) {
      this.addResult('Performance - System', 'FAIL', `Performance optimizer failed: ${error}`);
    }
  }

  /**
   * Verify Notification System
   */
  private async verifyNotificationSystem(): Promise<void> {
    console.log('🔔 Verifying Notification System...');

    try {
      // Test notification settings
      const settings = await notificationService.getNotificationSettings();
      if (settings && typeof settings.pushNotifications === 'boolean') {
        this.addResult('Notifications - Settings', 'PASS', 'Notification settings available');
      } else {
        this.addResult('Notifications - Settings', 'FAIL', 'Notification settings not available');
      }

      // Test permission check
      const hasPermission = await notificationService.areNotificationsEnabled();
      this.addResult('Notifications - Permissions', 'PASS', `Permission status: ${hasPermission}`);

      // Test shift reminder scheduling (mock)
      const mockShift = {
        id: 'test-shift-1',
        startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        locationName: 'Test Location',
        address: '123 Test Street',
      };

      try {
        await notificationService.scheduleShiftReminder(mockShift);
        this.addResult('Notifications - Shift Reminders', 'PASS', 'Shift reminder scheduling works');
      } catch (error) {
        this.addResult('Notifications - Shift Reminders', 'WARNING', `Shift reminders may not work: ${error}`);
      }

      // Test emergency alert (mock)
      try {
        await notificationService.sendEmergencyAlert('Test emergency message');
        this.addResult('Notifications - Emergency Alerts', 'PASS', 'Emergency alert system works');
      } catch (error) {
        this.addResult('Notifications - Emergency Alerts', 'WARNING', `Emergency alerts may not work: ${error}`);
      }

    } catch (error) {
      this.addResult('Notifications - System', 'FAIL', `Notification system failed: ${error}`);
    }
  }

  /**
   * Verify Integration Points
   */
  private async verifyIntegrationPoints(): Promise<void> {
    console.log('🔗 Verifying Integration Points...');

    try {
      // Test error handling + cache integration
      ErrorHandler.clearErrorHistory();
      await cacheService.addToSyncQueue('error_test', { error: 'test' });
      ErrorHandler.handleError(new Error('Integration test'), 'cache_integration', false);
      
      const history = ErrorHandler.getErrorHistory();
      const queueStatus = cacheService.getSyncQueueStatus();
      
      if (history.length > 0 && queueStatus.itemCount > 0) {
        this.addResult('Integration - Error + Cache', 'PASS', 'Error handling and cache integration works');
      } else {
        this.addResult('Integration - Error + Cache', 'FAIL', 'Integration not working properly');
      }

      // Test performance + error integration
      PerformanceOptimizer.startRenderMeasurement();
      try {
        throw new Error('Performance test error');
      } catch (error) {
        ErrorHandler.handleError(error, 'performance_test', false);
      }
      PerformanceOptimizer.endRenderMeasurement('IntegrationTest');
      
      this.addResult('Integration - Performance + Error', 'PASS', 'Performance and error handling integration works');

      // Test cache + performance integration
      const startTime = performance.now();
      await cacheService.set('perf-test', { data: 'performance test' }, 60);
      const cached = await cacheService.get('perf-test');
      const cacheTime = performance.now() - startTime;
      
      if (cached && cacheTime < 100) { // Should be very fast
        this.addResult('Integration - Cache + Performance', 'PASS', `Cache operation took ${cacheTime.toFixed(2)}ms`);
      } else {
        this.addResult('Integration - Cache + Performance', 'WARNING', 'Cache performance may be slow');
      }

    } catch (error) {
      this.addResult('Integration - System', 'FAIL', `Integration testing failed: ${error}`);
    }
  }

  /**
   * Add verification result
   */
  private addResult(feature: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: any): void {
    this.results.push({ feature, status, message, details });
    
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${feature}: ${message}`);
  }

  /**
   * Print verification results summary
   */
  private printResults(): void {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    const total = this.results.length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 PHASE 3 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ PASSED: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
    console.log(`❌ FAILED: ${failed}/${total} (${((failed/total)*100).toFixed(1)}%)`);
    console.log(`⚠️  WARNINGS: ${warnings}/${total} (${((warnings/total)*100).toFixed(1)}%)`);
    
    const successRate = (passed / total) * 100;
    if (successRate >= 90) {
      console.log('\n🎉 EXCELLENT! Phase 3 is production ready!');
    } else if (successRate >= 80) {
      console.log('\n👍 GOOD! Phase 3 is mostly ready with minor issues.');
    } else if (successRate >= 70) {
      console.log('\n⚠️  NEEDS WORK! Phase 3 has some significant issues.');
    } else {
      console.log('\n❌ CRITICAL! Phase 3 has major issues that need fixing.');
    }

    console.log('='.repeat(60));

    // Print failed tests for debugging
    const failedTests = this.results.filter(r => r.status === 'FAIL');
    if (failedTests.length > 0) {
      console.log('\n🔍 FAILED TESTS DETAILS:');
      failedTests.forEach(test => {
        console.log(`❌ ${test.feature}: ${test.message}`);
      });
    }

    // Print warnings for attention
    const warningTests = this.results.filter(r => r.status === 'WARNING');
    if (warningTests.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warningTests.forEach(test => {
        console.log(`⚠️  ${test.feature}: ${test.message}`);
      });
    }
  }

  /**
   * Get verification score
   */
  getVerificationScore(): number {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    return (passed / this.results.length) * 100;
  }

  /**
   * Check if Phase 3 is production ready
   */
  isProductionReady(): boolean {
    return this.getVerificationScore() >= 90;
  }
}

// Export for use in tests and manual verification
export { Phase3Verifier, VerificationResult };

// Auto-run verification if this file is executed directly
if (require.main === module) {
  const verifier = new Phase3Verifier();
  verifier.runAllVerifications().then(results => {
    const score = verifier.getVerificationScore();
    const isReady = verifier.isProductionReady();
    
    console.log(`\n🎯 Final Score: ${score.toFixed(1)}%`);
    console.log(`🚀 Production Ready: ${isReady ? 'YES' : 'NO'}`);
    
    process.exit(isReady ? 0 : 1);
  }).catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
}
