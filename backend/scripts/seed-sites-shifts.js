// Comprehensive seed script for sites, shifts, and related data
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedSitesAndShifts() {
  try {
    console.log('🌱 Starting comprehensive seeding...\n');

    // Step 1: Create test users if they don't exist
    console.log('1. Creating test users...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create client user
    let clientUser = await prisma.user.findUnique({
      where: { email: 'client@test.com' }
    });
    
    if (!clientUser) {
      clientUser = await prisma.user.create({
        data: {
          email: 'client@test.com',
          password: hashedPassword,
          firstName: 'John',
          lastName: 'Client',
          phone: '+1-555-0101',
          role: 'CLIENT',
          accountType: 'COMPANY',
          isActive: true,
          isEmailVerified: true
        }
      });
    }

    // Create client profile
    let client = await prisma.client.findUnique({
      where: { userId: clientUser.id }
    });
    
    if (!client) {
      client = await prisma.client.create({
        data: {
          userId: clientUser.id,
          accountType: 'COMPANY',
          companyName: 'SecureGuard Solutions Inc.',
          companyRegistrationNumber: 'SG123456789',
          taxId: 'TAX-SG-2024',
          address: '123 Business Plaza',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          website: 'https://secureguard.com'
        }
      });
    }

    // Create guard users
    const guardUsers = [];
    const guardNames = [
      { firstName: 'Mike', lastName: 'Johnson', email: 'mike.guard@test.com' },
      { firstName: 'Sarah', lastName: 'Williams', email: 'sarah.guard@test.com' },
      { firstName: 'David', lastName: 'Brown', email: 'david.guard@test.com' },
      { firstName: 'Lisa', lastName: 'Davis', email: 'lisa.guard@test.com' },
      { firstName: 'James', lastName: 'Wilson', email: 'james.guard@test.com' }
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
    const experiences = ['1-2 years', '3-5 years', '5+ years', '2-3 years', '3-5 years'];
    
    for (let i = 0; i < guardUsers.length; i++) {
      let guard = await prisma.guard.findUnique({
        where: { userId: guardUsers[i].id }
      });
      
      if (!guard) {
        guard = await prisma.guard.create({
          data: {
            userId: guardUsers[i].id,
            employeeId: `GRD${String(i + 1).padStart(3, '0')}`,
            department: 'Security Operations',
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

    console.log(`✅ Created ${guardUsers.length} guards and 1 client`);

    // Step 2: Create sites
    console.log('\n2. Creating sites...');
    
    const sitesData = [
      {
        name: 'Downtown Corporate Center',
        address: '456 Business Ave, New York, NY 10002',
        latitude: 40.7589,
        longitude: -73.9851,
        description: 'Modern corporate office building with 24/7 security needs',
        requirements: 'Licensed security guard with corporate experience, minimum 2 years'
      },
      {
        name: 'Riverside Shopping Mall',
        address: '789 Commerce Blvd, New York, NY 10003',
        latitude: 40.7505,
        longitude: -73.9934,
        description: 'Large shopping complex requiring patrol and customer assistance',
        requirements: 'Retail security experience preferred, customer service skills required'
      },
      {
        name: 'Metro Hospital Complex',
        address: '321 Health St, New York, NY 10004',
        latitude: 40.7614,
        longitude: -73.9776,
        description: 'Medical facility requiring sensitive security protocols',
        requirements: 'Healthcare security certification, background check required'
      },
      {
        name: 'Tech Innovation Hub',
        address: '654 Innovation Dr, New York, NY 10005',
        latitude: 40.7549,
        longitude: -73.9840,
        description: 'Technology campus with multiple buildings and parking areas',
        requirements: 'Tech industry experience, access control system knowledge'
      },
      {
        name: 'Luxury Residential Tower',
        address: '987 Elite Ave, New York, NY 10006',
        latitude: 40.7580,
        longitude: -73.9855,
        description: 'High-end residential building with concierge security services',
        requirements: 'Residential security experience, professional appearance mandatory'
      }
    ];

    const sites = [];
    for (const siteData of sitesData) {
      const existingSite = await prisma.site.findFirst({
        where: { 
          clientId: client.id,
          name: siteData.name 
        }
      });
      
      if (!existingSite) {
        const site = await prisma.site.create({
          data: {
            clientId: client.id,
            ...siteData
          }
        });
        sites.push(site);
      } else {
        sites.push(existingSite);
      }
    }

    console.log(`✅ Created ${sites.length} sites`);

    // Step 3: Create shift postings
    console.log('\n3. Creating shift postings...');
    
    const shiftPostings = [];
    const currentDate = new Date();
    
    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];
      
      // Create 3 shift postings per site (past, current, future)
      const shifts = [
        {
          title: `Morning Security - ${site.name}`,
          description: 'Morning shift security coverage with patrol duties',
          startTime: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          endTime: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8 hours later
          hourlyRate: 18.50,
          status: 'COMPLETED',
          maxGuards: 1
        },
        {
          title: `Day Shift Security - ${site.name}`,
          description: 'Day shift security with customer interaction',
          startTime: new Date(currentDate.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
          endTime: new Date(currentDate.getTime() + 9 * 60 * 60 * 1000), // 8 hours later
          hourlyRate: 20.00,
          status: 'OPEN',
          maxGuards: 1
        },
        {
          title: `Night Security - ${site.name}`,
          description: 'Overnight security patrol and monitoring',
          startTime: new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          endTime: new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 10 hours later
          hourlyRate: 22.00,
          status: 'OPEN',
          maxGuards: 2
        }
      ];

      for (const shiftData of shifts) {
        const existingPosting = await prisma.shiftPosting.findFirst({
          where: {
            clientId: client.id,
            siteId: site.id,
            title: shiftData.title
          }
        });

        if (!existingPosting) {
          const posting = await prisma.shiftPosting.create({
            data: {
              clientId: client.id,
              siteId: site.id,
              ...shiftData
            }
          });
          shiftPostings.push(posting);
        } else {
          shiftPostings.push(existingPosting);
        }
      }
    }

    console.log(`✅ Created ${shiftPostings.length} shift postings`);

    // Step 4: Create shift applications
    console.log('\n4. Creating shift applications...');
    
    let applicationCount = 0;
    for (const posting of shiftPostings) {
      if (posting.status === 'OPEN') {
        // Create 2-3 applications per open posting
        const numApplications = Math.floor(Math.random() * 2) + 2;
        const selectedGuards = guards.slice(0, numApplications);
        
        for (const guard of selectedGuards) {
          const existingApplication = await prisma.shiftApplication.findUnique({
            where: {
              shiftPostingId_guardId: {
                shiftPostingId: posting.id,
                guardId: guard.id
              }
            }
          });

          if (!existingApplication) {
            await prisma.shiftApplication.create({
              data: {
                shiftPostingId: posting.id,
                guardId: guard.id,
                message: `I'm interested in this ${posting.title} position. I have relevant experience and am available for the scheduled time.`,
                status: Math.random() > 0.5 ? 'PENDING' : 'APPROVED'
              }
            });
            applicationCount++;
          }
        }
      }
    }

    console.log(`✅ Created ${applicationCount} shift applications`);

    // Step 5: Create shift assignments
    console.log('\n5. Creating shift assignments...');
    
    let assignmentCount = 0;
    for (const posting of shiftPostings) {
      // Assign guards to completed and some open postings
      if (posting.status === 'COMPLETED' || (posting.status === 'OPEN' && Math.random() > 0.5)) {
        const randomGuard = guards[Math.floor(Math.random() * guards.length)];
        
        const existingAssignment = await prisma.shiftAssignment.findFirst({
          where: {
            shiftPostingId: posting.id,
            guardId: randomGuard.id
          }
        });

        if (!existingAssignment) {
          let status = 'ASSIGNED';
          let checkInTime = null;
          let checkOutTime = null;
          
          if (posting.status === 'COMPLETED') {
            status = 'COMPLETED';
            checkInTime = new Date(posting.startTime.getTime() + 5 * 60 * 1000); // 5 min after start
            checkOutTime = new Date(posting.endTime.getTime() - 10 * 60 * 1000); // 10 min before end
          } else if (posting.startTime < currentDate) {
            status = 'IN_PROGRESS';
            checkInTime = new Date(posting.startTime.getTime() + 3 * 60 * 1000); // 3 min after start
          }

          await prisma.shiftAssignment.create({
            data: {
              shiftPostingId: posting.id,
              siteId: posting.siteId,
              guardId: randomGuard.id,
              startTime: posting.startTime,
              endTime: posting.endTime,
              status,
              checkInTime,
              checkOutTime,
              checkInLatitude: checkInTime ? 40.7589 + (Math.random() - 0.5) * 0.001 : null,
              checkInLongitude: checkInTime ? -73.9851 + (Math.random() - 0.5) * 0.001 : null,
              checkOutLatitude: checkOutTime ? 40.7589 + (Math.random() - 0.5) * 0.001 : null,
              checkOutLongitude: checkOutTime ? -73.9851 + (Math.random() - 0.5) * 0.001 : null,
              notes: status === 'COMPLETED' ? 'Shift completed successfully. All security protocols followed.' : null
            }
          });
          assignmentCount++;
        }
      }
    }

    console.log(`✅ Created ${assignmentCount} shift assignments`);

    // Step 6: Create shifts (for guard dashboard)
    console.log('\n6. Creating shifts for guard dashboard...');
    
    let shiftCount = 0;
    for (const guard of guards.slice(0, 3)) { // Create shifts for first 3 guards
      const guardSites = sites.slice(0, 3); // Use first 3 sites
      
      for (let i = 0; i < 5; i++) { // 5 shifts per guard
        const site = guardSites[i % guardSites.length];
        const daysOffset = i - 2; // -2, -1, 0, 1, 2 (past, current, future)
        const startTime = new Date(currentDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
        startTime.setHours(8 + (i % 3) * 8, 0, 0, 0); // 8am, 4pm, 12am shifts
        
        const endTime = new Date(startTime.getTime() + 8 * 60 * 60 * 1000); // 8-hour shifts
        
        let status = 'SCHEDULED';
        let checkInTime = null;
        let checkOutTime = null;
        let actualDuration = null;
        
        if (daysOffset < 0) {
          status = 'COMPLETED';
          checkInTime = new Date(startTime.getTime() + 5 * 60 * 1000);
          checkOutTime = new Date(endTime.getTime() - 5 * 60 * 1000);
          actualDuration = Math.floor((checkOutTime - checkInTime) / (1000 * 60)); // in minutes
        } else if (daysOffset === 0 && startTime < currentDate) {
          status = 'IN_PROGRESS';
          checkInTime = new Date(startTime.getTime() + 3 * 60 * 1000);
        }

        const existingShift = await prisma.shift.findFirst({
          where: {
            guardId: guard.userId,
            locationName: site.name,
            startTime: startTime
          }
        });

        if (!existingShift) {
          await prisma.shift.create({
            data: {
              guardId: guard.userId,
              locationName: site.name,
              locationAddress: site.address,
              startTime,
              endTime,
              status,
              description: `Security shift at ${site.name}`,
              checkInTime,
              checkOutTime,
              actualDuration,
              notes: status === 'COMPLETED' ? 'Shift completed successfully' : null
            }
          });
          shiftCount++;
        }
      }
    }

    console.log(`✅ Created ${shiftCount} shifts for guard dashboard`);

    // Step 7: Create some shift reports
    console.log('\n7. Creating shift reports...');
    
    const completedShifts = await prisma.shift.findMany({
      where: { status: 'COMPLETED' },
      take: 10
    });

    let reportCount = 0;
    for (const shift of completedShifts) {
      if (Math.random() > 0.6) { // 40% chance of having a report
        const reportTypes = ['SHIFT', 'INCIDENT', 'EMERGENCY'];
        const reportType = reportTypes[Math.floor(Math.random() * reportTypes.length)];
        
        const reportContents = {
          SHIFT: 'Routine patrol completed. All areas secured. No incidents to report.',
          INCIDENT: 'Minor disturbance in parking area. Situation resolved peacefully. Incident logged.',
          EMERGENCY: 'Medical emergency in lobby. First aid provided. Ambulance called and arrived promptly.'
        };

        const existingReport = await prisma.shiftReport.findFirst({
          where: {
            shiftId: shift.id,
            guardId: shift.guardId
          }
        });

        if (!existingReport) {
          await prisma.shiftReport.create({
            data: {
              shiftId: shift.id,
              guardId: shift.guardId,
              reportType,
              content: reportContents[reportType]
            }
          });
          reportCount++;
        }
      }
    }

    console.log(`✅ Created ${reportCount} shift reports`);

    // Step 8: Create user settings (skip for now due to Prisma client issue)
    console.log('\n8. Skipping user settings (will be created on first login)...');
    const settingsCount = 0;

    // Summary
    console.log('\n🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    console.log(`👥 Users: 1 client + ${guardUsers.length} guards`);
    console.log(`🏢 Sites: ${sites.length}`);
    console.log(`📋 Shift Postings: ${shiftPostings.length}`);
    console.log(`📝 Applications: ${applicationCount}`);
    console.log(`🔄 Assignments: ${assignmentCount}`);
    console.log(`⏰ Shifts: ${shiftCount}`);
    console.log(`📊 Reports: ${reportCount}`);
    console.log(`⚙️  Settings: ${settingsCount}`);
    console.log('=====================================');
    
    console.log('\n📱 TEST ACCOUNTS:');
    console.log('Client: client@test.com / password123');
    guardUsers.forEach((user, i) => {
      console.log(`Guard ${i + 1}: ${user.email} / password123`);
    });

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedSitesAndShifts()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
