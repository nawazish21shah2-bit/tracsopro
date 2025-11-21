// Seed script for shift reports - creates dummy report data
import { PrismaClient, ReportTypeEnum } from '@prisma/client';

const prisma = new PrismaClient();

async function seedReports() {
  try {
    console.log('🌱 Starting report seeding...\n');

    // Find a guard user (use the first guard found)
    const guardUser = await prisma.user.findFirst({
      where: { role: 'GUARD' },
      include: {
        guard: true,
      },
    });

    if (!guardUser) {
      console.log('❌ No guard user found. Please create a guard user first.');
      return;
    }

    console.log(`✅ Found guard user: ${guardUser.email}`);

    // Ensure guard profile exists
    if (!guardUser.guard) {
      console.log('❌ No guard profile found. Creating guard profile...');
      await prisma.guard.create({
        data: {
          userId: guardUser.id,
          employeeId: `GUARD-${Date.now()}`,
          status: 'ACTIVE',
        },
      });
      // Reload guard user with guard profile
      const updatedGuardUser = await prisma.user.findUnique({
        where: { id: guardUser.id },
        include: { guard: true },
      });
      if (updatedGuardUser) {
        guardUser = updatedGuardUser;
      }
    }

    // Find shifts for this guard (Shift.guardId references Guard.id)
    let shifts = await prisma.shift.findMany({
      where: {
        guardId: guardUser.guard.id,
      },
      orderBy: {
        scheduledStartTime: 'desc',
      },
      take: 20, // Get up to 20 shifts
    });

    // Create more shifts if we don't have enough (need at least 8 for all report types)
    const today = new Date();
    const neededShifts = Math.max(0, 8 - shifts.length);
    
    if (neededShifts > 0) {
      console.log(`📝 Creating ${neededShifts} additional shifts for reports...`);
      
      const locations = [
        { name: 'Ocean View Vila', address: '1321 Baker Street, NY' },
        { name: 'Downtown Plaza', address: '456 Main Street, NY' },
        { name: 'Riverside Complex', address: '789 River Road, NY' },
        { name: 'Business Center', address: '321 Commerce Ave, NY' },
      ];

      for (let i = 0; i < neededShifts; i++) {
        const daysAgo = shifts.length + i;
        const location = locations[i % locations.length];
        const shiftStart = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        shiftStart.setHours(8, 0, 0, 0); // 8:00 AM
        const shiftEnd = new Date(shiftStart.getTime() + 8 * 60 * 60 * 1000); // 8 hours later
        
        try {
          const shift = await prisma.shift.create({
            data: {
              guardId: guardUser.guard.id,
              locationName: location.name,
              locationAddress: location.address,
              scheduledStartTime: shiftStart,
              scheduledEndTime: shiftEnd,
              status: 'COMPLETED',
              description: 'Make sure to check the parking lot for illegal parkings.',
            },
          });
          shifts.push(shift);
        } catch (error) {
          if (error.code !== 'P2002') {
            console.error(`❌ Error creating shift:`, error.message);
          }
        }
      }
      
      // Re-fetch shifts to get them in order
      shifts = await prisma.shift.findMany({
        where: {
          guardId: guardUser.guard.id,
        },
        orderBy: {
          scheduledStartTime: 'desc',
        },
        take: 20,
      });
      
      console.log(`✅ Created ${neededShifts} additional shifts`);
    }

    console.log(`✅ Found ${shifts.length} shifts`);

    // Sample report contents matching the design
    const reportContents = [
      {
        type: ReportTypeEnum.SHIFT,
        content: 'We had no incident occured on the site, during my shift hours. All areas were secure and properly monitored.',
        daysAgo: 0,
      },
      {
        type: ReportTypeEnum.SHIFT,
        content: 'Completed regular patrol rounds. Checked all access points and perimeter. Everything is secure.',
        daysAgo: 1,
      },
      {
        type: ReportTypeEnum.INCIDENT,
        content: 'Reported suspicious activity near the main entrance. Individual was questioned and left the premises. No further action required.',
        daysAgo: 2,
      },
      {
        type: ReportTypeEnum.SHIFT,
        content: 'Routine shift completed successfully. All checkpoints verified. No issues to report.',
        daysAgo: 3,
      },
      {
        type: ReportTypeEnum.SHIFT,
        content: 'Night shift completed without incidents. All security systems functioning properly. Building secure.',
        daysAgo: 4,
      },
      {
        type: ReportTypeEnum.INCIDENT,
        content: 'Minor parking violation observed. Vehicle was parked in restricted area. Owner was notified and moved vehicle.',
        daysAgo: 5,
      },
      {
        type: ReportTypeEnum.SHIFT,
        content: 'Regular patrol completed. All areas checked and secured. No unauthorized access detected.',
        daysAgo: 6,
      },
      {
        type: ReportTypeEnum.SHIFT,
        content: 'Shift completed successfully. All entry and exit points monitored. Site is secure.',
        daysAgo: 7,
      },
    ];

    // Create reports for shifts
    let createdCount = 0;
    for (let i = 0; i < Math.min(reportContents.length, shifts.length); i++) {
      const reportData = reportContents[i];
      const shift = shifts[i];

      // Calculate submittedAt date
      const submittedAt = new Date();
      submittedAt.setDate(submittedAt.getDate() - reportData.daysAgo);
      submittedAt.setHours(15, 32, 0, 0); // Set to 3:32 PM as in design

      try {
        const report = await prisma.shiftReport.create({
          data: {
            shiftId: shift.id,
            guardId: guardUser.id, // ShiftReport uses User ID, not Guard ID
            reportType: reportData.type,
            content: reportData.content,
            submittedAt: submittedAt,
          },
        });

        createdCount++;
        console.log(`✅ Created ${reportData.type} report for shift ${shift.locationName} (${reportData.daysAgo} days ago)`);
      } catch (error) {
        // Check if report already exists
        if (error.code === 'P2002') {
          console.log(`⚠️  Report already exists for shift ${shift.id}, skipping...`);
        } else {
          console.error(`❌ Error creating report for shift ${shift.id}:`, error.message);
        }
      }
    }

    // If we have more shifts than reports, create additional reports
    if (shifts.length > reportContents.length) {
      for (let i = reportContents.length; i < shifts.length; i++) {
        const shift = shifts[i];
        const daysAgo = i;
        
        const submittedAt = new Date();
        submittedAt.setDate(submittedAt.getDate() - daysAgo);
        submittedAt.setHours(15, 32, 0, 0);

        try {
          await prisma.shiftReport.create({
            data: {
              shiftId: shift.id,
              guardId: guardUser.id,
              reportType: ReportTypeEnum.SHIFT,
              content: `Shift report for ${shift.locationName}. All duties completed successfully.`,
              submittedAt: submittedAt,
            },
          });
          createdCount++;
          console.log(`✅ Created additional report for shift ${shift.locationName}`);
        } catch (error) {
          if (error.code !== 'P2002') {
            console.error(`❌ Error creating report:`, error.message);
          }
        }
      }
    }

    console.log(`\n✅ Seeding complete! Created ${createdCount} reports.`);
    console.log(`📊 Total reports in database: ${await prisma.shiftReport.count()}`);

  } catch (error) {
    console.error('❌ Error seeding reports:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedReports()
  .then(() => {
    console.log('✅ Report seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Report seeding failed:', error);
    process.exit(1);
  });

