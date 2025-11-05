// Create easy-to-remember test accounts for React Native testing
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

const testAccounts = [
  {
    firstName: 'John',
    lastName: 'Guard',
    email: 'guard@test.com',
    password: 'password123',
    confirmPassword: 'password123',
    phone: '+1234567890',
    role: 'GUARD'
  },
  {
    firstName: 'Jane',
    lastName: 'Client',
    email: 'client@test.com',
    password: 'password123',
    confirmPassword: 'password123',
    phone: '+1234567891',
    role: 'CLIENT'
  },
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@test.com',
    password: 'password123',
    confirmPassword: 'password123',
    phone: '+1234567892',
    role: 'ADMIN'
  }
];

async function createTestAccounts() {
  console.log('🔧 Creating easy-to-remember test accounts...\n');

  for (const account of testAccounts) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, account);
      console.log(`✅ Created ${account.role}: ${account.email} / ${account.password}`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log(`ℹ️  Account already exists: ${account.email}`);
      } else {
        console.error(`❌ Failed to create ${account.email}:`, error.response?.data?.message || error.message);
      }
    }
  }

  console.log('\n🎯 Test Accounts Ready:');
  console.log('┌─────────────────────────────────────────────┐');
  console.log('│                TEST ACCOUNTS                │');
  console.log('├─────────────────────────────────────────────┤');
  console.log('│ GUARD:      guard@test.com / password123    │');
  console.log('│ CLIENT:     client@test.com / password123   │');
  console.log('│ ADMIN:      admin@test.com / password123    │');
  console.log('└─────────────────────────────────────────────┘');
  console.log('\n📱 Ready to test in React Native app!');
}

createTestAccounts();
