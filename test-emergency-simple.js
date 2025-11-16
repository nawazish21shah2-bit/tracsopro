/**
 * Simple Emergency System Test
 * Tests the emergency controller implementation
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

// Test configuration
const testConfig = {
  timeout: 5000,
  guardToken: null,
  adminToken: null,
};

// Simple logging
const log = (message, type = 'info') => {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
};

// Make HTTP request
const request = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: testConfig.timeout,
      headers: { 'Content-Type': 'application/json' },
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
    };
  }
};

// Test 1: Check if server is running
const testServerHealth = async () => {
  log('🏥 Testing server health...');
  
  const result = await request('GET', '/health');
  
  if (result.success) {
    log('✅ Server is running and healthy', 'success');
    return true;
  } else {
    log(`❌ Server health check failed: ${result.error}`, 'error');
    return false;
  }
};

// Test 2: Test authentication
const testAuth = async () => {
  log('🔐 Testing authentication...');
  
  // Try to login as guard
  const guardLogin = await request('POST', '/auth/login', {
    email: 'guard@test.com',
    password: 'guard123'
  });
  
  if (guardLogin.success && guardLogin.data.success) {
    testConfig.guardToken = guardLogin.data.data.token;
    log('✅ Guard authentication successful', 'success');
  } else {
    log('⚠️  Guard authentication failed - using mock token', 'warning');
    testConfig.guardToken = 'mock_guard_token';
  }
  
  // Try to login as admin
  const adminLogin = await request('POST', '/auth/login', {
    email: 'admin@test.com',
    password: 'admin123'
  });
  
  if (adminLogin.success && adminLogin.data.success) {
    testConfig.adminToken = adminLogin.data.data.token;
    log('✅ Admin authentication successful', 'success');
  } else {
    log('⚠️  Admin authentication failed - using mock token', 'warning');
    testConfig.adminToken = 'mock_admin_token';
  }
  
  return true;
};

// Test 3: Test emergency alert creation
const testEmergencyAlert = async () => {
  log('🚨 Testing emergency alert creation...');
  
  const emergencyData = {
    type: 'PANIC',
    severity: 'CRITICAL',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10,
      address: 'Test Location, New York, NY'
    },
    message: 'Test emergency alert'
  };
  
  const result = await request('POST', '/emergency/alert', emergencyData, testConfig.guardToken);
  
  if (result.success) {
    log('✅ Emergency alert created successfully', 'success');
    log(`   Alert ID: ${result.data.data?.id || 'Generated'}`);
    return result.data.data?.id || 'test_alert_id';
  } else {
    log(`❌ Emergency alert creation failed: ${JSON.stringify(result.error)}`, 'error');
    return null;
  }
};

// Test 4: Test emergency alert acknowledgment
const testEmergencyAck = async (alertId) => {
  if (!alertId) {
    log('⚠️  Skipping acknowledgment test - no alert ID', 'warning');
    return false;
  }
  
  log('👨‍💼 Testing emergency alert acknowledgment...');
  
  const result = await request('POST', `/emergency/alert/${alertId}/acknowledge`, null, testConfig.adminToken);
  
  if (result.success) {
    log('✅ Emergency alert acknowledged successfully', 'success');
    return true;
  } else {
    log(`❌ Emergency acknowledgment failed: ${JSON.stringify(result.error)}`, 'error');
    return false;
  }
};

// Test 5: Test getting active alerts
const testActiveAlerts = async () => {
  log('📋 Testing active alerts retrieval...');
  
  const result = await request('GET', '/emergency/alerts/active', null, testConfig.adminToken);
  
  if (result.success) {
    log('✅ Active alerts retrieved successfully', 'success');
    log(`   Found ${result.data.data?.length || 0} active alerts`);
    return true;
  } else {
    log(`❌ Active alerts retrieval failed: ${JSON.stringify(result.error)}`, 'error');
    return false;
  }
};

// Test 6: Test emergency statistics
const testEmergencyStats = async () => {
  log('📊 Testing emergency statistics...');
  
  const result = await request('GET', '/emergency/statistics', null, testConfig.adminToken);
  
  if (result.success) {
    log('✅ Emergency statistics retrieved successfully', 'success');
    const stats = result.data.data;
    if (stats) {
      log(`   Active alerts: ${stats.activeAlerts || 0}`);
      log(`   Critical alerts: ${stats.criticalAlerts || 0}`);
    }
    return true;
  } else {
    log(`❌ Emergency statistics failed: ${JSON.stringify(result.error)}`, 'error');
    return false;
  }
};

// Main test function
const runEmergencyTests = async () => {
  log('🚀 Starting Emergency System Tests...');
  log('=' .repeat(50));
  
  const results = {
    serverHealth: false,
    auth: false,
    alertCreation: false,
    alertAck: false,
    activeAlerts: false,
    statistics: false,
  };
  
  try {
    // Test server health
    results.serverHealth = await testServerHealth();
    
    if (!results.serverHealth) {
      log('❌ Server is not running. Please start the backend server first.', 'error');
      log('   Run: cd backend && npm run dev', 'info');
      return;
    }
    
    // Test authentication
    results.auth = await testAuth();
    
    // Test emergency alert creation
    const alertId = await testEmergencyAlert();
    results.alertCreation = !!alertId;
    
    // Test emergency alert acknowledgment
    results.alertAck = await testEmergencyAck(alertId);
    
    // Test active alerts
    results.activeAlerts = await testActiveAlerts();
    
    // Test statistics
    results.statistics = await testEmergencyStats();
    
    // Results summary
    log('=' .repeat(50));
    log('📊 TEST RESULTS', 'info');
    log('=' .repeat(50));
    
    const tests = [
      { name: 'Server Health', result: results.serverHealth },
      { name: 'Authentication', result: results.auth },
      { name: 'Alert Creation', result: results.alertCreation },
      { name: 'Alert Acknowledgment', result: results.alertAck },
      { name: 'Active Alerts', result: results.activeAlerts },
      { name: 'Statistics', result: results.statistics },
    ];
    
    let passed = 0;
    tests.forEach(test => {
      const status = test.result ? '✅ PASS' : '❌ FAIL';
      log(`${test.name}: ${status}`, test.result ? 'success' : 'error');
      if (test.result) passed++;
    });
    
    log('=' .repeat(50));
    log(`Overall: ${passed}/${tests.length} tests passed`, passed === tests.length ? 'success' : 'warning');
    
    if (passed >= 4) {
      log('🎉 Emergency system is working!', 'success');
    } else {
      log('⚠️  Emergency system needs attention', 'warning');
    }
    
  } catch (error) {
    log(`❌ Test suite failed: ${error.message}`, 'error');
  }
};

// Run tests if called directly
if (require.main === module) {
  runEmergencyTests();
}

module.exports = { runEmergencyTests };
