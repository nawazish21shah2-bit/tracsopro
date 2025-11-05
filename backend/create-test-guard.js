// Quick script to create a test guard account
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function createTestGuard() {
  try {
    console.log('🔧 Creating test guard account...\n');

    // Register guard
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      email: 'guard@test.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'Guard',
      phone: '+1234567890',
      role: 'GUARD',
    });

    console.log('✅ Guard account created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('   Email: guard@test.com');
    console.log('   Password: Test123!');
    console.log('\n🔑 Access Token:', registerResponse.data.data.accessToken);
    console.log('\n✨ You can now login in the mobile app!');
  } catch (error) {
    if (error.response?.data) {
      console.error('❌ Error:', error.response.data.error);
      if (error.response.data.error.includes('already exists')) {
        console.log('\n✅ Account already exists! Use these credentials:');
        console.log('   Email: guard@test.com');
        console.log('   Password: Test123!');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

createTestGuard();
