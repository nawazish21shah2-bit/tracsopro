// Quick test to check guard creation and get proper guard ID
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

async function testGuardCreation() {
  try {
    // Login as guard
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'guard.test@tracsopro.com',
      password: 'TestPass123!'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginResponse.data.data.token;
    const userId = loginResponse.data.data.user.id;
    
    console.log('✅ User ID:', userId);

    // Get current user to check guard profile
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Current user:', JSON.stringify(meResponse.data.data, null, 2));

    // Try to get guard profile
    try {
      const guardResponse = await axios.get(`${API_URL}/guards/my-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Guard profile:', JSON.stringify(guardResponse.data.data, null, 2));
    } catch (error) {
      console.log('❌ Guard profile error:', error.response?.data?.message || error.message);
    }

    // Test location recording with user ID
    const locationData = {
      guardId: userId, // Try with user ID
      latitude: 40.7128,
      longitude: -74.0060,
      accuracy: 10.5,
      batteryLevel: 85,
      timestamp: Date.now()
    };

    const locationResponse = await axios.post(`${API_URL}/tracking/location`, locationData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Location recording with user ID:', locationResponse.data);

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

testGuardCreation();
