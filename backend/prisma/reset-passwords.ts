import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPasswords() {
    console.log('🔐 Resetting passwords...\n');

    // Use the same hashing as the auth service (10 rounds)
    const newPassword = await bcrypt.hash('password', 10);

    console.log('Generated hash:', newPassword);

    // Update all test users
    const emails = ['ad@asd.com', 'client@asd.com', 'guard@asd.com'];

    for (const email of emails) {
        const result = await prisma.user.updateMany({
            where: { email },
            data: {
                password: newPassword,
                isEmailVerified: true,
                isActive: true,
            }
        });
        console.log(`✅ Reset password for ${email} (${result.count} updated)`);
    }

    // Verify by trying to compare
    const user = await prisma.user.findUnique({
        where: { email: 'guard@asd.com' },
        select: { password: true }
    });

    if (user) {
        const isValid = await bcrypt.compare('password', user.password);
        console.log(`\n🔍 Password verification test: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}`);
    }

    console.log('\n✅ All passwords reset to: password');
    console.log('\nLogins:');
    console.log('  guard@asd.com / password');
    console.log('  client@asd.com / password');
    console.log('  ad@asd.com / password');
}

resetPasswords()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
