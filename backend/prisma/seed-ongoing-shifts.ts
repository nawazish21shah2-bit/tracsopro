import { PrismaClient, ShiftStatus } from '@prisma/client';
import { addHours, subHours, setHours, setMinutes, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function seedOngoingShifts() {
  console.log('🌱 Seeding ongoing shifts...');

  // Find all guards
  const guards = await prisma.guard.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    take: 5, // Get up to 5 guards
  });

  if (guards.length === 0) {
    console.log('❌ No guards found. Please seed guards first.');
    return;
  }

  console.log(`✅ Found ${guards.length} guards`);

  // Find or create clients
  let clients = await prisma.client.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    take: 3,
  });

  // If no clients exist, create one
  if (clients.length === 0) {
    console.log('⚠️  No clients found. Creating a test client...');
    const clientUser = await prisma.user.create({
      data: {
        email: 'testclient@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: 'password'
        firstName: 'Test',
        lastName: 'Client',
        phone: '+1234567890',
        role: 'CLIENT',
        accountType: 'COMPANY',
        isEmailVerified: true,
      },
    });

    const clientProfile = await prisma.client.create({
      data: {
        userId: clientUser.id,
        accountType: 'COMPANY',
        companyName: 'Test Company Inc.',
        address: '123 Business St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      },
    });

    clients = [
      {
        ...clientProfile,
        user: {
          id: clientUser.id,
          firstName: clientUser.firstName,
          lastName: clientUser.lastName,
          email: clientUser.email,
        },
      },
    ];
    console.log('✅ Created test client');
  }

  console.log(`✅ Found ${clients.length} clients`);

  // Create sites for each client if they don't exist
  const sites = [];
  for (const client of clients) {
    let site = await prisma.site.findFirst({
      where: { clientId: client.id },
    });

    if (!site) {
      site = await prisma.site.create({
        data: {
          clientId: client.id,
          name: `${client.user.firstName}'s Main Site`,
          address: '456 Security Boulevard, New York, NY 10001',
          latitude: 40.7128 + Math.random() * 0.1 - 0.05, // Random nearby location
          longitude: -74.0060 + Math.random() * 0.1 - 0.05,
          description: 'Main security site for client',
          isActive: true,
        },
      });
      console.log(`✅ Created site: ${site.name}`);
    }
    sites.push(site);
  }

  // Create additional sites for variety
  if (sites.length < 3) {
    for (let i = sites.length; i < 3; i++) {
      const client = clients[i % clients.length];
      const site = await prisma.site.create({
        data: {
          clientId: client.id,
          name: `Site ${i + 1} - ${client.user.firstName}`,
          address: `${100 + i} Corporate Drive, New York, NY 1000${i + 1}`,
          latitude: 40.7580 + Math.random() * 0.1 - 0.05,
          longitude: -73.9855 + Math.random() * 0.1 - 0.05,
          description: `Additional security site ${i + 1}`,
          isActive: true,
        },
      });
      sites.push(site);
      console.log(`✅ Created additional site: ${site.name}`);
    }
  }

  console.log(`✅ Found/Created ${sites.length} sites`);

  // Get locations for shifts (optional, but good to have)
  const locations = await prisma.location.findMany({
    take: 3,
  });

  const now = new Date();
  const today = startOfDay(now);

  // Create ongoing shifts (IN_PROGRESS status)
  const ongoingShifts = [];

  // Shift 1: Started 2 hours ago, ends in 6 hours (8-hour shift)
  const shift1Start = subHours(now, 2);
  const shift1End = addHours(now, 6);
  ongoingShifts.push({
    guardId: guards[0].id,
    siteId: sites[0].id,
    clientId: sites[0].clientId,
    locationId: locations[0]?.id || null,
    locationName: sites[0].name,
    locationAddress: sites[0].address,
    scheduledStartTime: shift1Start,
    scheduledEndTime: shift1End,
    actualStartTime: addHours(shift1Start, 0.05), // Started 3 minutes after scheduled
    status: ShiftStatus.IN_PROGRESS,
    description: 'Regular security patrol shift. Monitor all entrances and parking areas.',
    totalBreakTime: 30, // 30 minutes break taken
  });

  // Shift 2: Started 1 hour ago, ends in 7 hours (8-hour shift)
  if (guards.length > 1 && sites.length > 1) {
    const shift2Start = subHours(now, 1);
    const shift2End = addHours(now, 7);
    ongoingShifts.push({
      guardId: guards[1].id,
      siteId: sites[1].id,
      clientId: sites[1].clientId,
      locationId: locations[1]?.id || null,
      locationName: sites[1].name,
      locationAddress: sites[1].address,
      scheduledStartTime: shift2Start,
      scheduledEndTime: shift2End,
      actualStartTime: addHours(shift2Start, 0.03), // Started 2 minutes after scheduled
      status: ShiftStatus.IN_PROGRESS,
      description: 'Day shift security coverage. Focus on main building perimeter.',
      totalBreakTime: 0, // No break taken yet
    });
  }

  // Shift 3: Started 30 minutes ago, ends in 7.5 hours (8-hour shift)
  if (guards.length > 2 && sites.length > 0) {
    const shift3Start = subHours(now, 0.5);
    const shift3End = addHours(now, 7.5);
    ongoingShifts.push({
      guardId: guards[2 % guards.length].id,
      siteId: sites[0].id,
      clientId: sites[0].clientId,
      locationId: locations[0]?.id || null,
      locationName: sites[0].name,
      locationAddress: sites[0].address,
      scheduledStartTime: shift3Start,
      scheduledEndTime: shift3End,
      actualStartTime: addHours(shift3Start, 0.02), // Started 1 minute after scheduled
      status: ShiftStatus.IN_PROGRESS,
      description: 'Afternoon security shift. Monitor visitor access and deliveries.',
      totalBreakTime: 0,
    });
  }

  // Shift 4: Started 3 hours ago, ends in 5 hours (8-hour shift)
  if (guards.length > 3 && sites.length > 2) {
    const shift4Start = subHours(now, 3);
    const shift4End = addHours(now, 5);
    ongoingShifts.push({
      guardId: guards[3 % guards.length].id,
      siteId: sites[2 % sites.length].id,
      clientId: sites[2 % sites.length].clientId,
      locationId: locations[2 % locations.length]?.id || null,
      locationName: sites[2 % sites.length].name,
      locationAddress: sites[2 % sites.length].address,
      scheduledStartTime: shift4Start,
      scheduledEndTime: shift4End,
      actualStartTime: addHours(shift4Start, 0.05),
      status: ShiftStatus.IN_PROGRESS,
      description: 'Extended security coverage. Regular patrols and checkpoint monitoring.',
      totalBreakTime: 45, // 45 minutes break taken
    });
  }

  // Shift 5: Started 4 hours ago, ends in 4 hours (8-hour shift)
  if (guards.length > 4 && sites.length > 1) {
    const shift5Start = subHours(now, 4);
    const shift5End = addHours(now, 4);
    ongoingShifts.push({
      guardId: guards[4 % guards.length].id,
      siteId: sites[1 % sites.length].id,
      clientId: sites[1 % sites.length].clientId,
      locationId: locations[1 % locations.length]?.id || null,
      locationName: sites[1 % sites.length].name,
      locationAddress: sites[1 % sites.length].address,
      scheduledStartTime: shift5Start,
      scheduledEndTime: shift5End,
      actualStartTime: addHours(shift5Start, 0.05),
      status: ShiftStatus.IN_PROGRESS,
      description: 'Full day security shift. Comprehensive site monitoring and access control.',
      totalBreakTime: 60, // 1 hour break taken
    });
  }

  // Create the shifts
  const createdShifts = [];
  for (const shiftData of ongoingShifts) {
    try {
      const shift = await prisma.shift.create({
        data: shiftData,
        include: {
          guard: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          site: {
            select: {
              name: true,
              address: true,
            },
          },
          client: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });
      createdShifts.push(shift);
      console.log(
        `✅ Created ongoing shift for ${shift.guard.user.firstName} ${shift.guard.user.lastName} at ${shift.site?.name || shift.locationName}`
      );
    } catch (error: any) {
      console.error(`❌ Error creating shift:`, error.message);
    }
  }

  console.log(`\n✅ Created ${createdShifts.length} ongoing shifts`);
  console.log('\n📊 Shift Summary:');
  createdShifts.forEach((shift, index) => {
    const guardName = `${shift.guard.user.firstName} ${shift.guard.user.lastName}`;
    const siteName = shift.site?.name || shift.locationName;
    const clientName = shift.client?.user ? `${shift.client.user.firstName} ${shift.client.user.lastName}` : 'N/A';
    const startTime = shift.scheduledStartTime.toLocaleTimeString();
    const endTime = shift.scheduledEndTime.toLocaleTimeString();
    console.log(
      `  ${index + 1}. ${guardName} → ${siteName} (Client: ${clientName}) | ${startTime} - ${endTime} | Status: ${shift.status}`
    );
  });

  console.log('\n🎉 Ongoing shifts seeding completed!');
  console.log('\n💡 These shifts will be visible to:');
  console.log('   - Guards (their assigned shifts)');
  console.log('   - Clients (shifts at their sites)');
  console.log('   - Admins (all shifts)');
}

seedOngoingShifts()
  .catch((e) => {
    console.error('❌ Error seeding ongoing shifts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

