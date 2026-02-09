// Quick script to verify guard1 exists in the database
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function verify() {
    console.log('🔍 Verifying guard1@example.com in database...\n');
    console.log('Database URL:', process.env.DATABASE_URL || 'Not set');

    const user = await prisma.user.findUnique({
        where: { email: 'guard1@example.com' },
        include: { guard: true },
    });

    if (!user) {
        console.log('❌ User NOT FOUND!');

        // List all users
        const allUsers = await prisma.user.findMany({
            select: { email: true, role: true, isActive: true },
            take: 10,
        });
        console.log('\nAll users in database:');
        allUsers.forEach(u => console.log(`  - ${u.email} (${u.role}) active=${u.isActive}`));
        return;
    }

    console.log('✅ User found:');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Active:', user.isActive);
    console.log('   Guard ID:', user.guard?.id || 'No guard profile');
    console.log('   Password hash:', user.password.substring(0, 20) + '...');

    // Test password
    const testPassword = 'Passw0rd!';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('\n   Password test (Passw0rd!):', isMatch ? '✅ MATCH' : '❌ NO MATCH');

    // Check shifts
    if (user.guard) {
        const shifts = await prisma.shift.findMany({
            where: { guardId: user.guard.id },
            select: { id: true, status: true, locationName: true, scheduledStartTime: true },
            take: 5,
        });
        console.log('\n   Shifts:', shifts.length);
        shifts.forEach(s => console.log(`     - ${s.id.substring(0, 8)}... ${s.status} at ${s.locationName}`));
    }
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
