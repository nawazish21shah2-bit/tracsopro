// Final Location Tracking System Test
const axios = require('axios');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Test data
const testGuard = {
  email: 'guard.test@tracsopro.com',
  password: 'TestPass123!'
};

const testClient = {
  email: 'client.test@tracsopro.com',
  password: 'TestPass123!'
};

let guardToken = null;
let clientToken = null;
let guardUserId = null;
let clientUserId = null;
let actualGuardId = null;
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

// Test 2: Authentication (login existing users)
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
      clientUserId = clientLoginResponse.data.data.user.id;
    }

    console.log(`Guard User ID: ${guardUserId}, Guard ID: ${actualGuardId}`);
    console.log(`Client User ID: ${clientUserId}`);

    return guardToken && clientToken;
  } catch (error) {
    logTest('Authentication', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 3: Location Recording API
async function testLocationRecording() {
  if (!guardToken || !guardUserId) {
    logTest('Location Recording', false, 'No guard token or ID');
    return false;
  }

  try {
    const locationData = {
      guardId: guardUserId, // Use user ID as the service handles the lookup
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10.5,
      batteryLevel: 85,
      timestamp: Date.now()
    };

    const response = await axios.post(`${API_URL}/tracking/location`, locationData, {
      headers: { Authorization: `Bearer ${guardToken}` }
    });

    logTest('Location Recording', response.status === 201 && response.data.success);
    return response.data.success;
  } catch (error) {
    logTest('Location Recording', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 4: Geofence Event Recording
async function testGeofenceEvents() {
  if (!guardToken || !guardUserId) {
    logTest('Geofence Events', false, 'No guard token or ID');
    return false;
  }

  try {
    const geofenceEventData = {
      guardId: guardUserId,
      geofenceId: 'test-geofence-1',
      eventType: 'ENTER',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10.5,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    const response = await axios.post(`${API_URL}/tracking/geofence-event`, geofenceEventData, {
      headers: { Authorization: `Bearer ${guardToken}` }
    });

    logTest('Geofence Event Recording', response.status === 201 && response.data.success);
    return response.data.success;
  } catch (error) {
    logTest('Geofence Event Recording', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 5: Location History Retrieval
async function testLocationHistory() {
  if (!guardToken || !actualGuardId) {
    logTest('Location History', false, 'No guard token or actual guard ID');
    return false;
  }

  try {
    const response = await axios.get(`${API_URL}/tracking/history/${actualGuardId}`, {
      headers: { Authorization: `Bearer ${guardToken}` }
    });

    logTest('Location History Retrieval', response.status === 200 && response.data.success);
    return response.data.success;
  } catch (error) {
    logTest('Location History Retrieval', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 6: Live Locations API
async function testLiveLocations() {
  if (!clientToken) {
    logTest('Live Locations API', false, 'No client token');
    return false;
  }

  try {
    const response = await axios.get(`${API_URL}/tracking/live-locations`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });

    logTest('Live Locations API', response.status === 200 && response.data.success);
    return response.data.success;
  } catch (error) {
    logTest('Live Locations API', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 7: Real-time Data API
async function testRealTimeData() {
  if (!clientToken) {
    logTest('Real-time Data API', false, 'No client token');
    return false;
  }

  try {
    const response = await axios.get(`${API_URL}/tracking/real-time-data`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });

    logTest('Real-time Data API', response.status === 200 && response.data.success);
    return response.data.success;
  } catch (error) {
    logTest('Real-time Data API', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 8: WebSocket Connection (Guard)
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

// Test 9: WebSocket Connection (Client)
async function testClientWebSocket() {
  return new Promise((resolve) => {
    if (!clientToken || !clientUserId) {
      logTest('Client WebSocket Connection', false, 'No client token or ID');
      resolve(false);
      return;
    }

    clientSocket = io(BASE_URL, {
      transports: ['websocket'],
      timeout: 5000,
    });

    let authenticated = false;

    clientSocket.on('connect', () => {
      clientSocket.emit('authenticate', {
        token: clientToken,
        userId: clientUserId,
        role: 'CLIENT'
      });
    });

    clientSocket.on('authenticated', (data) => {
      if (data.success) {
        authenticated = true;
        logTest('Client WebSocket Connection', true);
        resolve(true);
      } else {
        logTest('Client WebSocket Connection', false, 'Authentication failed');
        resolve(false);
      }
    });

    clientSocket.on('authentication_error', (data) => {
      logTest('Client WebSocket Connection', false, data.message);
      resolve(false);
    });

    clientSocket.on('connect_error', (error) => {
      logTest('Client WebSocket Connection', false, error.message);
      resolve(false);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!authenticated) {
        logTest('Client WebSocket Connection', false, 'Connection timeout');
        resolve(false);
      }
    }, 10000);
  });
}

// Test 10: Real-time Location Broadcasting
async function testLocationBroadcasting() {
  return new Promise((resolve) => {
    if (!guardSocket || !clientSocket) {
      logTest('Location Broadcasting', false, 'WebSocket connections not established');
      resolve(false);
      return;
    }

    let locationReceived = false;

    // Client listens for location updates
    clientSocket.on('guard_location_update', (data) => {
      if (data.guardId === guardUserId) {
        locationReceived = true;
        logTest('Location Broadcasting', true);
        resolve(true);
      }
    });

    // Guard sends location update
    const locationUpdate = {
      guardId: guardUserId,
      latitude: 40.7589,
      longitude: -73.9851,
      accuracy: 8.2,
      timestamp: Date.now(),
      batteryLevel: 80
    };

    guardSocket.emit('location_update', locationUpdate);

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!locationReceived) {
        logTest('Location Broadcasting', false, 'Location update not received');
        resolve(false);
      }
    }, 5000);
  });
}

// Test 11: Emergency Alert System
async function testEmergencyAlert() {
  return new Promise((resolve) => {
    if (!guardSocket || !clientSocket) {
      logTest('Emergency Alert System', false, 'WebSocket connections not established');
      resolve(false);
    }

    let emergencyReceived = false;

    // Client listens for emergency alerts
    clientSocket.on('emergency_alert', (data) => {
      if (data.guardId === guardUserId) {
        emergencyReceived = true;
        logTest('Emergency Alert System', true);
        resolve(true);
      }
    });

    // Guard sends emergency alert
    const emergencyAlert = {
      guardId: guardUserId,
      location: {
        latitude: 40.7589,
        longitude: -73.9851,
        accuracy: 8.2,
        timestamp: Date.now(),
        batteryLevel: 75
      },
      message: 'Test emergency alert'
    };

    guardSocket.emit('emergency_alert', emergencyAlert);

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!emergencyReceived) {
        logTest('Emergency Alert System', false, 'Emergency alert not received');
        resolve(false);
      }
    }, 5000);
  });
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
  console.log('🚀 Starting Location Tracking System Tests (Final)');
  console.log('==================================================\n');

  try {
    // Basic API Tests
    logSection('BASIC API TESTS');
    await testHealthCheck();
    
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      console.log('\n❌ Authentication failed - skipping remaining tests');
      return;
    }

    // Location API Tests
    logSection('LOCATION API TESTS');
    await testLocationRecording();
    await testGeofenceEvents();
    await testLocationHistory();
    await testLiveLocations();
    await testRealTimeData();

    // WebSocket Tests
    logSection('WEBSOCKET TESTS');
    const guardWSSuccess = await testGuardWebSocket();
    const clientWSSuccess = await testClientWebSocket();

    if (guardWSSuccess && clientWSSuccess) {
      await delay(1000); // Wait for connections to stabilize
      
      logSection('REAL-TIME COMMUNICATION TESTS');
      await testLocationBroadcasting();
      await testEmergencyAlert();
    }

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

    console.log('\n🎉 Location Tracking System Test Complete!');

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
