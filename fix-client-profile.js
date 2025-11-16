// Fix Client Profile for Existing User
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function fixClientProfile() {
  console.log('🔧 Fixing Client Profile for existing user...\n');

  try {
    // Step 1: Create client profile directly via backend
    console.log('1. Creating client profile via backend...');
    
    // We'll use the admin endpoint to create the profile
    // First, login as admin
    const adminLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'password123'
    });

    if (!adminLoginResponse.data.success) {
      console.error('❌ Admin login failed:', adminLoginResponse.data.message);
      return;
    }

    const adminToken = adminLoginResponse.data.data.token;
    console.log('✅ Admin login successful');

    // Step 2: Find the client user
    console.log('\n2. Finding client user...');
    
    // We need to create the client profile manually via database
    // Let's create a simple endpoint call to fix this
    const fixResponse = await axios.post(`${API_BASE_URL}/admin/fix-client-profile`, {
      email: 'client@test.com'
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Client profile fix attempted');

  } catch (error) {
    console.error('❌ Fix failed:', error.response?.data?.message || error.message);
    
    // Alternative: Let's try to register a new client user
    console.log('\n🔄 Attempting to register new client user...');
    
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: 'client2@test.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Client',
        phone: '+1234567890',
        role: 'CLIENT',
        accountType: 'INDIVIDUAL'
      });

      console.log('✅ New client user registered successfully');
      console.log('   User ID:', registerResponse.data.data.userId);
      console.log('   Email:', registerResponse.data.data.email);
      
      // Now test with the new user
      console.log('\n3. Testing with new client user...');
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'client2@test.com',
        password: 'password123'
      });

      if (loginResponse.data.success) {
        const { token } = loginResponse.data.data;
        console.log('✅ New client login successful');

        // Test sites API
        const siteResponse = await axios.get(`${API_BASE_URL}/sites/my-sites`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Sites API working with new client!');
        console.log(`   Sites found: ${siteResponse.data.data?.sites?.length || 0}`);
      }

    } catch (registerError) {
      console.error('❌ Registration also failed:', registerError.response?.data?.message || registerError.message);
    }
  }
}

// Run the fix
fixClientProfile();
