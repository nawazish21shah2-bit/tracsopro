import { PrismaClient, ShiftStatus } from '@prisma/client';
import { addDays, addHours, subDays, startOfDay, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function seedShifts() {
  console.log('🌱 Seeding shifts...');

  // Find a guard user and its Guard profile (we need Guard.id for Shift.guardId)
  const guardUser = await prisma.user.findFirst({
    where: { role: 'GUARD' },
  });

  if (!guardUser) {
    console.log('❌ No guard user found. Please create a guard user first.');
    return;
  }

  console.log(`✅ Found guard user: ${guardUser.email}`);

  const guardProfile = await prisma.guard.findUnique({
    where: { userId: guardUser.id },
  });

  if (!guardProfile) {
    console.log('❌ No guard profile found for the guard user. Please seed basic users first.');
    return;
  }

  // Create or find a location
  let location = await prisma.location.findFirst();
  
  if (!location) {
    location = await prisma.location.create({
      data: {
        name: 'Ocean View Vila',
        address: '1321 Baker Street, NY',
        latitude: 40.7128,
        longitude: -74.0060,
        type: 'BUILDING',
        description: 'Luxury residential building',
        isActive: true,
      },
    });
    console.log('✅ Created location: Ocean View Vila');
  }

  const today = startOfDay(new Date());

  // Create shifts
  const shifts = [
    // Today's active shift
    {
      guardId: guardProfile.id,
      locationId: location.id,
      locationName: location.name,
      locationAddress: location.address,
      scheduledStartTime: setHours(setMinutes(today, 0), 8), // 8:00 AM today
      scheduledEndTime: setHours(setMinutes(today, 0), 19), // 7:00 PM today
      status: ShiftStatus.IN_PROGRESS,
      description: 'Make sure to check the parking lot for illegal parkings.',
      actualStartTime: setHours(setMinutes(today, 1), 8), // 8:01 AM
      totalBreakTime: 60,
    },
    // Upcoming shift - tomorrow
    {
      guardId: guardProfile.id,
      locationId: location.id,
      locationName: location.name,
      locationAddress: location.address,
      scheduledStartTime: setHours(setMinutes(addDays(today, 1), 0), 8),
      scheduledEndTime: setHours(setMinutes(addDays(today, 1), 0), 19),
      status: ShiftStatus.SCHEDULED,
      description: 'Make sure to check the parking lot for illegal parkings.',
    },
    // Upcoming shift - day after tomorrow
    {
      guardId: guardProfile.id,
      locationId: location.id,
      locationName: location.name,
      locationAddress: location.address,
      scheduledStartTime: setHours(setMinutes(addDays(today, 2), 0), 8),
      scheduledEndTime: setHours(setMinutes(addDays(today, 2), 0), 19),
      status: ShiftStatus.SCHEDULED,
      description: 'Make sure to check the parking lot for illegal parkings.',
    },
    // Completed shift - yesterday
    {
      guardId: guardProfile.id,
      locationId: location.id,
      locationName: location.name,
      locationAddress: location.address,
      scheduledStartTime: setHours(setMinutes(subDays(today, 1), 0), 8),
      scheduledEndTime: setHours(setMinutes(subDays(today, 1), 0), 19),
      status: ShiftStatus.COMPLETED,
      description: 'Make sure to check the parking lot for illegal parkings.',
      actualStartTime: setHours(setMinutes(subDays(today, 1), 2), 8),
      actualEndTime: setHours(setMinutes(subDays(today, 1), 0), 19),
      totalBreakTime: 60,
    },
    // Completed shift - 2 days ago
    {
      guardId: guardProfile.id,
      locationId: location.id,
      locationName: location.name,
      locationAddress: location.address,
      scheduledStartTime: setHours(setMinutes(subDays(today, 2), 0), 8),
      scheduledEndTime: setHours(setMinutes(subDays(today, 2), 0), 19),
      status: ShiftStatus.COMPLETED,
      description: 'Make sure to check the parking lot for illegal parkings.',
      actualStartTime: setHours(setMinutes(subDays(today, 2), 2), 8),
      actualEndTime: setHours(setMinutes(subDays(today, 2), 0), 19),
      totalBreakTime: 60,
    },
    // Missed shift - 3 days ago
    {
      guardId: guardProfile.id,
      locationId: location.id,
      locationName: location.name,
      locationAddress: location.address,
      scheduledStartTime: setHours(setMinutes(subDays(today, 3), 0), 8),
      scheduledEndTime: setHours(setMinutes(subDays(today, 3), 0), 19),
      status: ShiftStatus.MISSED,
      description: 'Make sure to check the parking lot for illegal parkings.',
    },
  ];

  for (const shiftData of shifts) {
    await prisma.shift.create({
      data: shiftData,
    });
  }

  console.log(`✅ Created ${shifts.length} shifts`);

  // Create some shift reports for completed shifts
  const completedShifts = await prisma.shift.findMany({
    where: {
      guardId: guardProfile.id,
      status: ShiftStatus.COMPLETED,
    },
    take: 2,
  });

  for (const shift of completedShifts) {
    await prisma.shiftReport.create({
      data: {
        shiftId: shift.id,
        guardId: guardUser.id,
        reportType: 'SHIFT',
        content: 'We had no incident occured on the site, during my shift hours',
      },
    });
  }

  console.log(`✅ Created ${completedShifts.length} shift reports`);

  console.log('✅ Shift seeding completed!');
}

seedShifts()
  .catch((e) => {
    console.error('❌ Error seeding shifts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
