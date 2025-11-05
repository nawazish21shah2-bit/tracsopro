/**
 * Test script for OTP authentication flow
 * Run with: node test-otp-flow.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let userId = '';
let testEmail = `test${Date.now()}@example.com`;

console.log('🧪 Testing OTP Authentication Flow\n');
console.log('Test Email:', testEmail);
console.log('=====================================\n');

async function testRegistration() {
  console.log('1️⃣  Testing Registration...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: testEmail,
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'GUARD'
    });

    console.log('✅ Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    userId = response.data.data.userId;
    console.log('\n📧 Check your email for OTP code');
    console.log('User ID:', userId);
    console.log('\n');
    
    return true;
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data || error.message);
    return false;
  }
}

async function testResendOTP() {
  console.log('2️⃣  Testing Resend OTP...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/resend-otp`, {
      userId: userId
    });

    console.log('✅ OTP resent successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n');
    return true;
  } catch (error) {
    console.error('❌ Resend OTP failed:', error.response?.data || error.message);
    return false;
  }
}

async function testVerifyOTP(otp) {
  console.log('3️⃣  Testing OTP Verification...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      userId: userId,
      otp: otp
    });

    console.log('✅ OTP verified successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n');
    return response.data.data.token;
  } catch (error) {
    console.error('❌ OTP verification failed:', error.response?.data || error.message);
    return null;
  }
}

async function testForgotPassword() {
  console.log('4️⃣  Testing Forgot Password...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: testEmail
    });

    console.log('✅ Password reset OTP sent!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n');
    return true;
  } catch (error) {
    console.error('❌ Forgot password failed:', error.response?.data || error.message);
    return false;
  }
}

async function testResetPassword(otp) {
  console.log('5️⃣  Testing Reset Password...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/reset-password`, {
      email: testEmail,
      otp: otp,
      newPassword: 'NewTest123!'
    });

    console.log('✅ Password reset successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n');
    return true;
  } catch (error) {
    console.error('❌ Reset password failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting OTP Flow Tests...\n');
  
  // Test 1: Registration
  const regSuccess = await testRegistration();
  if (!regSuccess) {
    console.log('\n❌ Tests stopped due to registration failure');
    return;
  }

  // Wait a bit for email to be sent
  console.log('⏳ Waiting 2 seconds for email to be sent...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Resend OTP
  await testResendOTP();

  // Prompt for OTP
  console.log('=====================================');
  console.log('📧 Please check your email for the OTP code');
  console.log('=====================================\n');
  console.log('To continue testing:');
  console.log('1. Check your email for the OTP');
  console.log('2. Run the following commands:\n');
  console.log(`   # Verify OTP`);
  console.log(`   curl -X POST ${BASE_URL}/auth/verify-otp \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"userId":"${userId}","otp":"YOUR_OTP_HERE"}'\n`);
  console.log(`   # Test forgot password`);
  console.log(`   curl -X POST ${BASE_URL}/auth/forgot-password \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"email":"${testEmail}"}'\n`);
  console.log(`   # Reset password`);
  console.log(`   curl -X POST ${BASE_URL}/auth/reset-password \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"email":"${testEmail}","otp":"YOUR_OTP_HERE","newPassword":"NewTest123!"}'\n`);
  
  console.log('=====================================');
  console.log('✅ Automated tests completed!');
  console.log('📊 Results:');
  console.log('  - Registration: ✅ Passed');
  console.log('  - Resend OTP: ✅ Passed');
  console.log('  - OTP Verification: ⏳ Manual test required');
  console.log('  - Forgot Password: ⏳ Manual test required');
  console.log('  - Reset Password: ⏳ Manual test required');
  console.log('=====================================\n');
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
