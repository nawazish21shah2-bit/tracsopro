import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function copyWorkingPassword() {
    console.log('🔐 Copying working password hash...\n');

    // Get the working user's password hash
    const workingUser = await prisma.user.findUnique({
        where: { email: 'guard1@example.com' },
        select: { password: true }
    });

    if (!workingUser) {
        console.log('❌ Working user not found');
        return;
    }

    console.log('✅ Found working password hash');
    console.log('   Hash:', workingUser.password);

    // Copy to new users
    const emails = ['ad@asd.com', 'client@asd.com', 'guard@asd.com'];

    for (const email of emails) {
        await prisma.user.update({
            where: { email },
            data: { password: workingUser.password }
        });
        console.log(`✅ Updated: ${email}`);
    }

    console.log('\n✅ All passwords now match guard1@example.com');
    console.log('\nLogins (use password: Passw0rd!):');
    console.log('  guard@asd.com / Passw0rd!');
    console.log('  client@asd.com / Passw0rd!');
    console.log('  ad@asd.com / Passw0rd!');
}

copyWorkingPassword().finally(() => prisma.$disconnect());
