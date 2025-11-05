// PostgreSQL Setup Script for Guard Tracking App
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🐘 Setting up PostgreSQL for Guard Tracking App...\n');

// Step 1: Copy the PostgreSQL .env file
console.log('1️⃣ Setting up environment variables...');
try {
  fs.copyFileSync(
    path.join(__dirname, 'backend', '.env.pg'),
    path.join(__dirname, 'backend', '.env')
  );
  console.log('✅ Environment variables configured for PostgreSQL');
} catch (error) {
  console.error('❌ Failed to copy environment file:', error.message);
  process.exit(1);
}

// Step 2: Install PostgreSQL driver for Prisma
console.log('\n2️⃣ Installing PostgreSQL driver...');
exec('cd backend && npm install @prisma/client @prisma/adapter-pg', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Failed to install PostgreSQL driver:', error.message);
    return;
  }
  
  console.log('✅ PostgreSQL driver installed');
  
  // Step 3: Generate Prisma client
  console.log('\n3️⃣ Generating Prisma client...');
  exec('cd backend && npx prisma generate', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Failed to generate Prisma client:', error.message);
      return;
    }
    
    console.log('✅ Prisma client generated');
    
    // Step 4: Create database and run migrations
    console.log('\n4️⃣ Creating database and running migrations...');
    console.log('⚠️ Make sure PostgreSQL is running and accessible with the credentials in .env.pg');
    console.log('⚠️ If you need to change credentials, edit backend/.env.pg first, then run this script again');
    
    exec('cd backend && npx prisma db push', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Failed to create database schema:', error.message);
        console.log('\n🔍 Troubleshooting:');
        console.log('1. Make sure PostgreSQL is running on localhost:5432');
        console.log('2. Check that the postgres user exists with password "postgres"');
        console.log('3. If using different credentials, update them in backend/.env.pg');
        console.log('4. Make sure the postgres user has permission to create databases');
        return;
      }
      
      console.log('✅ Database schema created');
      
      // Step 5: Seed the database
      console.log('\n5️⃣ Seeding the database with initial data...');
      exec('cd backend && npx prisma db seed', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Failed to seed database:', error.message);
          return;
        }
        
        console.log('✅ Database seeded successfully');
        
        // Step 6: Start the server with PostgreSQL
        console.log('\n6️⃣ Ready to start server with PostgreSQL!');
        console.log('\n🚀 To start the server, run:');
        console.log('cd backend && npm run dev:db');
        
        console.log('\n🎉 PostgreSQL integration complete!');
        console.log('📊 You can now use pgAdmin to connect to your database:');
        console.log('- Host: localhost');
        console.log('- Port: 5432');
        console.log('- Database: guard_tracking');
        console.log('- Username: postgres');
        console.log('- Password: postgres');
      });
    });
  });
});
