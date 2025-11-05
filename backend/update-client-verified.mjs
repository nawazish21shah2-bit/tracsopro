// Script to verify the test client user
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verifyTestClient() {
  try {
    const updatedUser = await prisma.user.update({
      where: { email: 'client@test.com' },
      data: { 
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null
      }
    });

    console.log('Test client user verified successfully!');
    console.log('Updated User:', updatedUser);
    
  } catch (error) {
    console.error('Error verifying test client:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
verifyTestClient();
