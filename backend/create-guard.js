const http = require('http');

const data = JSON.stringify({
  email: 'guard@test.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'Guard',
  phone: '+1234567890',
  role: 'GUARD'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🔧 Creating test guard account...\n');

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('✅ Guard account created successfully!\n');
      console.log('📧 Login Credentials:');
      console.log('   Email: guard@test.com');
      console.log('   Password: password123');
      console.log('\n✨ You can now login in the mobile app!');
    } else if (res.statusCode === 400 && responseData.includes('already exists')) {
      console.log('✅ Account already exists!\n');
      console.log('📧 Login Credentials:');
      console.log('   Email: guard@test.com');
      console.log('   Password: password123');
      console.log('\n✨ You can now login in the mobile app!');
    } else {
      console.log('❌ Error:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n⚠️  Make sure the backend is running on http://localhost:3000');
});

req.write(data);
req.end();
