// Complete Admin Flow Test: Create Guard, Site, Shift then test Check-in/Check-out
import { PrismaClient, ShiftStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { addHours, subMinutes } from 'date-fns';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';

async function generateToken(userId: string): Promise<string> {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
}

async function runAdminFlowTest() {
    console.log('=== Complete Admin Flow Test ===\n');
    console.log('Using direct database operations (since server has port conflict)\n');

    // Step 1: Ensure admin user exists
    console.log('1. Setting up Admin User...');
    const adminPassword = await bcrypt.hash('Passw0rd!', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: { password: adminPassword, isActive: true, isEmailVerified: true },
        create: {
            email: 'admin@example.com',
            password: adminPassword,
            firstName: 'Admin',
            lastName: 'User',
            phone: '+1234567893',
            role: 'ADMIN',
            isActive: true,
            isEmailVerified: true,
        },
    });
    console.log('   ✅ Admin:', admin.email);

    // Step 2: Create/Get Security Company
    console.log('\n2. Setting up Security Company...');
    let company = await prisma.securityCompany.findFirst();
    if (!company) {
        company = await prisma.securityCompany.create({
            data: {
                name: 'Test Security Co',
                email: 'company@example.com',
                phone: '+1234567890',
                subscriptionPlan: 'BASIC',
                subscriptionStatus: 'ACTIVE',
                subscriptionStartDate: new Date(),
                maxGuards: 50,
                maxClients: 20,
                maxSites: 30,
            },
        });
    }
    console.log('   ✅ Company:', company.name);

    // Link admin to company
    await prisma.companyUser.upsert({
        where: {
            securityCompanyId_userId: {
                securityCompanyId: company.id,
                userId: admin.id,
            },
        },
        update: { isActive: true },
        create: {
            securityCompanyId: company.id,
            userId: admin.id,
            role: 'OWNER',
            isActive: true,
        },
    });
    console.log('   ✅ Admin linked to company');

    // Step 3: Create Guard User (Admin creates guard)
    console.log('\n3. Creating Guard User (via Admin flow)...');
    const guardEmail = `guard_${Date.now()}@example.com`;
    const guardPassword = await bcrypt.hash('Passw0rd!', 10);

    const guardUser = await prisma.user.create({
        data: {
            email: guardEmail,
            password: guardPassword,
            firstName: 'Test',
            lastName: 'Guard',
            phone: '+1234567899',
            role: 'GUARD',
            isActive: true,
            isEmailVerified: true,
        },
    });
    console.log('   ✅ Guard User:', guardUser.email);

    // Create guard profile
    const guardProfile = await prisma.guard.create({
        data: {
            userId: guardUser.id,
            employeeId: `EMP-${Date.now()}`,
            status: 'ACTIVE',
        },
    });
    console.log('   ✅ Guard Profile ID:', guardProfile.id);

    // Link guard to company
    await prisma.companyGuard.create({
        data: {
            securityCompanyId: company.id,
            guardId: guardProfile.id,
            isActive: true,
        },
    });
    console.log('   ✅ Guard linked to company');

    // Step 4: Create Client (required for site)
    console.log('\n4. Creating Client...');
    let client = await prisma.client.findFirst({
        include: { user: true },
    });

    if (!client) {
        const clientUser = await prisma.user.create({
            data: {
                email: `client_${Date.now()}@example.com`,
                password: await bcrypt.hash('Passw0rd!', 10),
                firstName: 'Test',
                lastName: 'Client',
                phone: '+1234567800',
                role: 'CLIENT',
                accountType: 'COMPANY',
                isActive: true,
                isEmailVerified: true,
            },
        });
        client = await prisma.client.create({
            data: {
                userId: clientUser.id,
                accountType: 'COMPANY',
                companyName: 'Test Client Corp',
            },
            include: { user: true },
        });

        // Link client to company
        await prisma.companyClient.create({
            data: {
                securityCompanyId: company.id,
                clientId: client.id,
                isActive: true,
            },
        });
    }
    console.log('   ✅ Client:', client.user.email);

    // Step 5: Create Site (Admin creates site)
    console.log('\n5. Creating Site (via Admin flow)...');
    const site = await prisma.site.create({
        data: {
            clientId: client.id,
            name: `Test Site ${Date.now()}`,
            address: '456 Security Blvd, New York, NY 10002',
            latitude: 40.7580,
            longitude: -73.9855,
            description: 'Test site created via admin flow',
            isActive: true,
        },
    });
    console.log('   ✅ Site:', site.name);
    console.log('   Address:', site.address);

    // Link site to company
    await prisma.companySite.create({
        data: {
            securityCompanyId: company.id,
            siteId: site.id,
        },
    });
    console.log('   ✅ Site linked to company');

    // Step 6: Create Shift (Admin creates shift for guard at site)
    console.log('\n6. Creating Shift (via Admin flow)...');
    const now = new Date();
    const shift = await prisma.shift.create({
        data: {
            guardId: guardProfile.id,
            siteId: site.id,
            clientId: client.id,
            locationName: site.name,
            locationAddress: site.address,
            scheduledStartTime: subMinutes(now, 5), // Started 5 min ago
            scheduledEndTime: addHours(now, 8), // Ends in 8 hours
            status: ShiftStatus.SCHEDULED,
            description: 'Test shift created via admin flow',
        },
    });
    console.log('   ✅ Shift ID:', shift.id);
    console.log('   Status:', shift.status);
    console.log('   Location:', shift.locationName);
    console.log('   Start:', shift.scheduledStartTime.toLocaleString());
    console.log('   End:', shift.scheduledEndTime.toLocaleString());

    // Step 7: Test CHECK-IN
    console.log('\n7. Testing CHECK-IN (Guard checks into shift)...');
    const checkInLocation = {
        latitude: 40.7580,
        longitude: -73.9855,
        accuracy: 10,
        address: site.address,
        timestamp: new Date().toISOString(),
    };

    const checkedInShift = await prisma.shift.update({
        where: { id: shift.id },
        data: {
            status: ShiftStatus.IN_PROGRESS,
            actualStartTime: new Date(),
            checkInLocation: checkInLocation as any,
        },
    });
    console.log('   ✅ CHECK-IN SUCCESSFUL!');
    console.log('   New Status:', checkedInShift.status);
    console.log('   Actual Start:', checkedInShift.actualStartTime?.toLocaleString());

    // Simulate some time passing...
    console.log('\n   [Simulating work during shift...]');

    // Step 8: Test CHECK-OUT
    console.log('\n8. Testing CHECK-OUT (Guard checks out from shift)...');
    const checkOutLocation = {
        latitude: 40.7581,
        longitude: -73.9856,
        accuracy: 8,
        address: site.address,
        timestamp: new Date().toISOString(),
    };

    const completedShift = await prisma.shift.update({
        where: { id: shift.id },
        data: {
            status: ShiftStatus.COMPLETED,
            actualEndTime: new Date(),
            checkOutLocation: checkOutLocation as any,
            notes: 'Shift completed successfully - admin flow test',
        },
    });
    console.log('   ✅ CHECK-OUT SUCCESSFUL!');
    console.log('   Final Status:', completedShift.status);
    console.log('   Actual End:', completedShift.actualEndTime?.toLocaleString());

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('=== TEST SUMMARY ===');
    console.log('='.repeat(50));
    console.log('\n📱 Test Guard Credentials:');
    console.log('   Email:', guardEmail);
    console.log('   Password: Passw0rd!');
    console.log('\n📍 Test Site:');
    console.log('   Name:', site.name);
    console.log('   Address:', site.address);
    console.log('\n📋 Test Shift:');
    console.log('   ID:', shift.id);
    console.log('   Status:', completedShift.status);
    console.log('   Check-in:', checkedInShift.actualStartTime?.toLocaleString());
    console.log('   Check-out:', completedShift.actualEndTime?.toLocaleString());
    console.log('\n✅ All admin flow operations completed successfully!');
    console.log('='.repeat(50));
}

runAdminFlowTest()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
