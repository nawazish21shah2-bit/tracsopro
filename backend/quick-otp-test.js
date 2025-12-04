/**
 * Quick OTP Test - Simple verification script
 * Run: node quick-otp-test.js
 * 
 * This script quickly tests if OTP is working by:
 * 1. Registering a test user
 * 2. Checking if OTP is generated and stored
 * 3. Verifying OTP functionality
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

async function makeRequest(url, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  const responseData = await response.json();
  
  return {
    status: response.status,
    data: responseData,
    ok: response.ok,
  };
}

async function quickTest() {
  console.log('🧪 Quick OTP Test\n');
  console.log('='.repeat(50));
  
  const testEmail = `test-${Date.now()}@example.com`;
  let userId = '';
  
  try {
    // Step 1: Register user
    console.log('\n1️⃣  Registering test user...');
    const registerResponse = await makeRequest(`${BASE_URL}/auth/register`, 'POST', {
      email: testEmail,
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
      role: 'GUARD'
    });
    
    if (registerResponse.data.success) {
      userId = registerResponse.data.data.userId;
      console.log('✅ Registration successful');
      console.log(`   User ID: ${userId}`);
      console.log(`   Full response:`, JSON.stringify(registerResponse.data, null, 2));
      
      // Check if OTP was bypassed
      if (registerResponse.data.data.token) {
        console.log('\n⚠️  OTP bypassed (dev mode) - tokens returned immediately');
        console.log('   This means SMTP is not configured or OTP_ENABLED=false');
        console.log('   To test OTP properly, configure SMTP in .env file');
        console.log('   For now, OTP functionality cannot be fully tested');
        return;
      }
      
      console.log('✅ OTP sent to email (check console for DEV OTP)');
    } else {
      console.log('❌ Registration failed:', registerResponse.data.message);
      return;
    }
    
    // Step 2: Test resend
    console.log('\n2️⃣  Testing resend OTP...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const resendResponse = await makeRequest(`${BASE_URL}/auth/resend-otp`, 'POST', {
      userId: userId
    });
    
    if (resendResponse.data.success) {
      console.log('✅ Resend OTP successful');
    } else {
      console.log('❌ Resend OTP failed:', resendResponse.data.message);
    }
    
    // Step 3: Test invalid OTP
    console.log('\n3️⃣  Testing invalid OTP rejection...');
    const invalidOtpResponse = await makeRequest(`${BASE_URL}/auth/verify-otp`, 'POST', {
      userId: userId,
      otp: '000000'
    });
    
    if (invalidOtpResponse.status === 400) {
      console.log('✅ Invalid OTP correctly rejected');
    } else {
      console.log('❌ Invalid OTP was accepted (should be rejected)');
      console.log('   Status:', invalidOtpResponse.status);
      console.log('   Message:', invalidOtpResponse.data.message);
    }
    
    // Step 4: Instructions
    console.log('\n4️⃣  Next steps:');
    console.log('   - Check your email for the OTP code');
    console.log('   - Or check the backend console for DEV OTP');
    console.log(`   - Verify OTP using: POST ${BASE_URL}/auth/verify-otp`);
    console.log(`     Body: { "userId": "${userId}", "otp": "YOUR_OTP" }`);
    
    console.log('\n✅ Quick test completed!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
  }
}

quickTest();

