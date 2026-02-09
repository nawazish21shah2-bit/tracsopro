import { PrismaClient, ShiftStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addHours, subMinutes } from 'date-fns';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function seedFullTestData() {
    console.log('🌱 Creating complete test data...\n');

    const password = await bcrypt.hash('password', 10);

    // ========================================
    // 1. Create Admin User
    // ========================================
    const adminUser = await prisma.user.upsert({
        where: { email: 'ad@asd.com' },
        update: { isEmailVerified: true, isActive: true },
        create: {
            email: 'ad@asd.com',
            password,
            firstName: 'Admin',
            lastName: 'Test',
            phone: '+1111111111',
            role: 'ADMIN',
            isEmailVerified: true,
            isActive: true,
        },
    });
    console.log('✅ Admin: ad@asd.com / password');

    // ========================================
    // 2. Create Security Company
    // ========================================
    const company = await prisma.securityCompany.upsert({
        where: { email: 'ad@asd.com' },
        update: {},
        create: {
            name: 'Test Security Co',
            email: 'ad@asd.com',
            phone: '+1111111111',
            subscriptionPlan: 'PROFESSIONAL',
            subscriptionStatus: 'ACTIVE',
            subscriptionStartDate: new Date(),
            maxGuards: 50,
            maxClients: 20,
            maxSites: 30,
        },
    });

    // Link admin to company
    await prisma.companyUser.upsert({
        where: {
            securityCompanyId_userId: {
                securityCompanyId: company.id,
                userId: adminUser.id,
            },
        },
        update: {},
        create: {
            securityCompanyId: company.id,
            userId: adminUser.id,
            role: 'OWNER',
            isActive: true,
        },
    });
    console.log('✅ Security Company: Test Security Co');

    // ========================================
    // 3. Create Client User
    // ========================================
    const clientUser = await prisma.user.upsert({
        where: { email: 'client@asd.com' },
        update: { isEmailVerified: true, isActive: true },
        create: {
            email: 'client@asd.com',
            password,
            firstName: 'Client',
            lastName: 'Test',
            phone: '+2222222222',
            role: 'CLIENT',
            accountType: 'COMPANY',
            isEmailVerified: true,
            isActive: true,
        },
    });

    const clientProfile = await prisma.client.upsert({
        where: { userId: clientUser.id },
        update: {},
        create: {
            userId: clientUser.id,
            accountType: 'COMPANY',
            companyName: 'Test Client Corp',
            address: '100 Client Street',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
        },
    });

    // Link client to company
    await prisma.companyClient.upsert({
        where: {
            securityCompanyId_clientId: {
                securityCompanyId: company.id,
                clientId: clientProfile.id,
            },
        },
        update: {},
        create: {
            securityCompanyId: company.id,
            clientId: clientProfile.id,
            isActive: true,
        },
    });
    console.log('✅ Client: client@asd.com / password');

    // ========================================
    // 4. Create Guard User
    // ========================================
    const guardUser = await prisma.user.upsert({
        where: { email: 'guard@asd.com' },
        update: { isEmailVerified: true, isActive: true },
        create: {
            email: 'guard@asd.com',
            password,
            firstName: 'Guard',
            lastName: 'Test',
            phone: '+3333333333',
            role: 'GUARD',
            isEmailVerified: true,
            isActive: true,
        },
    });

    const guardProfile = await prisma.guard.upsert({
        where: { userId: guardUser.id },
        update: { status: 'ACTIVE' },
        create: {
            userId: guardUser.id,
            employeeId: `EMP-${Date.now()}`,
            department: 'Security',
            status: 'ACTIVE',
        },
    });

    // Link guard to company
    await prisma.companyGuard.upsert({
        where: {
            securityCompanyId_guardId: {
                securityCompanyId: company.id,
                guardId: guardProfile.id,
            },
        },
        update: {},
        create: {
            securityCompanyId: company.id,
            guardId: guardProfile.id,
            isActive: true,
        },
    });
    console.log('✅ Guard: guard@asd.com / password');

    // ========================================
    // 5. Create Active Site
    // ========================================
    const site = await prisma.site.upsert({
        where: { id: 'test-site-001' },
        update: {},
        create: {
            id: 'test-site-001',
            clientId: clientProfile.id,
            name: 'Test Security Site',
            address: '123 Main Street, New York, NY 10001',
            latitude: 40.7128,
            longitude: -74.0060,
            description: 'Main security checkpoint',
            isActive: true,
        },
    });
    console.log('✅ Site: Test Security Site');

    // ========================================
    // 6. Delete old shifts for this guard
    // ========================================
    await prisma.shift.deleteMany({
        where: { guardId: guardProfile.id },
    });

    // ========================================
    // 7. Create SCHEDULED Shift (Ready for Check-in)
    // ========================================
    const now = new Date();
    const scheduledShift = await prisma.shift.create({
        data: {
            guardId: guardProfile.id,
            siteId: site.id,
            clientId: clientProfile.id,
            locationName: site.name,
            locationAddress: site.address,
            scheduledStartTime: subMinutes(now, 10), // Started 10 min ago
            scheduledEndTime: addHours(now, 8),
            status: ShiftStatus.SCHEDULED,
            description: 'Day shift - Ready for CHECK-IN',
        },
    });
    console.log('✅ SCHEDULED Shift: Ready for CHECK-IN');

    // ========================================
    // 8. Create IN_PROGRESS Shift (Ready for Check-out)
    // ========================================
    const activeShift = await prisma.shift.create({
        data: {
            guardId: guardProfile.id,
            siteId: site.id,
            clientId: clientProfile.id,
            locationName: site.name,
            locationAddress: site.address,
            scheduledStartTime: subMinutes(now, 120), // Started 2 hours ago
            scheduledEndTime: addHours(now, 6),
            actualStartTime: subMinutes(now, 118), // Checked in 1hr 58min ago
            status: ShiftStatus.IN_PROGRESS,
            description: 'Active shift - Ready for CHECK-OUT',
            checkInLocation: {
                latitude: 40.7128,
                longitude: -74.0060,
                accuracy: 10,
                address: '123 Main Street, New York',
            },
        },
    });
    console.log('✅ IN_PROGRESS Shift: Ready for CHECK-OUT');

    // ========================================
    // Summary
    // ========================================
    console.log('\n' + '='.repeat(50));
    console.log('🎉 TEST DATA CREATED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📋 LOGIN CREDENTIALS:\n');
    console.log('   ADMIN:  ad@asd.com / password');
    console.log('   CLIENT: client@asd.com / password');
    console.log('   GUARD:  guard@asd.com / password');
    console.log('\n📍 SITE: Test Security Site');
    console.log('\n📅 SHIFTS:');
    console.log(`   1. SCHEDULED (ID: ${scheduledShift.id.slice(0, 8)}...) - Check IN`);
    console.log(`   2. IN_PROGRESS (ID: ${activeShift.id.slice(0, 8)}...) - Check OUT`);
    console.log('\n👉 Log in as guard@asd.com to test check-in/out!\n');
}

seedFullTestData()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
