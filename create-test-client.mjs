// Script to create a test client user
import bcrypt from 'bcryptjs';

// Database connection (adjust based on your setup)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createTestClient() {
  try {
    // Check if client@test.com already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'client@test.com' }
    });

    if (existingUser) {
      console.log('Test client user already exists:', existingUser);
      
      // Update the role to CLIENT if it's not already
      if (existingUser.role !== 'CLIENT') {
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'CLIENT' }
        });
        console.log('Updated user role to CLIENT:', updatedUser);
      }
      
      return existingUser;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create the client user
    const user = await prisma.user.create({
      data: {
        email: 'client@test.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Client',
        phone: '+1234567890',
        role: 'CLIENT',
        accountType: 'INDIVIDUAL',
        isActive: true,
        isEmailVerified: true,
      }
    });

    // Create client profile
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

    console.log('Test client user created successfully!');
    console.log('User:', user);
    console.log('Client Profile:', client);
    
    return user;
  } catch (error) {
    console.error('Error creating test client:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestClient();
