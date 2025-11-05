import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password
  const hashedPassword = await bcrypt.hash('Passw0rd!', 10);

  // Create users
  const guard1 = await prisma.user.upsert({
    where: { email: 'guard1@example.com' },
    update: {},
    create: {
      email: 'guard1@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: 'GUARD',
    },
  });

  const guard2 = await prisma.user.upsert({
    where: { email: 'guard2@example.com' },
    update: {},
    create: {
      email: 'guard2@example.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1234567891',
      role: 'GUARD',
    },
  });

  const supervisor1 = await prisma.user.upsert({
    where: { email: 'supervisor1@example.com' },
    update: {},
    create: {
      email: 'supervisor1@example.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1234567892',
      role: 'SUPERVISOR',
    },
  });

  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567893',
      role: 'ADMIN',
    },
  });

  console.log('✅ Users created');

  // Create guard profiles
  const guardProfile1 = await prisma.guard.upsert({
    where: { userId: guard1.id },
    update: {},
    create: {
      userId: guard1.id,
      employeeId: 'EMP001',
      department: 'Security',
      status: 'ACTIVE',
    },
  });

  const guardProfile2 = await prisma.guard.upsert({
    where: { userId: guard2.id },
    update: {},
    create: {
      userId: guard2.id,
      employeeId: 'EMP002',
      department: 'Security',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Guard profiles created');

  // Create supervisor profile
  await prisma.supervisor.upsert({
    where: { userId: supervisor1.id },
    update: {},
    create: {
      userId: supervisor1.id,
      department: 'Operations',
    },
  });

  console.log('✅ Supervisor profile created');

  // Create locations
  const location1 = await prisma.location.create({
    data: {
      name: 'Main Building',
      address: '123 Main St, City, State 12345',
      latitude: 40.7128,
      longitude: -74.0060,
      type: 'BUILDING',
      description: 'Primary office building',
    },
  });

  const location2 = await prisma.location.create({
    data: {
      name: 'Warehouse A',
      address: '456 Industrial Rd, City, State 12345',
      latitude: 40.7580,
      longitude: -73.9855,
      type: 'FACILITY',
      description: 'Main warehouse facility',
    },
  });

  console.log('✅ Locations created');

  // Create checkpoints
  await prisma.checkpoint.create({
    data: {
      locationId: location1.id,
      name: 'Main Entrance',
      qrCode: 'QR-MAIN-001',
    },
  });

  await prisma.checkpoint.create({
    data: {
      locationId: location1.id,
      name: 'Back Entrance',
      qrCode: 'QR-BACK-001',
    },
  });

  console.log('✅ Checkpoints created');

  // Create sample incident
  await prisma.incident.create({
    data: {
      reportedBy: guard1.id,
      locationId: location1.id,
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'MEDIUM',
      title: 'Unauthorized person near entrance',
      description: 'Observed individual attempting to access restricted area',
      status: 'REPORTED',
    },
  });

  console.log('✅ Sample incident created');

  // Create emergency contacts
  await prisma.emergencyContact.create({
    data: {
      guardId: guardProfile1.id,
      name: 'Mary Doe',
      relationship: 'Spouse',
      phone: '+1234567894',
      email: 'mary@example.com',
      isPrimary: true,
    },
  });

  console.log('✅ Emergency contacts created');

  // Create qualifications
  await prisma.qualification.create({
    data: {
      guardId: guardProfile1.id,
      title: 'Security Guard License',
      issuer: 'State Security Board',
      issueDate: new Date('2023-01-01'),
      expiryDate: new Date('2025-01-01'),
      isVerified: true,
    },
  });

  console.log('✅ Qualifications created');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
