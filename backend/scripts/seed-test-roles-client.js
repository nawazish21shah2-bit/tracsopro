// Seed script for test@roles.com client with shifts and guards
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedTestRolesClient() {
  try {
    console.log('🌱 Starting seed for test@roles.com client...\n');

    const hashedPassword = await bcrypt.hash('password', 10);

    // Step 1: Create or get client user
    console.log('1. Creating test@roles.com client user...');
    
    let clientUser = await prisma.user.findUnique({
      where: { email: 'test@roles.com' }
    });
    
    if (!clientUser) {
      clientUser = await prisma.user.create({
        data: {
          email: 'test@roles.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'Client',
          phone: '+1-555-0100',
          role: 'CLIENT',
          accountType: 'COMPANY',
          isActive: true,
          isEmailVerified: true
        }
      });
      console.log('✅ Created client user: test@roles.com');
    } else {
      console.log('✅ Client user already exists: test@roles.com');
    }

    // Create or get client profile
    let client = await prisma.client.findUnique({
      where: { userId: clientUser.id }
    });
    
    if (!client) {
      client = await prisma.client.create({
        data: {
          userId: clientUser.id,
          accountType: 'COMPANY',
          companyName: 'Test Security Solutions Inc.',
          companyRegistrationNumber: 'TS123456789',
          taxId: 'TAX-TS-2024',
          address: '100 Test Business Plaza',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          website: 'https://testsecurity.com'
        }
      });
      console.log('✅ Created client profile');
    } else {
      console.log('✅ Client profile already exists');
    }

    // Step 2: Create guard users for this client
    console.log('\n2. Creating guard users...');
    
    const guardUsers = [];
    const guardNames = [
      { firstName: 'Michael', lastName: 'Anderson', email: 'michael.guard@test.com' },
      { firstName: 'Emily', lastName: 'Martinez', email: 'emily.guard@test.com' },
      { firstName: 'Robert', lastName: 'Taylor', email: 'robert.guard@test.com' },
      { firstName: 'Jessica', lastName: 'Thomas', email: 'jessica.guard@test.com' },
      { firstName: 'Daniel', lastName: 'Jackson', email: 'daniel.guard@test.com' }
    ];

    for (const guardData of guardNames) {
      let guardUser = await prisma.user.findUnique({
        where: { email: guardData.email }
      });
      
      if (!guardUser) {
        guardUser = await prisma.user.create({
          data: {
            email: guardData.email,
            password: hashedPassword,
            firstName: guardData.firstName,
            lastName: guardData.lastName,
            phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
            role: 'GUARD',
            isActive: true,
            isEmailVerified: true
          }
        });
      }
      guardUsers.push(guardUser);
    }

    // Create guard profiles
    const guards = [];
    const experiences = ['2-3 years', '3-5 years', '5+ years', '1-2 years', '3-5 years'];
    const departments = ['Security Operations', 'Patrol Division', 'Access Control', 'Emergency Response', 'Site Security'];
    
    for (let i = 0; i < guardUsers.length; i++) {
      let guard = await prisma.guard.findUnique({
        where: { userId: guardUsers[i].id }
      });
      
      if (!guard) {
        // Generate unique employee ID
        const timestamp = Date.now();
        const uniqueId = `TR${String(i + 1).padStart(3, '0')}${timestamp.toString().slice(-4)}`;
        
        guard = await prisma.guard.create({
          data: {
            userId: guardUsers[i].id,
            employeeId: uniqueId,
            department: departments[i],
            experience: experiences[i],
            status: 'ACTIVE',
            certificationUrls: [
              'https://example.com/cert1.pdf',
              'https://example.com/cert2.pdf'
            ]
          }
        });
      }
      guards.push(guard);
    }

    console.log(`✅ Created ${guards.length} guards`);

    // Step 3: Create sites for the client
    console.log('\n3. Creating sites...');
    
    const sitesData = [
      {
        name: 'Ocean View Vila',
        address: '1321 Baker Street, NY',
        latitude: 40.7128,
        longitude: -74.0060,
        description: 'Luxury residential complex with 24/7 security',
        requirements: 'Professional appearance, residential security experience'
      },
      {
        name: 'Central Business District',
        address: '500 Corporate Plaza, New York, NY 10002',
        latitude: 40.7589,
        longitude: -73.9851,
        description: 'Modern office building requiring comprehensive security',
        requirements: 'Corporate security experience, access control knowledge'
      },
      {
        name: 'Riverside Shopping Center',
        address: '789 Commerce Blvd, New York, NY 10003',
        latitude: 40.7505,
        longitude: -73.9934,
        description: 'Large retail complex with high foot traffic',
        requirements: 'Retail security experience, customer service skills'
      }
    ];

    const sites = [];
    for (const siteData of sitesData) {
      let site = await prisma.site.findFirst({
        where: {
          clientId: client.id,
          name: siteData.name
        }
      });
      
      if (!site) {
        site = await prisma.site.create({
          data: {
            clientId: client.id,
            name: siteData.name,
            address: siteData.address,
            latitude: siteData.latitude,
            longitude: siteData.longitude,
            description: siteData.description,
            requirements: siteData.requirements,
            isActive: true
          }
        });
      }
      sites.push(site);
    }

    console.log(`✅ Created ${sites.length} sites`);

    // Step 4: Create shift postings
    console.log('\n4. Creating shift postings...');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const shiftPostings = [];
    
    // Create shifts for each site
    for (const site of sites) {
      // Today's shifts (some active, some upcoming)
      const todayMorning = new Date(today);
      todayMorning.setHours(6, 0, 0, 0);
      const todayMorningEnd = new Date(todayMorning);
      todayMorningEnd.setHours(14, 0, 0, 0);
      
      const todayAfternoon = new Date(today);
      todayAfternoon.setHours(14, 0, 0, 0);
      const todayAfternoonEnd = new Date(todayAfternoon);
      todayAfternoonEnd.setHours(22, 0, 0, 0);
      
      // Tomorrow's shifts
      const tomorrowMorning = new Date(today);
      tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
      tomorrowMorning.setHours(6, 0, 0, 0);
      const tomorrowMorningEnd = new Date(tomorrowMorning);
      tomorrowMorningEnd.setHours(14, 0, 0, 0);
      
      // Create shift postings
      const shifts = [
        {
          clientId: client.id,
          siteId: site.id,
          title: `Morning Security - ${site.name}`,
          description: 'Morning shift - Site patrol and access control',
          startTime: todayMorning,
          endTime: todayMorningEnd,
          hourlyRate: 20.00,
          status: 'OPEN',
          maxGuards: 1
        },
        {
          clientId: client.id,
          siteId: site.id,
          title: `Afternoon Security - ${site.name}`,
          description: 'Afternoon shift - Security monitoring and incident response',
          startTime: todayAfternoon,
          endTime: todayAfternoonEnd,
          hourlyRate: 22.00,
          status: 'OPEN',
          maxGuards: 1
        },
        {
          clientId: client.id,
          siteId: site.id,
          title: `Morning Security - ${site.name}`,
          description: 'Morning shift - Site patrol and access control',
          startTime: tomorrowMorning,
          endTime: tomorrowMorningEnd,
          hourlyRate: 20.00,
          status: 'OPEN',
          maxGuards: 1
        }
      ];
      
      for (const shiftData of shifts) {
        let shiftPosting = await prisma.shiftPosting.findFirst({
          where: {
            siteId: shiftData.siteId,
            startTime: shiftData.startTime
          }
        });
        
        if (!shiftPosting) {
          shiftPosting = await prisma.shiftPosting.create({
            data: shiftData
          });
        }
        shiftPostings.push(shiftPosting);
      }
    }

    console.log(`✅ Created ${shiftPostings.length} shift postings`);

    // Step 5: Create shift assignments (assign guards to shifts)
    console.log('\n5. Creating shift assignments...');
    
    const shiftAssignments = [];
    
    // Assign guards to today's shifts
    for (let i = 0; i < Math.min(guards.length, shiftPostings.length); i++) {
      const shiftPosting = shiftPostings[i];
      const guard = guards[i];
      
      // Check if assignment already exists
      let assignment = await prisma.shiftAssignment.findFirst({
        where: {
          guardId: guard.id,
          shiftPostingId: shiftPosting.id
        }
      });
      
      if (!assignment) {
        // Determine status based on shift time
        const now = new Date();
        let status = 'ASSIGNED';
        let actualStartTime = null;
        let actualEndTime = null;
        
        if (shiftPosting.startTime <= now && shiftPosting.endTime >= now) {
          status = 'IN_PROGRESS';
          actualStartTime = shiftPosting.startTime;
        } else if (shiftPosting.endTime < now) {
          status = 'COMPLETED';
          actualStartTime = shiftPosting.startTime;
          actualEndTime = shiftPosting.endTime;
        }
        
        assignment = await prisma.shiftAssignment.create({
          data: {
            guardId: guard.id,
            shiftPostingId: shiftPosting.id,
            siteId: shiftPosting.siteId,
            startTime: shiftPosting.startTime,
            endTime: shiftPosting.endTime,
            status: status,
            checkInTime: status === 'IN_PROGRESS' ? shiftPosting.startTime : null,
            checkOutTime: status === 'COMPLETED' ? shiftPosting.endTime : null,
            checkInLatitude: status === 'IN_PROGRESS' ? 40.7128 + (Math.random() * 0.01 - 0.005) : null,
            checkInLongitude: status === 'IN_PROGRESS' ? -74.0060 + (Math.random() * 0.01 - 0.005) : null,
            checkOutLatitude: status === 'COMPLETED' ? 40.7128 + (Math.random() * 0.01 - 0.005) : null,
            checkOutLongitude: status === 'COMPLETED' ? -74.0060 + (Math.random() * 0.01 - 0.005) : null
          }
        });
      }
      shiftAssignments.push(assignment);
    }

    console.log(`✅ Created ${shiftAssignments.length} shift assignments`);

    // Step 6: Create some tracking records for active guards
    console.log('\n6. Creating tracking records...');
    
    const activeAssignments = shiftAssignments.filter(a => a.status === 'IN_PROGRESS');
    
    for (const assignment of activeAssignments.slice(0, 3)) {
      const guard = guards.find(g => g.id === assignment.guardId);
      if (!guard) continue;
      
      // Create tracking record
      await prisma.trackingRecord.create({
        data: {
          guardId: guard.id,
          latitude: 40.7128 + (Math.random() * 0.01 - 0.005),
          longitude: -74.0060 + (Math.random() * 0.01 - 0.005),
          accuracy: Math.floor(Math.random() * 20) + 5,
          batteryLevel: Math.floor(Math.random() * 30) + 70,
          timestamp: new Date()
        }
      });
    }

    console.log('✅ Created tracking records');

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Client: test@roles.com`);
    console.log(`   - Guards: ${guards.length}`);
    console.log(`   - Sites: ${sites.length}`);
    console.log(`   - Shift Postings: ${shiftPostings.length}`);
    console.log(`   - Shift Assignments: ${shiftAssignments.length}`);
    console.log('\n🔑 Login credentials:');
    console.log('   Email: test@roles.com');
    console.log('   Password: password');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestRolesClient()
  .then(() => {
    console.log('\n✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });

