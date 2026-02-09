import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function debugLogin() {
    const email = 'guard@asd.com';
    const password = 'password';

    console.log('🔍 Debug Login Test\n');
    console.log(`Email: "${email}"`);
    console.log(`Password: "${password}"`);

    // Find user exactly like authService does
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
            id: true,
            email: true,
            password: true,
            isActive: true,
            isEmailVerified: true,
        }
    });

    if (!user) {
        console.log('\n❌ User NOT found with email.toLowerCase()');

        // Check if user exists with different case
        const allUsers = await prisma.user.findMany({
            where: { email: { contains: 'asd' } },
            select: { email: true }
        });
        console.log('Users containing "asd":', allUsers);
        return;
    }

    console.log('\n✅ User found:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  isActive:', user.isActive);
    console.log('  isEmailVerified:', user.isEmailVerified);
    console.log('  Password hash:', user.password.slice(0, 30) + '...');

    // Test bcrypt comparison
    const isValid = await bcrypt.compare(password, user.password);
    console.log('\n🔐 bcrypt.compare result:', isValid);

    if (!isValid) {
        console.log('\n❌ Password mismatch!');
        console.log('Trying some variations...');

        // Test with different passwords
        const tests = ['password', 'Password', 'Passw0rd!', 'password123'];
        for (const testPwd of tests) {
            const result = await bcrypt.compare(testPwd, user.password);
            console.log(`  "${testPwd}": ${result}`);
        }
    } else {
        console.log('\n✅ Password is correct! The issue is elsewhere in the API.');
    }
}

debugLogin()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
