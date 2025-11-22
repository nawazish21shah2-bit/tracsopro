/**
 * Script to create test accounts for live tracking testing
 * 
 * Usage: node scripts/create-test-accounts.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const TEST_ACCOUNTS = [
  {
    email: 'guard1@test.com',
    password: '12345678',
    firstName: 'John',
    lastName: 'Guard',
    role: 'GUARD',
    phone: '+1234567890',
  },
  {
    email: 'guard2@test.com',
    password: '12345678',
    firstName: 'Sarah',
    lastName: 'Guard',
    role: 'GUARD',
    phone: '+1234567891',
  },
  {
    email: 'admin@test.com',
    password: '12345678',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    phone: '+1234567892',
  },
  {
    email: 'client@test.com',
    password: '12345678',
    firstName: 'Client',
    lastName: 'User',
    role: 'CLIENT',
    phone: '+1234567893',
  },
];

async function createTestAccounts() {
  console.log('🚀 Starting test account creation...\n');

  try {
    // Get or create a test company
    let company = await prisma.company.findFirst({
      where: { name: 'Test Company' },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Test Company',
          address: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA',
          phone: '+1234567890',
          email: 'test@company.com',
          status: 'ACTIVE',
        },
      });
      console.log('✅ Created test company:', company.name);
    } else {
      console.log('✅ Using existing test company:', company.name);
    }

    // Create test accounts
    for (const accountData of TEST_ACCOUNTS) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: accountData.email },
        });

        if (existingUser) {
          console.log(`⏭️  User ${accountData.email} already exists, skipping...`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(accountData.password, 10);

        // Create user
        const user = await prisma.user.create({
          data: {
            email: accountData.email,
            password: hashedPassword,
            firstName: accountData.firstName,
            lastName: accountData.lastName,
            role: accountData.role,
            phone: accountData.phone,
            status: 'ACTIVE',
            emailVerified: true,
          },
        });

        console.log(`✅ Created user: ${accountData.email} (${accountData.role})`);

        // Create role-specific records
        if (accountData.role === 'GUARD') {
          // Create guard record
          const guard = await prisma.guard.create({
            data: {
              userId: user.id,
              employeeId: `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              companyId: company.id,
              status: 'ACTIVE',
              hireDate: new Date(),
            },
          });
          console.log(`   └─ Created guard record: ${guard.employeeId}`);
        } else if (accountData.role === 'ADMIN') {
          // Create admin record
          const admin = await prisma.admin.create({
            data: {
              userId: user.id,
              companyId: company.id,
              role: 'ADMIN',
              permissions: ['ALL'],
            },
          });
          console.log(`   └─ Created admin record`);
        } else if (accountData.role === 'CLIENT') {
          // Create client record
          const client = await prisma.client.create({
            data: {
              userId: user.id,
              companyId: company.id,
              status: 'ACTIVE',
            },
          });
          console.log(`   └─ Created client record`);
        }
      } catch (error) {
        console.error(`❌ Error creating account ${accountData.email}:`, error.message);
      }
    }

    console.log('\n✅ Test account creation completed!\n');
    console.log('📋 Test Account Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    TEST_ACCOUNTS.forEach(account => {
      console.log(`${account.role}: ${account.email} / ${account.password}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 All accounts use password: 12345678\n');

    // Create a test site for guards
    const testSite = await prisma.location.findFirst({
      where: { name: 'Test Site' },
    });

    if (!testSite) {
      const site = await prisma.location.create({
        data: {
          name: 'Test Site',
          address: '456 Test Avenue',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA',
          latitude: 40.7128,
          longitude: -74.0060,
          companyId: company.id,
          status: 'ACTIVE',
        },
      });
      console.log('✅ Created test site:', site.name);
      console.log(`   └─ Location: ${site.latitude}, ${site.longitude}\n`);
    }

  } catch (error) {
    console.error('❌ Error creating test accounts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestAccounts()
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

