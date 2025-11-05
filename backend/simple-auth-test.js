import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE_URL = 'http://localhost:3000/api';

async function testRegistration() {
  console.log('🧪 Simple Registration Test');
  
  const testUser = {
    email: `simpletest${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Simple',
    lastName: 'Test',
    phone: '+1234567890',
    role: 'GUARD'
  };
  
  try {
    console.log('📤 Sending registration request...');
    console.log('Request data:', JSON.stringify(testUser, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/auth/register`, testUser, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('📥 Registration response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('User ID:', response.data.data?.user?.id);
    console.log('Email:', response.data.data?.user?.email);
    
    if (response.data.success && response.data.data?.user?.id) {
      const userId = response.data.data.user.id;
      
      // Wait a moment for any async operations
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('\n🔍 Checking database...');
      
      // Check by ID
      const userById = await prisma.user.findUnique({
        where: { id: userId },
        include: { guard: true }
      });
      
      console.log('User found by ID:', userById ? '✅ Yes' : '❌ No');
      
      // Check by email
      const userByEmail = await prisma.user.findUnique({
        where: { email: testUser.email },
        include: { guard: true }
      });
      
      console.log('User found by email:', userByEmail ? '✅ Yes' : '❌ No');
      
      if (userByEmail) {
        console.log('Database user details:');
        console.log('- ID:', userByEmail.id);
        console.log('- Email:', userByEmail.email);
        console.log('- Name:', userByEmail.firstName, userByEmail.lastName);
        console.log('- Role:', userByEmail.role);
        console.log('- Guard profile:', userByEmail.guard ? '✅ Created' : '❌ Missing');
        
        // Cleanup
        if (userByEmail.guard) {
          await prisma.guard.delete({ where: { id: userByEmail.guard.id } });
        }
        await prisma.user.delete({ where: { id: userByEmail.id } });
        console.log('🧹 Cleaned up test user');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testRegistration();
