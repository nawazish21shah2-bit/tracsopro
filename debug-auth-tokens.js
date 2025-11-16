// Debug script to check authentication token storage
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testAuthFlow() {
  console.log('🔍 Testing authentication flow...\n');

  try {
    // Step 1: Login
    console.log('1. Attempting login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'client@test.com',
      password: 'password'
    });

    if (loginResponse.status === 200) {
      console.log('✅ Login successful');
      const { token, refreshToken, user } = loginResponse.data.data;
      console.log('📋 Token info:', {
        tokenLength: token?.length,
        refreshTokenLength: refreshToken?.length,
        userRole: user?.role,
        userName: `${user?.firstName} ${user?.lastName}`
      });

      // Step 2: Test authenticated request immediately
      console.log('\n2. Testing immediate authenticated request...');
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const profileResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: authHeaders
      });

      if (profileResponse.status === 200) {
        console.log('✅ Immediate auth request successful');
      }

      // Step 3: Test client dashboard stats
      console.log('\n3. Testing client dashboard stats...');
      const statsResponse = await axios.get(`${API_BASE_URL}/clients/dashboard/stats`, {
        headers: authHeaders
      });

      if (statsResponse.status === 200) {
        console.log('✅ Dashboard stats request successful');
      }

      // Step 4: Test client guards
      console.log('\n4. Testing client guards...');
      const guardsResponse = await axios.get(`${API_BASE_URL}/clients/my-guards?page=1&limit=10`, {
        headers: authHeaders
      });

      if (guardsResponse.status === 200) {
        console.log('✅ Client guards request successful');
      }

      // Step 5: Test client sites
      console.log('\n5. Testing client sites...');
      const sitesResponse = await axios.get(`${API_BASE_URL}/clients/my-sites?page=1&limit=10`, {
        headers: authHeaders
      });

      if (sitesResponse.status === 200) {
        console.log('✅ Client sites request successful');
      }

    } else {
      console.log('❌ Login failed with status:', loginResponse.status);
    }

  } catch (error) {
    console.error('❌ Error during auth flow test:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Run the test
testAuthFlow().then(() => {
  console.log('\n🏁 Auth flow test completed');
}).catch(error => {
  console.error('💥 Test failed:', error.message);
});
