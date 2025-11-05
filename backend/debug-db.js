import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugDatabase() {
  try {
    console.log('🔍 Debugging Database Connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Count users
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    // List all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      },
      take: 10
    });
    
    console.log('👥 Recent users:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.firstName} ${user.lastName}) - ${user.role} - ${user.id}`);
    });
    
    // Test creating a user
    console.log('\n🧪 Testing user creation...');
    const testEmail = `debug${Date.now()}@test.com`;
    
    try {
      const newUser = await prisma.user.create({
        data: {
          email: testEmail,
          password: 'hashedpassword',
          firstName: 'Debug',
          lastName: 'User',
          role: 'GUARD'
        }
      });
      
      console.log(`✅ User created successfully: ${newUser.id}`);
      
      // Verify we can find it
      const foundUser = await prisma.user.findUnique({
        where: { id: newUser.id }
      });
      
      if (foundUser) {
        console.log('✅ User found after creation');
      } else {
        console.log('❌ User NOT found after creation');
      }
      
      // Clean up
      await prisma.user.delete({
        where: { id: newUser.id }
      });
      console.log('🧹 Test user cleaned up');
      
    } catch (error) {
      console.error('❌ Error creating test user:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugDatabase();
