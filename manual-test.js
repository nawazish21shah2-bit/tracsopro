/**
 * Manual Test for Emergency System
 * Direct API testing without authentication
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

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

const testEndpoint = async (method, endpoint, data = null, description = '') => {
  log(`Testing ${method} ${endpoint} - ${description}`);
  
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    log(`✅ Success: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`, 'success');
    return true;
  } catch (error) {
    if (error.response) {
      log(`❌ Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`, 'error');
    } else {
      log(`❌ Network Error: ${error.message}`, 'error');
    }
    return false;
  }
};

const runManualTests = async () => {
  log('🧪 Manual API Testing', 'info');
  log('=' .repeat(50));
  
  // Test health endpoint
  await testEndpoint('GET', '/health', null, 'Health check');
  
  // Test emergency endpoints (these will likely fail due to auth, but we can see the structure)
  await testEndpoint('POST', '/emergency/alert', {
    type: 'PANIC',
    severity: 'CRITICAL',
    location: { latitude: 40.7128, longitude: -74.0060 },
    message: 'Test alert'
  }, 'Create emergency alert');
  
  await testEndpoint('GET', '/emergency/alerts/active', null, 'Get active alerts');
  
  await testEndpoint('GET', '/emergency/statistics', null, 'Get emergency statistics');
  
  // Test payment endpoints
  await testEndpoint('POST', '/payments/intent', {
    amount: 100,
    currency: 'usd',
    description: 'Test payment'
  }, 'Create payment intent');
  
  await testEndpoint('GET', '/payments/methods', null, 'Get payment methods');
  
  await testEndpoint('GET', '/payments/invoices', null, 'Get invoices');
  
  // Test chat endpoints
  await testEndpoint('GET', '/chat', null, 'Get user chats');
  
  await testEndpoint('POST', '/chat', {
    type: 'direct',
    name: 'Test Chat',
    participantIds: ['user1', 'user2']
  }, 'Create chat');
  
  await testEndpoint('GET', '/chat/test_chat/messages', null, 'Get chat messages');
  
  await testEndpoint('POST', '/chat/test_chat/messages', {
    content: 'Test message',
    messageType: 'text'
  }, 'Send message');
  
  await testEndpoint('GET', '/chat/search?q=test', null, 'Search chats');
  
  log('=' .repeat(50));
  log('🎯 Manual testing complete!', 'info');
  log('If you see 401/403 errors, that means the endpoints exist but need authentication.', 'info');
  log('If you see 404 errors, that means the routes are not properly configured.', 'info');
};

runManualTests();
