// Script to check client profile
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkClientProfile() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'client@test.com' },
      include: {
        client: true
      }
    });

    console.log('User with client profile:', JSON.stringify(user, null, 2));
    
    if (!user.client) {
      console.log('Creating client profile...');
      const client = await prisma.client.create({
        data: {
          userId: user.id,
          accountType: 'INDIVIDUAL',
          address: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'United States',
        }
      });
      console.log('Client profile created:', client);
    }
    
  } catch (error) {
    console.error('Error checking client profile:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkClientProfile();
