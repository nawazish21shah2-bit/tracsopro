/**
 * Create Test Users Script
 * Creates test users for all roles to enable proper testing
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('🔧 Creating test users for system testing...');

  try {
    // Hash password for all test users
    const hashedPassword = await bcrypt.hash('password', 10);

    // 1. Create Admin User (admin@test.com)
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {
        password: hashedPassword,
        isActive: true,
        isEmailVerified: true,
      },
      create: {
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1234567890',
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true,
      },
    });
    console.log('✅ Admin user created:', adminUser.email);

    // 2. Create Client User (client@test.com)
    const clientUser = await prisma.user.upsert({
      where: { email: 'client@test.com' },
      update: {
        password: hashedPassword,
        isActive: true,
        isEmailVerified: true,
      },
      create: {
        email: 'client@test.com',
        password: hashedPassword,
        firstName: 'Client',
        lastName: 'User',
        phone: '+1234567891',
        role: 'CLIENT',
        accountType: 'COMPANY',
        isActive: true,
        isEmailVerified: true,
      },
    });

    // Create client profile
    await prisma.client.upsert({
      where: { userId: clientUser.id },
      update: {},
      create: {
        userId: clientUser.id,
        accountType: 'COMPANY',
      },
    });
    console.log('✅ Client user created:', clientUser.email);

    // 3. Create Guard User (guard@test.com)
    const guardUser = await prisma.user.upsert({
      where: { email: 'guard@test.com' },
      update: {
        password: hashedPassword,
        isActive: true,
        isEmailVerified: true,
      },
      create: {
        email: 'guard@test.com',
        password: hashedPassword,
        firstName: 'Guard',
        lastName: 'User',
        phone: '+1234567892',
        role: 'GUARD',
        isActive: true,
        isEmailVerified: true,
      },
    });

    // Create guard profile
    await prisma.guard.upsert({
      where: { userId: guardUser.id },
      update: {},
      create: {
        userId: guardUser.id,
        employeeId: 'EMP001',
        department: 'Security',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Guard user created:', guardUser.email);

    // 4. Create additional test guards
    const guard2User = await prisma.user.upsert({
      where: { email: 'john.smith@test.com' },
      update: {
        password: hashedPassword,
        isActive: true,
        isEmailVerified: true,
      },
      create: {
        email: 'john.smith@test.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Smith',
        phone: '+1234567893',
        role: 'GUARD',
        isActive: true,
        isEmailVerified: true,
      },
    });

    await prisma.guard.upsert({
      where: { userId: guard2User.id },
      update: {},
      create: {
        userId: guard2User.id,
        employeeId: 'EMP002',
        department: 'Security',
        status: 'ACTIVE',
      },
    });

    const guard3User = await prisma.user.upsert({
      where: { email: 'sarah.johnson@test.com' },
      update: {
        password: hashedPassword,
        isActive: true,
        isEmailVerified: true,
      },
      create: {
        email: 'sarah.johnson@test.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '+1234567894',
        role: 'GUARD',
        isActive: true,
        isEmailVerified: true,
      },
    });

    await prisma.guard.upsert({
      where: { userId: guard3User.id },
      update: {},
      create: {
        userId: guard3User.id,
        employeeId: 'EMP003',
        department: 'Security',
        status: 'ACTIVE',
      },
    });

    console.log('✅ Additional guard users created');

    // 5. Create test sites
    const site1 = await prisma.site.upsert({
      where: { name: 'Central Office' },
      update: {},
      create: {
        name: 'Central Office',
        address: '123 Main Street, Downtown',
        latitude: 40.7589,
        longitude: -73.9851,
        clientId: clientUser.id,
        isActive: true,
      },
    });

    const site2 = await prisma.site.upsert({
      where: { name: 'Warehouse A' },
      update: {},
      create: {
        name: 'Warehouse A',
        address: '456 Industrial Boulevard',
        latitude: 40.7505,
        longitude: -73.9934,
        clientId: clientUser.id,
        isActive: true,
      },
    });

    console.log('✅ Test sites created');

    // 6. Create test shifts
    const now = new Date();
    const shiftStart = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    const shiftEnd = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours from now

    await prisma.shift.upsert({
      where: { id: 'test-shift-1' },
      update: {},
      create: {
        id: 'test-shift-1',
        guardId: guardUser.id,
        siteId: site1.id,
        scheduledStart: shiftStart,
        scheduledEnd: shiftEnd,
        status: 'IN_PROGRESS',
        actualStart: shiftStart,
      },
    });

    console.log('✅ Test shifts created');

    // 7. Create test incidents
    await prisma.incident.upsert({
      where: { id: 'test-incident-1' },
      update: {},
      create: {
        id: 'test-incident-1',
        title: 'Security Breach Alert',
        description: 'Unauthorized access detected at main entrance',
        type: 'SECURITY_BREACH',
        severity: 'HIGH',
        status: 'PENDING',
        reportedById: guardUser.id,
        siteId: site1.id,
        location: 'Main Entrance',
      },
    });

    console.log('✅ Test incidents created');

    console.log('\n🎉 Test users created successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@test.com / password');
    console.log('Client: client@test.com / password');
    console.log('Guard: guard@test.com / password');
    console.log('Additional Guards: john.smith@test.com, sarah.johnson@test.com / password');
    console.log('\n🔗 Test the system:');
    console.log('1. Login with admin@test.com to access admin dashboard');
    console.log('2. Login with client@test.com to access client portal');
    console.log('3. Login with guard@test.com to access guard mobile app');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  }
}

async function main() {
  try {
    await createTestUsers();
  } catch (error) {
    console.error('Failed to create test users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
