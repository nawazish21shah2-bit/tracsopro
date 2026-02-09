import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndFixUsers() {
    console.log('🔍 Checking users...\n');

    const users = await prisma.user.findMany({
        where: {
            email: { contains: 'asd.com' }
        },
        select: {
            id: true,
            email: true,
            isEmailVerified: true,
            isActive: true,
            role: true,
        }
    });

    console.log('Current users:');
    console.log(JSON.stringify(users, null, 2));

    // Fix: Set all to verified and active
    console.log('\n🔧 Fixing users...');

    for (const user of users) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                isActive: true,
            }
        });
        console.log(`✅ Fixed: ${user.email}`);
    }

    console.log('\n✅ All users are now verified and active!');
    console.log('\nTry logging in again with:');
    console.log('  Email: guard@asd.com');
    console.log('  Password: password');
}

checkAndFixUsers()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
