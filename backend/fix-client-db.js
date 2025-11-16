// Fix Client Profile in Database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixClientProfile() {
  console.log('🔧 Fixing Client Profile in Database...\n');

  try {
    // Step 1: Find the client user
    console.log('1. Finding client user...');
    const user = await prisma.user.findUnique({
      where: { email: 'client@test.com' },
      include: { client: true }
    });

    if (!user) {
      console.error('❌ Client user not found');
      return;
    }

    console.log('✅ User found:', user.firstName, user.lastName);
    console.log('   User ID:', user.id);
    console.log('   Role:', user.role);
    console.log('   Account Type:', user.accountType);

    // Step 2: Check if client profile exists
    if (user.client) {
      console.log('✅ Client profile already exists');
      console.log('   Client ID:', user.client.id);
      console.log('   Account Type:', user.client.accountType);
    } else {
      console.log('❌ Client profile missing - creating now...');
      
      // Step 3: Create client profile
      const client = await prisma.client.create({
        data: {
          userId: user.id,
          accountType: user.accountType || 'INDIVIDUAL',
        }
      });

      console.log('✅ Client profile created successfully');
      console.log('   Client ID:', client.id);
      console.log('   Account Type:', client.accountType);
    }

    // Step 4: Verify the fix
    console.log('\n3. Verifying the fix...');
    const updatedUser = await prisma.user.findUnique({
      where: { email: 'client@test.com' },
      include: { client: true }
    });

    if (updatedUser?.client) {
      console.log('✅ Fix verified - client profile exists');
      console.log('   Client ID:', updatedUser.client.id);
    } else {
      console.error('❌ Fix failed - client profile still missing');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixClientProfile();
