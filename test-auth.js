// Simple test script to verify backend authentication endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAuthFlow() {
  console.log('🧪 Testing Guard Tracking Authentication Flow...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // Test 2: Register new user
    console.log('\n2. Testing user registration...');
    const registerData = {
      firstName: 'Test',
      lastName: 'Guard',
      email: `test.guard.${Date.now()}@example.com`,
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
      phone: '+1234567890',
      role: 'GUARD'
    };

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log('✅ Registration successful:', {
      user: registerResponse.data.data.user.firstName + ' ' + registerResponse.data.data.user.lastName,
      email: registerResponse.data.data.user.email,
      role: registerResponse.data.data.user.role
    });

    const token = registerResponse.data.data.token;
    const userId = registerResponse.data.data.user.id;

    // Test 3: Login with registered user
    console.log('\n3. Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: registerData.email,
      password: registerData.password
    });
    console.log('✅ Login successful:', {
      user: loginResponse.data.data.user.firstName + ' ' + loginResponse.data.data.user.lastName,
      tokenReceived: !!loginResponse.data.data.token
    });

    // Test 4: Get current user (protected route)
    console.log('\n4. Testing protected route (get current user)...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Protected route access successful:', {
      user: meResponse.data.data.firstName + ' ' + meResponse.data.data.lastName,
      email: meResponse.data.data.email
    });

    // Test 5: Test with different roles
    console.log('\n5. Testing client registration...');
    const clientData = {
      firstName: 'Test',
      lastName: 'Client',
      email: `test.client.${Date.now()}@example.com`,
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
      phone: '+1234567891',
      role: 'CLIENT'
    };

    const clientResponse = await axios.post(`${BASE_URL}/auth/register`, clientData);
    console.log('✅ Client registration successful:', {
      user: clientResponse.data.data.user.firstName + ' ' + clientResponse.data.data.user.lastName,
      role: clientResponse.data.data.user.role
    });

    console.log('\n🎉 All authentication tests passed!');
    console.log('\n📱 Ready to test with React Native app:');
    console.log('- Backend running on: http://localhost:3000');
    console.log('- Test accounts created and working');
    console.log('- All endpoints responding correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.log('💡 Make sure the backend server is running: npm run dev:db');
    }
  }
}

// Run the test
testAuthFlow();
