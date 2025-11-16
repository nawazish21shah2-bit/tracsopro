// Test App Authentication Flow
const axios = require('axios');

const API_BASE_URL = 'http://10.0.2.2:3000/api'; // Android emulator URL

async function testAppAuth() {
  console.log('📱 Testing App Authentication Flow...\n');

  try {
    // Step 1: Test login
    console.log('1. Testing login...');
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

    // Step 2: Test protected endpoint (sites)
    console.log('\n2. Testing protected sites endpoint...');
    const siteResponse = await axios.get(`${API_BASE_URL}/sites/my-sites`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Sites API working');
    console.log(`   Sites found: ${siteResponse.data.data?.sites?.length || 0}`);

    // Step 3: Test user profile endpoint
    console.log('\n3. Testing user profile endpoint...');
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Profile API working');
    console.log(`   Profile: ${profileResponse.data.data.firstName} ${profileResponse.data.data.lastName}`);

    console.log('\n🎉 All authentication tests passed! The app should work now.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Make sure the backend server is running on port 3000');
    }
  }
}

// Run the test
testAppAuth();
