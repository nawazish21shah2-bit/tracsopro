import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fullTest() {
    const email = 'guard@asd.com';
    const password = 'Passw0rd!';

    console.log('🔍 Full Login Test\n');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    // 1. Find user
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { guard: true, client: true }
    });

    if (!user) {
        console.log('\n❌ USER NOT FOUND');
        return;
    }

    console.log('\n✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   isActive:', user.isActive);
    console.log('   isEmailVerified:', user.isEmailVerified);
    console.log('   Has Guard Profile:', !!user.guard);
    console.log('   Has Client Profile:', !!user.client);

    // 2. Test password
    console.log('\n🔐 Password check:');
    console.log('   Stored hash:', user.password);

    const isValid = await bcrypt.compare(password, user.password);
    console.log('   bcrypt.compare result:', isValid);

    if (isValid) {
        console.log('\n✅ PASSWORD IS CORRECT');
        console.log('   The issue must be in the API request encoding or middleware.');
    } else {
        console.log('\n❌ PASSWORD MISMATCH');

        // Try other passwords
        const tests = ['password', 'Passw0rd!', 'Password123'];
        for (const p of tests) {
            const r = await bcrypt.compare(p, user.password);
            console.log(`   "${p}": ${r}`);
        }
    }
}

fullTest().finally(() => prisma.$disconnect());
