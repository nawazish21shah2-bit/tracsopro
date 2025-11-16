// Simple test to check client authentication and subsequent API calls
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testClientAuth() {
  console.log('🔍 Testing client authentication with existing account...\n');

  try {
    // Step 1: Login with existing client
    console.log('1. Logging in as client@test.com...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'client@test.com',
      password: 'password'
    });

    if (loginResponse.status === 200) {
      console.log('✅ Login successful');
      const { token, refreshToken, user } = loginResponse.data.data;
      console.log('📋 User info:', {
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        email: user.email
      });

      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Step 2: Test multiple API calls in sequence (like the mobile app would)
      console.log('\n2. Testing sequential API calls...');
      
      // Call 1: Get current user
      console.log('   - GET /auth/me');
      const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, { headers: authHeaders });
      console.log('   ✅ Success');

      // Call 2: Dashboard stats
      console.log('   - GET /clients/dashboard/stats');
      const statsResponse = await axios.get(`${API_BASE_URL}/clients/dashboard/stats`, { headers: authHeaders });
      console.log('   ✅ Success');

      // Call 3: My guards
      console.log('   - GET /clients/my-guards');
      const guardsResponse = await axios.get(`${API_BASE_URL}/clients/my-guards?page=1&limit=10`, { headers: authHeaders });
      console.log('   ✅ Success');

      // Call 4: My sites
      console.log('   - GET /clients/my-sites');
      const sitesResponse = await axios.get(`${API_BASE_URL}/clients/my-sites?page=1&limit=10`, { headers: authHeaders });
      console.log('   ✅ Success');

      // Step 3: Wait a moment and try again (simulate app behavior)
      console.log('\n3. Waiting 2 seconds and testing again...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('   - GET /clients/my-guards (after delay)');
      const guardsResponse2 = await axios.get(`${API_BASE_URL}/clients/my-guards?page=1&limit=10`, { headers: authHeaders });
      console.log('   ✅ Success');

      console.log('\n🎉 All API calls successful! Backend authentication is working correctly.');

    } else {
      console.log('❌ Login failed with status:', loginResponse.status);
    }

  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testClientAuth();
