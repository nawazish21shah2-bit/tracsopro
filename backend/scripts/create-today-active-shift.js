// Script to create today's active shift (already in progress) for testing
import { PrismaClient } from '@prisma/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load .env from backend root even if CWD is scripts/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function createTodayActiveShift() {
  try {
    console.log('🚀 Creating today\'s active shift (already in progress)...\n');

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
      let client = await prisma.client.findFirst();
      
      if (!client) {
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

    // Step 3: Create today's shift that's already in progress
    console.log('3. Creating today\'s active shift...');
    const now = new Date();
    
    // Create shift that started a few hours ago today and ends later today/tonight
    const todayStart = new Date(now);
    todayStart.setHours(Math.max(6, now.getHours() - 2), 0, 0, 0); // Started 2 hours ago or 6 AM, whichever is later
    
    const todayEnd = new Date(now);
    todayEnd.setHours(22, 0, 0, 0); // Ends at 10 PM today
    
    // Check if an active shift already exists for today
    const existingActiveShift = await prisma.shift.findFirst({
      where: {
        guardId: guard.id,
        status: 'IN_PROGRESS',
        scheduledStartTime: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0),
        },
      },
    });

    if (existingActiveShift) {
      console.log(`✅ Active shift already exists for today!`);
      console.log(`   Shift ID: ${existingActiveShift.id}`);
      console.log(`   Status: ${existingActiveShift.status}`);
      console.log(`\n📊 Shift Details:`);
      console.log(`   Shift ID: ${existingActiveShift.id}`);
      console.log(`   Guard: ${guard.user.firstName} ${guard.user.lastName} (${guard.user.email})`);
      console.log(`   Status: IN_PROGRESS`);
      console.log(`\n🎯 You can now test:`);
      console.log(`   - Submit report`);
      console.log(`   - Emergency alert`);
      console.log(`   - Check-in/check-out features`);
      return;
    }

    // Check for any scheduled shift for today that we can check in
    const existingScheduledShift = await prisma.shift.findFirst({
      where: {
        guardId: guard.id,
        status: 'SCHEDULED',
        scheduledStartTime: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0),
        },
      },
    });

    let shift;
    if (existingScheduledShift) {
      console.log(`   Found scheduled shift for today. Using it...`);
      shift = existingScheduledShift;
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
          description: 'Active test shift for today - created by script',
          status: 'SCHEDULED',
        },
      });
      console.log(`✅ Created shift: ${shift.id}`);
    }
    
    console.log(`   Scheduled Start: ${todayStart.toLocaleString()}`);
    console.log(`   Scheduled End: ${todayEnd.toLocaleString()}\n`);

    // Step 4: Check in the guard immediately
    console.log('4. Checking in guard to shift...');
    
    const checkInTime = new Date(Math.max(todayStart.getTime(), now.getTime() - 2 * 60 * 60 * 1000)); // 2 hours ago or shift start, whichever is later
    const checkInLocation = {
      latitude: 40.7128, // Default NYC coordinates (you can update this)
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

    console.log('\n✅ Success! Today\'s active shift is ready for testing.');
    console.log('\n📊 Shift Details:');
    console.log(`   Shift ID: ${shift.id}`);
    console.log(`   Guard: ${guard.user.firstName} ${guard.user.lastName} (${guard.user.email})`);
    console.log(`   Site: ${site.name}`);
    console.log(`   Location: ${site.address}`);
    console.log(`   Status: IN_PROGRESS`);
    console.log(`   Started: ${checkInTime.toLocaleString()}`);
    console.log(`\n🎯 You can now test:`);
    console.log(`   - Submit report`);
    console.log(`   - Emergency alert`);
    console.log(`   - Other shift features`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTodayActiveShift()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((e) => {
    console.error('\n❌ Script failed:', e);
    process.exit(1);
  });

