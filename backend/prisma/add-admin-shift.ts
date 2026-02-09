import { PrismaClient, ShiftStatus } from '@prisma/client';
import { addHours, subMinutes } from 'date-fns';

const prisma = new PrismaClient();

async function addAdminShift() {
    console.log('🌱 Adding shift for admin@example.com...\n');

    // Find admin user
    const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@example.com' },
        include: { guard: true }
    });

    if (!adminUser) {
        console.log('❌ admin@example.com not found');
        return;
    }

    console.log('✅ Found user:', adminUser.email, 'Role:', adminUser.role);

    // Check if admin has a guard profile
    let guardProfile = adminUser.guard;

    if (!guardProfile) {
        console.log('⚠️  Admin has no guard profile. Creating one...');
        guardProfile = await prisma.guard.create({
            data: {
                userId: adminUser.id,
                employeeId: `ADMIN-${Date.now()}`,
                department: 'Management',
                status: 'ACTIVE',
            }
        });
        console.log('✅ Created guard profile for admin');
    }

    // Find or create a client and site
    let client = await prisma.client.findFirst({ include: { user: true } });

    if (!client) {
        const clientUser = await prisma.user.create({
            data: {
                email: 'admin-test-client@example.com',
                password: '$2a$10$e2b8Z1MH63Mn8sMVVUXRk.mWBPxM34n3WYseadImjuIvTIGJWUzA2',
                firstName: 'AdminTest',
                lastName: 'Client',
                role: 'CLIENT',
                isEmailVerified: true,
                isActive: true,
            }
        });
        client = await prisma.client.create({
            data: { userId: clientUser.id, accountType: 'COMPANY' }
        });
    }

    let site = await prisma.site.findFirst({ where: { clientId: client.id } });

    if (!site) {
        site = await prisma.site.create({
            data: {
                clientId: client.id,
                name: 'Admin Test Site',
                address: '789 Admin Street, New York',
                latitude: 40.7128,
                longitude: -74.0060,
                isActive: true,
            }
        });
        console.log('✅ Created test site');
    }

    // Delete old shifts for this guard
    await prisma.shift.deleteMany({ where: { guardId: guardProfile.id } });

    const now = new Date();

    // Create IN_PROGRESS shift (ready for check-out)
    const activeShift = await prisma.shift.create({
        data: {
            guardId: guardProfile.id,
            siteId: site.id,
            clientId: client.id,
            locationName: site.name,
            locationAddress: site.address,
            scheduledStartTime: subMinutes(now, 60),
            scheduledEndTime: addHours(now, 7),
            actualStartTime: subMinutes(now, 58),
            status: ShiftStatus.IN_PROGRESS,
            description: 'Active admin shift',
        },
    });

    console.log('\n✅ Created IN_PROGRESS shift for admin@example.com');
    console.log('   Shift ID:', activeShift.id.slice(0, 8) + '...');
    console.log('\n📋 Login: admin@example.com / Passw0rd!');
}

addAdminShift().finally(() => prisma.$disconnect());
