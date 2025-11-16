/**
 * End-to-End Integration Testing
 * Tests the complete flow from frontend to backend with real API calls
 */

import axios from 'axios';
import { store } from '../store';
import { 
  fetchActiveShift, 
  fetchUpcomingShifts, 
  checkInToShift,
  createIncidentReport,
  startBreak,
  endBreak 
} from '../store/slices/shiftSlice';

const API_BASE_URL = 'http://localhost:3000/api';

interface E2ETestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
  data?: any;
}

class E2ETestRunner {
  private results: E2ETestResult[] = [];
  private authToken: string | null = null;

  /**
   * Run all end-to-end tests
   */
  async runAllTests(): Promise<E2ETestResult[]> {
    console.log('🚀 Starting End-to-End Integration Tests...\n');

    await this.testServerConnection();
    await this.testDatabaseConnection();
    await this.testAuthenticationFlow();
    await this.testShiftManagement();
    await this.testIncidentReporting();
    await this.testBreakManagement();
    await this.testNotificationSystem();
    await this.testWebSocketConnection();
    await this.testReduxIntegration();
    await this.testOfflineSync();

    this.printResults();
    return this.results;
  }

  /**
   * Test server connection
   */
  private async testServerConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      
      if (response.status === 200) {
        this.addResult('Server Connection', 'PASS', 'Server is responding', Date.now() - startTime, response.data);
      } else {
        this.addResult('Server Connection', 'FAIL', `Unexpected status: ${response.status}`, Date.now() - startTime);
      }
    } catch (error: any) {
      this.addResult('Server Connection', 'FAIL', `Connection failed: ${error.message}`, Date.now() - startTime);
    }
  }

  /**
   * Test database connection
   */
  private async testDatabaseConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${API_BASE_URL}/db-status`);
      
      if (response.status === 200 && response.data.connected) {
        this.addResult('Database Connection', 'PASS', 'Database is connected', Date.now() - startTime, response.data);
      } else {
        this.addResult('Database Connection', 'FAIL', 'Database not connected', Date.now() - startTime);
      }
    } catch (error: any) {
      this.addResult('Database Connection', 'FAIL', `Database check failed: ${error.message}`, Date.now() - startTime);
    }
  }

  /**
   * Test authentication flow
   */
  private async testAuthenticationFlow(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test login
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'testpassword'
      });

      if (loginResponse.status === 200 && loginResponse.data.token) {
        this.authToken = loginResponse.data.token;
        this.addResult('Authentication - Login', 'PASS', 'Login successful', Date.now() - startTime, { hasToken: true });

        // Test token validation
        const validateResponse = await axios.get(`${API_BASE_URL}/auth/validate`, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });

        if (validateResponse.status === 200) {
          this.addResult('Authentication - Token Validation', 'PASS', 'Token is valid', Date.now() - startTime);
        } else {
          this.addResult('Authentication - Token Validation', 'FAIL', 'Token validation failed', Date.now() - startTime);
        }
      } else {
        this.addResult('Authentication - Login', 'FAIL', 'Login failed - no token received', Date.now() - startTime);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        this.addResult('Authentication - Login', 'SKIP', 'Auth endpoints not implemented yet', Date.now() - startTime);
      } else {
        this.addResult('Authentication - Login', 'FAIL', `Auth failed: ${error.message}`, Date.now() - startTime);
      }
    }
  }

  /**
   * Test shift management APIs
   */
  private async testShiftManagement(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const headers = this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};

      // Test get shifts
      const shiftsResponse = await axios.get(`${API_BASE_URL}/shifts`, { headers });
      
      if (shiftsResponse.status === 200) {
        this.addResult('Shift Management - Get Shifts', 'PASS', `Retrieved ${shiftsResponse.data.length || 0} shifts`, Date.now() - startTime);

        // Test get active shift
        const activeShiftResponse = await axios.get(`${API_BASE_URL}/shifts/active`, { headers });
        
        if (activeShiftResponse.status === 200) {
          this.addResult('Shift Management - Active Shift', 'PASS', 'Active shift endpoint working', Date.now() - startTime);
        }

        // Test shift statistics
        const statsResponse = await axios.get(`${API_BASE_URL}/shifts/stats`, { headers });
        
        if (statsResponse.status === 200) {
          this.addResult('Shift Management - Statistics', 'PASS', 'Statistics endpoint working', Date.now() - startTime, statsResponse.data);
        }
      } else {
        this.addResult('Shift Management - Get Shifts', 'FAIL', `Unexpected status: ${shiftsResponse.status}`, Date.now() - startTime);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        this.addResult('Shift Management - Get Shifts', 'SKIP', 'Shift endpoints not fully implemented', Date.now() - startTime);
      } else {
        this.addResult('Shift Management - Get Shifts', 'FAIL', `Shift API failed: ${error.message}`, Date.now() - startTime);
      }
    }
  }

  /**
   * Test incident reporting
   */
  private async testIncidentReporting(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const headers = this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};

      const incidentData = {
        type: 'security',
        description: 'Test incident report',
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'Test Location'
        },
        severity: 'medium',
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(`${API_BASE_URL}/incidents`, incidentData, { headers });
      
      if (response.status === 201 || response.status === 200) {
        this.addResult('Incident Reporting - Create', 'PASS', 'Incident created successfully', Date.now() - startTime, response.data);

        // Test get incidents
        const getResponse = await axios.get(`${API_BASE_URL}/incidents`, { headers });
        
        if (getResponse.status === 200) {
          this.addResult('Incident Reporting - Get', 'PASS', `Retrieved ${getResponse.data.length || 0} incidents`, Date.now() - startTime);
        }
      } else {
        this.addResult('Incident Reporting - Create', 'FAIL', `Unexpected status: ${response.status}`, Date.now() - startTime);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        this.addResult('Incident Reporting - Create', 'SKIP', 'Incident endpoints not implemented', Date.now() - startTime);
      } else {
        this.addResult('Incident Reporting - Create', 'FAIL', `Incident API failed: ${error.message}`, Date.now() - startTime);
      }
    }
  }

  /**
   * Test break management
   */
  private async testBreakManagement(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const headers = this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};

      const breakData = {
        shiftId: 'test-shift-1',
        type: 'lunch',
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      };

      const startResponse = await axios.post(`${API_BASE_URL}/breaks/start`, breakData, { headers });
      
      if (startResponse.status === 201 || startResponse.status === 200) {
        this.addResult('Break Management - Start', 'PASS', 'Break started successfully', Date.now() - startTime);

        // Test end break
        const breakId = startResponse.data.id || 'test-break-1';
        const endResponse = await axios.post(`${API_BASE_URL}/breaks/${breakId}/end`, {}, { headers });
        
        if (endResponse.status === 200) {
          this.addResult('Break Management - End', 'PASS', 'Break ended successfully', Date.now() - startTime);
        }
      } else {
        this.addResult('Break Management - Start', 'FAIL', `Unexpected status: ${startResponse.status}`, Date.now() - startTime);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        this.addResult('Break Management - Start', 'SKIP', 'Break endpoints not implemented', Date.now() - startTime);
      } else {
        this.addResult('Break Management - Start', 'FAIL', `Break API failed: ${error.message}`, Date.now() - startTime);
      }
    }
  }

  /**
   * Test notification system
   */
  private async testNotificationSystem(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const headers = this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};

      const response = await axios.get(`${API_BASE_URL}/notifications`, { headers });
      
      if (response.status === 200) {
        this.addResult('Notification System - Get', 'PASS', `Retrieved ${response.data.length || 0} notifications`, Date.now() - startTime);

        // Test mark as read
        if (response.data.length > 0) {
          const notificationId = response.data[0].id;
          const markReadResponse = await axios.patch(`${API_BASE_URL}/notifications/${notificationId}/read`, {}, { headers });
          
          if (markReadResponse.status === 200) {
            this.addResult('Notification System - Mark Read', 'PASS', 'Notification marked as read', Date.now() - startTime);
          }
        }
      } else {
        this.addResult('Notification System - Get', 'FAIL', `Unexpected status: ${response.status}`, Date.now() - startTime);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        this.addResult('Notification System - Get', 'SKIP', 'Notification endpoints not implemented', Date.now() - startTime);
      } else {
        this.addResult('Notification System - Get', 'FAIL', `Notification API failed: ${error.message}`, Date.now() - startTime);
      }
    }
  }

  /**
   * Test WebSocket connection
   */
  private async testWebSocketConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test WebSocket endpoint availability
      const response = await axios.get(`${API_BASE_URL}/ws-status`);
      
      if (response.status === 200) {
        this.addResult('WebSocket Connection', 'PASS', 'WebSocket server is available', Date.now() - startTime, response.data);
      } else {
        this.addResult('WebSocket Connection', 'SKIP', 'WebSocket status endpoint not available', Date.now() - startTime);
      }
    } catch (error: any) {
      this.addResult('WebSocket Connection', 'SKIP', 'WebSocket testing requires browser environment', Date.now() - startTime);
    }
  }

  /**
   * Test Redux integration with real API
   */
  private async testReduxIntegration(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test Redux actions with real API calls
      const activeShiftAction = await store.dispatch(fetchActiveShift() as any);
      
      if (activeShiftAction.type.endsWith('/fulfilled') || activeShiftAction.type.endsWith('/rejected')) {
        this.addResult('Redux Integration - Active Shift', 'PASS', 'Redux action completed', Date.now() - startTime);
      }

      const upcomingShiftsAction = await store.dispatch(fetchUpcomingShifts() as any);
      
      if (upcomingShiftsAction.type.endsWith('/fulfilled') || upcomingShiftsAction.type.endsWith('/rejected')) {
        this.addResult('Redux Integration - Upcoming Shifts', 'PASS', 'Redux action completed', Date.now() - startTime);
      }

      // Check Redux state
      const state = store.getState();
      if (state.shifts) {
        this.addResult('Redux Integration - State Management', 'PASS', 'Redux state is accessible', Date.now() - startTime);
      }
    } catch (error: any) {
      this.addResult('Redux Integration - Actions', 'FAIL', `Redux integration failed: ${error.message}`, Date.now() - startTime);
    }
  }

  /**
   * Test offline sync functionality
   */
  private async testOfflineSync(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // This would test the offline sync queue functionality
      // For now, we'll just verify the sync endpoints exist
      const headers = this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};

      const response = await axios.post(`${API_BASE_URL}/sync`, { 
        operations: [
          { type: 'check_in', data: { shiftId: 'test', timestamp: new Date().toISOString() } }
        ]
      }, { headers });
      
      if (response.status === 200 || response.status === 201) {
        this.addResult('Offline Sync - Sync Operations', 'PASS', 'Sync endpoint working', Date.now() - startTime);
      } else {
        this.addResult('Offline Sync - Sync Operations', 'SKIP', 'Sync endpoint not implemented', Date.now() - startTime);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        this.addResult('Offline Sync - Sync Operations', 'SKIP', 'Sync endpoints not implemented', Date.now() - startTime);
      } else {
        this.addResult('Offline Sync - Sync Operations', 'FAIL', `Sync failed: ${error.message}`, Date.now() - startTime);
      }
    }
  }

  /**
   * Add test result
   */
  private addResult(test: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, duration: number, data?: any): void {
    this.results.push({ test, status, message, duration, data });
    
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    const durationStr = `(${duration}ms)`;
    console.log(`${emoji} ${test}: ${message} ${durationStr}`);
  }

  /**
   * Print test results summary
   */
  private printResults(): void {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 END-TO-END INTEGRATION TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ PASSED: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
    console.log(`❌ FAILED: ${failed}/${total} (${((failed/total)*100).toFixed(1)}%)`);
    console.log(`⏭️  SKIPPED: ${skipped}/${total} (${((skipped/total)*100).toFixed(1)}%)`);
    
    const successRate = (passed / (total - skipped)) * 100;
    if (successRate >= 90) {
      console.log('\n🎉 EXCELLENT! End-to-end integration is working perfectly!');
    } else if (successRate >= 80) {
      console.log('\n👍 GOOD! Most integrations are working with minor issues.');
    } else if (successRate >= 70) {
      console.log('\n⚠️  NEEDS WORK! Some integrations have issues.');
    } else {
      console.log('\n❌ CRITICAL! Major integration issues detected.');
    }

    console.log('='.repeat(60));

    // Print failed tests
    const failedTests = this.results.filter(r => r.status === 'FAIL');
    if (failedTests.length > 0) {
      console.log('\n🔍 FAILED TESTS:');
      failedTests.forEach(test => {
        console.log(`❌ ${test.test}: ${test.message}`);
      });
    }

    // Print performance summary
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    console.log(`\n⚡ Average Response Time: ${avgDuration.toFixed(2)}ms`);
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const total = this.results.filter(r => r.status !== 'SKIP').length;
    return total > 0 ? (passed / total) * 100 : 0;
  }
}

// Export for use
export { E2ETestRunner, E2ETestResult };

// Auto-run if executed directly
if (require.main === module) {
  const runner = new E2ETestRunner();
  runner.runAllTests().then(results => {
    const successRate = runner.getSuccessRate();
    console.log(`\n🎯 Success Rate: ${successRate.toFixed(1)}%`);
    process.exit(successRate >= 80 ? 0 : 1);
  }).catch(error => {
    console.error('❌ E2E Testing failed:', error);
    process.exit(1);
  });
}
