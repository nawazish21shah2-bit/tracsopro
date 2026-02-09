
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdmin() {
    console.log('Checking admin user...');

    try {
        const user = await prisma.user.findUnique({
            where: { email: 'admin@example.com' }
        });

        if (!user) {
            console.log('❌ User not found!');
            return;
        }

        console.log('✅ User found:', {
            id: user.id,
            email: user.email,
            role: user.role,
            passwordHash: user.password.substring(0, 10) + '...'
        });

        const isMatch = await bcrypt.compare('Passw0rd!', user.password);
        console.log('Password "Passw0rd!" match:', isMatch ? '✅ YES' : '❌ NO');

        // Check company link
        const companyUser = await prisma.companyUser.findFirst({
            where: { userId: user.id },
            include: { securityCompany: true }
        });

        if (companyUser) {
            console.log('✅ Linked to Company:', companyUser.securityCompany.name);
        } else {
            console.log('⚠️ Not linked to any company (might be why unauthorized if checking subscription)');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdmin();
