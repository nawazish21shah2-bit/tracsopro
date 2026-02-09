import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixPasswords() {
    console.log('🔐 Fixing passwords with correct hash...\n');

    // Get the hash from a working user
    const workingUser = await prisma.user.findUnique({
        where: { email: 'guard1@example.com' },
        select: { password: true }
    });

    if (workingUser) {
        console.log('Working user hash sample:', workingUser.password.slice(0, 20) + '...');
    }

    // Use bcrypt with same rounds (10) but ensure it's exactly like authService
    const BCRYPT_ROUNDS = 10;
    const newPassword = await bcrypt.hash('password', BCRYPT_ROUNDS);

    console.log('New hash:', newPassword.slice(0, 20) + '...');

    // Update all new test users
    const emails = ['ad@asd.com', 'client@asd.com', 'guard@asd.com'];

    for (const email of emails) {
        await prisma.user.update({
            where: { email },
            data: { password: newPassword }
        });
        console.log(`✅ Updated: ${email}`);
    }

    // Test verification
    const updated = await prisma.user.findUnique({
        where: { email: 'guard@asd.com' },
        select: { password: true }
    });

    if (updated) {
        const test = await bcrypt.compare('password', updated.password);
        console.log(`\n🔍 Verify guard@asd.com: ${test ? '✅ PASS' : '❌ FAIL'}`);
    }

    console.log('\n✅ Done! Try: guard@asd.com / password');
}

fixPasswords().finally(() => prisma.$disconnect());
