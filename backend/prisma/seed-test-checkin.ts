import { PrismaClient, ShiftStatus } from '@prisma/client';
import { addHours, subMinutes } from 'date-fns';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function seedTestShift() {
    console.log('🌱 Creating test shift for guard1@example.com...');

    // Find guard1
    const guard = await prisma.guard.findFirst({
        where: {
            user: {
                email: 'guard1@example.com'
            }
        },
        include: {
            user: true
        }
    });

    if (!guard) {
        console.log('❌ guard1@example.com not found. Creating test guard...');

        // Create guard user
        const guardUser = await prisma.user.upsert({
            where: { email: 'guard1@example.com' },
            update: {},
            create: {
                email: 'guard1@example.com',
                password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: 'password'
                firstName: 'Test',
                lastName: 'Guard',
                phone: '+1234567890',
                role: 'GUARD',
                isEmailVerified: true,
                isActive: true,
            },
        });

        await prisma.guard.upsert({
            where: { userId: guardUser.id },
            update: {},
            create: {
                userId: guardUser.id,
                employeeId: `EMP${Date.now()}`,
                status: 'ACTIVE',
            },
        });

        console.log('✅ Created guard1@example.com with password: password');
    } else {
        console.log(`✅ Found guard: ${guard.user.firstName} ${guard.user.lastName}`);
    }

    // Re-fetch guard
    const testGuard = await prisma.guard.findFirst({
        where: {
            user: { email: 'guard1@example.com' }
        },
        include: { user: true }
    });

    if (!testGuard) {
        console.log('❌ Failed to find or create guard');
        return;
    }

    // Find or create a client
    let client = await prisma.client.findFirst({
        include: { user: true }
    });

    if (!client) {
        const clientUser = await prisma.user.upsert({
            where: { email: 'client1@example.com' },
            update: {},
            create: {
                email: 'client1@example.com',
                password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                firstName: 'Test',
                lastName: 'Client',
                phone: '+1234567891',
                role: 'CLIENT',
                accountType: 'COMPANY',
                isEmailVerified: true,
                isActive: true,
            },
        });

        client = await prisma.client.upsert({
            where: { userId: clientUser.id },
            update: {},
            create: {
                userId: clientUser.id,
                accountType: 'COMPANY',
                companyName: 'Test Security Client',
            },
        });
        console.log('✅ Created test client');
    }

    // Find or create a site
    let site = await prisma.site.findFirst({
        where: { clientId: client.id }
    });

    if (!site) {
        site = await prisma.site.create({
            data: {
                clientId: client.id,
                name: 'Test Security Site',
                address: '123 Test Street, New York, NY 10001',
                latitude: 40.7128,
                longitude: -74.0060,
                description: 'Test site for debugging',
                isActive: true,
            },
        });
        console.log('✅ Created test site');
    }

    // Delete existing SCHEDULED shifts for this guard to avoid duplicates
    await prisma.shift.deleteMany({
        where: {
            guardId: testGuard.id,
            status: 'SCHEDULED'
        }
    });

    // Create a SCHEDULED shift starting 5 minutes ago (so it's ready to check-in)
    const now = new Date();
    const shiftStart = subMinutes(now, 5); // Started 5 minutes ago
    const shiftEnd = addHours(now, 8); // Ends in 8 hours

    const shift = await prisma.shift.create({
        data: {
            guardId: testGuard.id,
            siteId: site.id,
            clientId: client.id,
            locationName: site.name,
            locationAddress: site.address,
            scheduledStartTime: shiftStart,
            scheduledEndTime: shiftEnd,
            status: ShiftStatus.SCHEDULED,
            description: 'Test shift for debugging check-in functionality',
        },
        include: {
            guard: { include: { user: true } },
            site: true,
            client: { include: { user: true } },
        }
    });

    console.log('\n✅ Created SCHEDULED shift:');
    console.log(`   Guard: ${shift.guard.user.email}`);
    console.log(`   Site: ${shift.site?.name}`);
    console.log(`   Start: ${shift.scheduledStartTime.toLocaleString()}`);
    console.log(`   End: ${shift.scheduledEndTime.toLocaleString()}`);
    console.log(`   Status: ${shift.status}`);
    console.log(`   Shift ID: ${shift.id}`);

    console.log('\n🎉 Test shift created successfully!');
    console.log('\n📱 Login credentials:');
    console.log('   Email: guard1@example.com');
    console.log('   Password: password');
    console.log('\n👉 The shift should appear in the app and be ready for CHECK-IN!');
}

seedTestShift()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
