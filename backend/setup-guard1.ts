// Script to reset guard1's password and create shift
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addHours, subMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function setup() {
    console.log('🔧 Setting up guard1@example.com for testing...\n');

    const hashedPassword = await bcrypt.hash('Passw0rd!', 10);

    // Upsert guard1 user
    const user = await prisma.user.upsert({
        where: { email: 'guard1@example.com' },
        update: {
            password: hashedPassword,
            isActive: true,
            isEmailVerified: true,
        },
        create: {
            email: 'guard1@example.com',
            password: hashedPassword,
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            role: 'GUARD',
            isActive: true,
            isEmailVerified: true,
        },
    });
    console.log('✅ User created/updated:', user.email);

    // Upsert guard profile
    const guard = await prisma.guard.upsert({
        where: { userId: user.id },
        update: { status: 'ACTIVE' },
        create: {
            userId: user.id,
            employeeId: 'EMP001',
            status: 'ACTIVE',
        },
    });
    console.log('✅ Guard profile created/updated:', guard.id);

    // Find or create security company
    let company = await prisma.securityCompany.findFirst();
    if (!company) {
        company = await prisma.securityCompany.create({
            data: {
                name: 'Test Security Company',
                email: 'admin@example.com',
                phone: '+1234567893',
                subscriptionPlan: 'BASIC',
                subscriptionStatus: 'ACTIVE',
                subscriptionStartDate: new Date(),
                maxGuards: 10,
                maxClients: 5,
                maxSites: 10,
            },
        });
        console.log('✅ Security company created:', company.name);
    }

    // Link guard to company
    await prisma.companyGuard.upsert({
        where: {
            securityCompanyId_guardId: {
                securityCompanyId: company.id,
                guardId: guard.id,
            },
        },
        update: { isActive: true },
        create: {
            securityCompanyId: company.id,
            guardId: guard.id,
            isActive: true,
        },
    });
    console.log('✅ Guard linked to company');

    // Delete old SCHEDULED shifts for this guard
    await prisma.shift.deleteMany({
        where: { guardId: guard.id, status: 'SCHEDULED' }
    });

    // Create a new shift for testing
    const now = new Date();
    const shift = await prisma.shift.create({
        data: {
            guardId: guard.id,
            locationName: 'Test Security Site',
            locationAddress: '123 Test Street, New York, NY 10001',
            scheduledStartTime: subMinutes(now, 5),
            scheduledEndTime: addHours(now, 8),
            status: 'SCHEDULED',
            description: 'Test shift for check-in/check-out testing',
        },
    });
    console.log('✅ Shift created:', shift.id);

    console.log('\n🎉 Setup complete!');
    console.log('\n📱 Test credentials:');
    console.log('   Email: guard1@example.com');
    console.log('   Password: Passw0rd!');
    console.log('\n👉 Shift ID:', shift.id);
    console.log('   Status:', shift.status);
    console.log('   Start:', shift.scheduledStartTime.toLocaleString());
}

setup()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
