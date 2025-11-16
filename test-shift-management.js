// Comprehensive Shift Management System Test (Phase 2)
const axios = require('axios');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Test data
const testGuard = {
  email: 'guard@test.com',
  password: 'password123'
};

const testClient = {
  email: 'client@test.com',
  password: 'password123'
};

let guardToken = null;
let clientToken = null;
let guardUserId = null;
let actualGuardId = null;
let testShiftId = null;
let testBreakId = null;
let guardSocket = null;
let clientSocket = null;

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}${message ? ' - ' + message : ''}`);
  
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

function logSection(title) {
  console.log(`\n🔍 ${title}`);
  console.log('='.repeat(50));
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Health Check
async function testHealthCheck() {
  try {
    const response = await axios.get(`${API_URL}/health`);
    logTest('Health Check', response.status === 200 && response.data.success);
    return response.data.success;
  } catch (error) {
    logTest('Health Check', false, error.message);
    return false;
  }
}

// Test 2: Authentication
async function testAuthentication() {
  try {
    // Login guard
    const guardLoginResponse = await axios.post(`${API_URL}/auth/login`, testGuard);
    logTest('Guard Login', guardLoginResponse.status === 200);
    
    if (guardLoginResponse.data.success) {
      guardToken = guardLoginResponse.data.data.token;
      guardUserId = guardLoginResponse.data.data.user.id;
      actualGuardId = guardLoginResponse.data.data.user.guard?.id;
    }

    // Login client
    const clientLoginResponse = await axios.post(`${API_URL}/auth/login`, testClient);
    logTest('Client Login', clientLoginResponse.status === 200);
    
    if (clientLoginResponse.data.success) {
      clientToken = clientLoginResponse.data.data.token;
    }

    console.log(`Guard User ID: ${guardUserId}, Guard ID: ${actualGuardId}`);

    return guardToken && clientToken;
  } catch (error) {
    logTest('Authentication', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 3: Create Test Shift
async function testCreateShift() {
  if (!guardToken || !guardUserId) {
    logTest('Create Test Shift', false, 'No guard token or ID');
    return false;
  }

  try {
    const shiftData = {
      guardId: actualGuardId || guardUserId,
      locationName: 'Test Security Site',
      locationAddress: '123 Test Street, Test City',
      scheduledStartTime: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      scheduledEndTime: new Date(Date.now() + 3660000).toISOString(), // 1 hour from now
      description: 'Test shift for Phase 2 validation',
      notes: 'Automated test shift'
    };

    const response = await axios.post(`${API_URL}/shifts`, shiftData, {
      headers: { Authorization: `Bearer ${guardToken}` }
    });

    if (response.data.success) {
      testShiftId = response.data.data.id;
      logTest('Create Test Shift', true, `Shift ID: ${testShiftId}`);
      return true;
    } else {
      logTest('Create Test Shift', false, response.data.error);
      return false;
    }
  } catch (error) {
    logTest('Create Test Shift', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 4: Get Shift Statistics
async function testGetShiftStatistics() {
  if (!guardToken) {
    logTest('Get Shift Statistics', false, 'No guard token');
    return false;
  }

  try {
    const response = await axios.get(`${API_URL}/shifts/statistics`, {
      headers: { Authorization: `Bearer ${guardToken}` }
    });

    logTest('Get Shift Statistics', response.status === 200 && response.data.success);
    return response.data.success;
  } catch (error) {
    logTest('Get Shift Statistics', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 5: Get Active Shift (should be none initially)
async function testGetActiveShift() {
  if (!guardToken) {
    logTest('Get Active Shift', false, 'No guard token');
    return false;
  }

  try {
    const response = await axios.get(`${API_URL}/shifts/active`, {
      headers: { Authorization: `Bearer ${guardToken}` }
    });

    // Should return 404 since no active shift initially
    logTest('Get Active Shift (None)', response.status === 404);
    return response.status === 404;
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('Get Active Shift (None)', true);
      return true;
    }
    logTest('Get Active Shift (None)', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 6: Get Upcoming Shifts
async function testGetUpcomingShifts() {
  if (!guardToken) {
    logTest('Get Upcoming Shifts', false, 'No guard token');
    return false;
  }

  try {
    const response = await axios.get(`${API_URL}/shifts/upcoming`, {
      headers: { Authorization: `Bearer ${guardToken}` }
    });

    logTest('Get Upcoming Shifts', response.status === 200 && response.data.success);
    return response.data.success;
  } catch (error) {
    logTest('Get Upcoming Shifts', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 7: Check In to Shift
async function testCheckInToShift() {
  if (!guardToken || !testShiftId) {
    logTest('Check In to Shift', false, 'No guard token or shift ID');
    return false;
  }

  try {
    const checkInData = {
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10.5,
        address: '123 Test Street, Test City'
      }
    };

    const response = await axios.post(`${API_URL}/shifts/${testShiftId}/check-in`, checkInData, {
      headers: { Authorization: `Bearer ${guardToken}` }
    });

    logTest('Check In to Shift', response.status === 200 && response.data.success);
    return response.data.success;
  } catch (error) {
    logTest('Check In to Shift', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 8: Get Active Shift (should exist now)
async function testGetActiveShiftAfterCheckIn() {
  if (!guardToken) {
    logTest('Get Active Shift (After Check-in)', false, 'No guard token');
    return false;
  }

  try {
    const response = await axios.get(`${API_URL}/shifts/active`, {
      headers: { Authorization: `Bearer ${guardToken}` }
    });

    logTest('Get Active Shift (After Check-in)', response.status === 200 && response.data.success);
    return response.data.success;
  } catch (error) {
    logTest('Get Active Shift (After Check-in)', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 9: Start Break
async function testStartBreak() {
  if (!guardToken || !testShiftId) {
    logTest('Start Break', false, 'No guard token or shift ID');
    return false;
  }

  try {
    const breakData = {
      breakType: 'REGULAR',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 8.0
      },
      notes: 'Test break'
    };

    const response = await axios.post(`${API_URL}/shifts/${testShiftId}/start-break`, breakData, {
      headers: { Authorization: `Bearer ${guardToken}` }
    });

    if (response.data.success) {
      testBreakId = response.data.data.id;
      logTest('Start Break', true, `Break ID: ${testBreakId}`);
      return true;
    } else {
      logTest('Start Break', false, response.data.error);
      return false;
    }
  } catch (error) {
    logTest('Start Break', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 10: End Break
async function testEndBreak() {
  if (!guardToken || !testShiftId || !testBreakId) {
    logTest('End Break', false, 'Missing required IDs');
    return false;
  }

  try {
    const endBreakData = {
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 9.0
      },
      notes: 'Break ended'
    };

    const response = await axios.post(`${API_URL}/shifts/${testShiftId}/end-break/${testBreakId}`, endBreakData, {
      headers: { Authorization: `Bearer ${guardToken}` }
    });

    logTest('End Break', response.status === 200 && response.data.success);
    return response.data.success;
  } catch (error) {
    logTest('End Break', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 11: Report Incident
async function testReportIncident() {
  if (!guardToken || !testShiftId) {
    logTest('Report Incident', false, 'No guard token or shift ID');
    return false;
  }

  try {
    const incidentData = {
      incidentType: 'SUSPICIOUS_ACTIVITY',
      severity: 'MEDIUM',
      title: 'Test Incident Report',
      description: 'This is a test incident report for Phase 2 validation',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 12.0,
        address: '123 Test Street, Test City'
      },
      attachments: []
    };

    const response = await axios.post(`${API_URL}/shifts/${testShiftId}/report-incident`, incidentData, {
      headers: { Authorization: `Bearer ${guardToken}` }
    });

    logTest('Report Incident', response.status === 201 && response.data.success);
    return response.data.success;
  } catch (error) {
    logTest('Report Incident', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 12: Check Out from Shift
async function testCheckOutFromShift() {
  if (!guardToken || !testShiftId) {
    logTest('Check Out from Shift', false, 'No guard token or shift ID');
    return false;
  }

  try {
    const checkOutData = {
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 11.0,
        address: '123 Test Street, Test City'
      },
      notes: 'Shift completed successfully - automated test'
    };

    const response = await axios.post(`${API_URL}/shifts/${testShiftId}/check-out`, checkOutData, {
      headers: { Authorization: `Bearer ${guardToken}` }
    });

    logTest('Check Out from Shift', response.status === 200 && response.data.success);
    return response.data.success;
  } catch (error) {
    logTest('Check Out from Shift', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Test 13: WebSocket Connection (Guard)
async function testGuardWebSocket() {
  return new Promise((resolve) => {
    if (!guardToken || !guardUserId) {
      logTest('Guard WebSocket Connection', false, 'No guard token or ID');
      resolve(false);
      return;
    }

    guardSocket = io(BASE_URL, {
      transports: ['websocket'],
      timeout: 5000,
    });

    let authenticated = false;

    guardSocket.on('connect', () => {
      guardSocket.emit('authenticate', {
        token: guardToken,
        userId: guardUserId,
        role: 'GUARD'
      });
    });

    guardSocket.on('authenticated', (data) => {
      if (data.success) {
        authenticated = true;
        logTest('Guard WebSocket Connection', true);
        resolve(true);
      } else {
        logTest('Guard WebSocket Connection', false, 'Authentication failed');
        resolve(false);
      }
    });

    guardSocket.on('authentication_error', (data) => {
      logTest('Guard WebSocket Connection', false, data.message);
      resolve(false);
    });

    guardSocket.on('connect_error', (error) => {
      logTest('Guard WebSocket Connection', false, error.message);
      resolve(false);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!authenticated) {
        logTest('Guard WebSocket Connection', false, 'Connection timeout');
        resolve(false);
      }
    }, 10000);
  });
}

// Test 14: Get Updated Statistics
async function testGetUpdatedStatistics() {
  if (!guardToken) {
    logTest('Get Updated Statistics', false, 'No guard token');
    return false;
  }

  try {
    const response = await axios.get(`${API_URL}/shifts/statistics`, {
      headers: { Authorization: `Bearer ${guardToken}` }
    });

    if (response.data.success) {
      const stats = response.data.data;
      console.log('📊 Updated Statistics:', {
        completedShifts: stats.completedShifts,
        totalHours: stats.totalHours,
        incidentReports: stats.incidentReports
      });
      
      logTest('Get Updated Statistics', true, `Completed: ${stats.completedShifts}, Hours: ${stats.totalHours}`);
      return true;
    } else {
      logTest('Get Updated Statistics', false, response.data.error);
      return false;
    }
  } catch (error) {
    logTest('Get Updated Statistics', false, error.response?.data?.error || error.message);
    return false;
  }
}

// Cleanup function
function cleanup() {
  if (guardSocket) {
    guardSocket.disconnect();
  }
  if (clientSocket) {
    clientSocket.disconnect();
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Phase 2: Shift Management System Tests');
  console.log('===================================================\n');

  try {
    // Basic API Tests
    logSection('BASIC API TESTS');
    await testHealthCheck();
    
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      console.log('\n❌ Authentication failed - skipping remaining tests');
      return;
    }

    // Shift Management Tests
    logSection('SHIFT MANAGEMENT TESTS');
    await testGetShiftStatistics();
    await testGetActiveShift();
    await testGetUpcomingShifts();
    
    const shiftCreated = await testCreateShift();
    if (!shiftCreated) {
      console.log('\n❌ Shift creation failed - skipping shift workflow tests');
    } else {
      // Shift Workflow Tests
      logSection('SHIFT WORKFLOW TESTS');
      await testCheckInToShift();
      await testGetActiveShiftAfterCheckIn();
      await testStartBreak();
      await delay(1000); // Brief pause
      await testEndBreak();
      await testReportIncident();
      await testCheckOutFromShift();
      await testGetUpdatedStatistics();
    }

    // WebSocket Tests
    logSection('WEBSOCKET TESTS');
    await testGuardWebSocket();

    // Results Summary
    logSection('TEST RESULTS SUMMARY');
    console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.tests
        .filter(test => !test.passed)
        .forEach(test => console.log(`  - ${test.name}: ${test.message}`));
    }

    console.log('\n🎉 Phase 2: Shift Management System Test Complete!');

  } catch (error) {
    console.error('❌ Test runner error:', error.message);
  } finally {
    cleanup();
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Tests interrupted');
  cleanup();
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Tests terminated');
  cleanup();
  process.exit(1);
});

// Run tests
runTests();
