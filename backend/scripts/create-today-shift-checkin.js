// Script to create today's shift and check in a guard for testing
import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load .env from backend root even if CWD is scripts/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function createTodayShiftAndCheckIn() {
  try {
    console.log('🚀 Creating today\'s shift and checking in guard...\n');

    // Step 1: Find an existing guard
    console.log('1. Finding an existing guard...');
    const guard = await prisma.guard.findFirst({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!guard) {
      throw new Error('No guards found in the database. Please run seed scripts first.');
    }

    console.log(`✅ Found guard: ${guard.user.firstName} ${guard.user.lastName} (${guard.user.email})`);
    console.log(`   Guard ID: ${guard.id}\n`);

    // Step 2: Get or create a site for the shift
    console.log('2. Finding a site for the shift...');
    let site = await prisma.site.findFirst({
      include: {
        client: true,
      },
    });

    if (!site) {
      console.log('   No site found. Creating a test site...');
      // Find or create a client first
      let client = await prisma.client.findFirst();
      
      if (!client) {
        // Find a user with CLIENT role
        const clientUser = await prisma.user.findFirst({
          where: { role: 'CLIENT' },
        });
        
        if (!clientUser) {
          throw new Error('No client found. Please create a client first.');
        }
        
        client = await prisma.client.create({
          data: {
            userId: clientUser.id,
            accountType: 'COMPANY',
            companyName: 'Test Security Company',
            address: '123 Test Street',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'USA',
          },
        });
      }

      site = await prisma.site.create({
        data: {
          clientId: client.id,
          name: 'Test Site - Today',
          address: '456 Testing Avenue',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA',
          isActive: true,
        },
        include: {
          client: true,
        },
      });
      console.log(`✅ Created test site: ${site.name}`);
    } else {
      console.log(`✅ Using existing site: ${site.name}`);
    }
    console.log(`   Site ID: ${site.id}\n`);

    // Step 3: Create today's shift
    console.log('3. Creating today\'s shift...');
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(9, 0, 0, 0); // 9:00 AM today
    
    const todayEnd = new Date(now);
    todayEnd.setHours(17, 0, 0, 0); // 5:00 PM today
    
    // If it's already past 5 PM, make it tomorrow's shift
    if (now.getHours() >= 17) {
      todayStart.setDate(todayStart.getDate() + 1);
      todayEnd.setDate(todayEnd.getDate() + 1);
      console.log('   Note: Current time is past 5 PM, creating shift for tomorrow');
    }

    // Check if shift already exists for today
    const existingShift = await prisma.shift.findFirst({
      where: {
        guardId: guard.id,
        scheduledStartTime: {
          gte: new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate(), 0, 0, 0),
          lt: new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate() + 1, 0, 0, 0),
        },
      },
    });

    let shift;
    if (existingShift) {
      console.log(`   Shift already exists for today. Using existing shift...`);
      shift = existingShift;
    } else {
      shift = await prisma.shift.create({
        data: {
          guardId: guard.id,
          siteId: site.id,
          clientId: site.clientId,
          locationName: site.name,
          locationAddress: site.address,
          scheduledStartTime: todayStart,
          scheduledEndTime: todayEnd,
          description: 'Test shift for today - created by script',
          status: 'SCHEDULED',
        },
      });
      console.log(`✅ Created shift: ${shift.id}`);
    }
    console.log(`   Start: ${todayStart.toLocaleString()}`);
    console.log(`   End: ${todayEnd.toLocaleString()}\n`);

    // Step 4: Check in the guard
    console.log('4. Checking in guard to shift...');
    
    if (shift.status === 'IN_PROGRESS') {
      console.log('   Guard is already checked in to this shift.');
    } else {
      const checkInTime = new Date();
      const checkInLocation = {
        latitude: 40.7128, // Default NYC coordinates
        longitude: -74.0060,
        accuracy: 10,
        address: site.address,
        timestamp: checkInTime.toISOString(),
      };

      const updatedShift = await prisma.shift.update({
        where: { id: shift.id },
        data: {
          status: 'IN_PROGRESS',
          actualStartTime: checkInTime,
          checkInLocation: checkInLocation,
        },
      });

      console.log(`✅ Guard checked in successfully!`);
      console.log(`   Check-in time: ${checkInTime.toLocaleString()}`);
      console.log(`   Shift status: ${updatedShift.status}`);
    }

    console.log('\n✅ Success! Today\'s shift is ready for testing.');
    console.log('\n📊 Shift Details:');
    console.log(`   Shift ID: ${shift.id}`);
    console.log(`   Guard: ${guard.user.firstName} ${guard.user.lastName} (${guard.user.email})`);
    console.log(`   Site: ${site.name}`);
    console.log(`   Location: ${site.address}`);
    console.log(`   Status: IN_PROGRESS`);
    console.log(`\n🎯 You can now test:`);
    console.log(`   - Submit report`);
    console.log(`   - Emergency alert`);
    console.log(`   - Check-in/check-out features`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTodayShiftAndCheckIn()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((e) => {
    console.error('\n❌ Script failed:', e);
    process.exit(1);
  });

