// Test Client Profile Creation
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testClientProfile() {
  console.log('🔍 Testing Client Profile...\n');

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
    console.log(`   User ID: ${user.id}`);

    // Step 2: Check if client profile exists
    console.log('\n2. Checking client profile...');
    try {
      const profileResponse = await axios.get(`${API_BASE_URL}/clients/my-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Client profile exists');
      console.log('   Profile data:', JSON.stringify(profileResponse.data.data, null, 2));
    } catch (profileError) {
      console.log('❌ Client profile not found:', profileError.response?.data?.message);
      
      // Step 3: Create client profile if it doesn't exist
      console.log('\n3. Creating client profile...');
      try {
        const createResponse = await axios.post(`${API_BASE_URL}/clients/profile`, {
          accountType: 'INDIVIDUAL',
          address: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'USA'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Client profile created successfully');
        console.log('   Profile data:', JSON.stringify(createResponse.data.data, null, 2));
      } catch (createError) {
        console.error('❌ Failed to create client profile:', createError.response?.data?.message || createError.message);
      }
    }

    // Step 4: Test sites API again
    console.log('\n4. Testing sites API after profile setup...');
    try {
      const siteResponse = await axios.get(`${API_BASE_URL}/sites/my-sites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Site API call successful');
      console.log(`   Sites found: ${siteResponse.data.data?.sites?.length || 0}`);
    } catch (siteError) {
      console.error('❌ Site API still failing:', siteError.response?.data?.message || siteError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Run the test
testClientProfile();
