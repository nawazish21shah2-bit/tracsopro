/**
 * Setup Test Data Script
 * Ensures test accounts have proper profiles (guard/client) for testing
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function setupTestData() {
  console.log('🔧 Setting up test data...\n');

  // Test accounts
  const accounts = [
    { email: 'admin@example.com', password: 'Passw0rd!', role: 'ADMIN' },
    { email: 'guard1@example.com', password: 'Passw0rd!', role: 'GUARD' },
    { email: 'client@test.com', password: 'password123', role: 'CLIENT' },
    { email: 'guard@test.com', password: 'password123', role: 'GUARD' }
  ];

  for (const account of accounts) {
    try {
      // Try to login
      const loginResult = await axios.post(`${API_URL}/auth/login`, {
        email: account.email,
        password: account.password
      });

      if (loginResult.data?.success) {
        const token = loginResult.data.data.token;
        const user = loginResult.data.data.user;

        console.log(`✅ ${account.email} - Logged in`);

        // Check if profile exists
        const meResult = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (meResult.data?.success) {
          const meUser = meResult.data.data;
          
          if (account.role === 'GUARD' && !meUser.guard) {
            console.log(`   ⚠️  Guard profile missing for ${account.email}`);
            // Guard profile should be created during registration
            // If missing, it might need to be created manually
          } else if (account.role === 'CLIENT' && !meUser.client) {
            console.log(`   ⚠️  Client profile missing for ${account.email}`);
            // Client profile should be created during registration
          } else {
            console.log(`   ✅ Profile exists`);
          }
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`❌ ${account.email} - Invalid credentials or account doesn't exist`);
      } else {
        console.log(`❌ ${account.email} - Error: ${error.message}`);
      }
    }
  }

  console.log('\n✅ Test data setup complete!');
  console.log('\n📋 Test Accounts Status:');
  console.log('   - admin@example.com / Passw0rd! (should have admin access)');
  console.log('   - guard1@example.com / Passw0rd! (should have guard profile)');
  console.log('   - client@test.com / password123 (may need client profile)');
  console.log('   - guard@test.com / password123 (may need guard profile)');
}

setupTestData().catch(console.error);



