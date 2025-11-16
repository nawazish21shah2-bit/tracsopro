// Test Client Authentication and Site API
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testClientAuth() {
  console.log('🔍 Testing Client Authentication and Site API...\n');

  try {
    // Step 1: Login as client
    console.log('1. Logging in as client...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'client@test.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const { token, user } = loginResponse.data.data;
    console.log('✅ Login successful');
    console.log(`   User: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Step 2: Test site API with token
    console.log('\n2. Testing site API...');
    const siteResponse = await axios.get(`${API_BASE_URL}/sites/my-sites`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Site API call successful');
    console.log(`   Sites found: ${siteResponse.data.data?.sites?.length || 0}`);
    
    if (siteResponse.data.data?.sites?.length > 0) {
      console.log('   Sample site:', siteResponse.data.data.sites[0].name);
    }

    // Step 3: Test token validation
    console.log('\n3. Testing token validation...');
    const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Token validation successful');
    console.log(`   Current user: ${userResponse.data.data.firstName} ${userResponse.data.data.lastName}`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.error('   This is an authentication error - token is invalid or expired');
    }
    if (error.response?.data) {
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testClientAuth();
