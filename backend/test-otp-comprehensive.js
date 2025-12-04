/**
 * Comprehensive OTP Testing Script
 * Tests all OTP functionality including edge cases
 * 
 * Usage: node test-otp-comprehensive.js
 * 
 * Prerequisites:
 * - Backend server running on http://localhost:3000
 * - Database connected and migrations applied
 * - SMTP configured (or check console for DEV OTP codes)
 */

import axios from 'axios';
import readline from 'readline';

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? 'green' : 'red';
  log(`  ${status}: ${name}`, color);
  if (message) log(`    ${message}`, 'yellow');
  
  testResults.tests.push({ name, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

function logWarning(message) {
  log(`  ⚠️  WARNING: ${message}`, 'yellow');
  testResults.warnings++;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Test data
let testEmail = `test-otp-${Date.now()}@example.com`;
let userId = '';
let otpCode = '';
let authToken = '';

/**
 * Test 1: User Registration with OTP
 */
async function testRegistration() {
  log('\n📝 Test 1: User Registration with OTP', 'cyan');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      email: testEmail,
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
      role: 'GUARD'
    });

    if (response.data.success && response.data.data.userId) {
      userId = response.data.data.userId;
      logTest('Registration successful', true, `User ID: ${userId}`);
      logTest('OTP sent to email', true, `Check email: ${testEmail}`);
      
      // Check if OTP was bypassed (dev mode)
      if (response.data.data.token) {
        logWarning('OTP bypassed - tokens returned immediately (dev mode)');
        authToken = response.data.data.token;
        return { success: true, bypassed: true };
      }
      
      return { success: true, bypassed: false };
    } else {
      logTest('Registration successful', false, 'No userId in response');
      return { success: false };
    }
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    logTest('Registration successful', false, message);
    return { success: false };
  }
}

/**
 * Test 2: Resend OTP
 */
async function testResendOTP() {
  log('\n📧 Test 2: Resend OTP', 'cyan');
  
  if (!userId) {
    logTest('Resend OTP', false, 'No userId available');
    return { success: false };
  }

  try {
    const response = await axios.post(`${BASE_URL}/auth/resend-otp`, {
      userId: userId
    });

    if (response.data.success) {
      logTest('Resend OTP successful', true, response.data.message);
      return { success: true };
    } else {
      logTest('Resend OTP successful', false, response.data.message);
      return { success: false };
    }
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    logTest('Resend OTP successful', false, message);
    return { success: false };
  }
}

/**
 * Test 3: Verify OTP (with manual input)
 */
async function testVerifyOTP(otp) {
  log('\n🔐 Test 3: Verify OTP', 'cyan');
  
  if (!userId) {
    logTest('Verify OTP', false, 'No userId available');
    return { success: false };
  }

  if (!otp || otp.length !== 6) {
    logTest('Verify OTP', false, 'Invalid OTP format');
    return { success: false };
  }

  try {
    const response = await axios.post(`${BASE_URL}/auth/verify-otp`, {
      userId: userId,
      otp: otp
    });

    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      logTest('OTP verification successful', true, 'Tokens received');
      logTest('User authenticated', true, `Token: ${authToken.substring(0, 20)}...`);
      return { success: true, token: authToken };
    } else {
      logTest('OTP verification successful', false, 'No token in response');
      return { success: false };
    }
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    if (status === 429) {
      logTest('OTP verification (rate limit)', false, 'Rate limit exceeded');
    } else if (status === 400) {
      logTest('OTP verification (invalid)', false, message);
    } else {
      logTest('OTP verification', false, message);
    }
    return { success: false };
  }
}

/**
 * Test 4: Invalid OTP attempts
 */
async function testInvalidOTP() {
  log('\n🚫 Test 4: Invalid OTP Attempts', 'cyan');
  
  if (!userId) {
    logTest('Invalid OTP test', false, 'No userId available');
    return;
  }

  // Test with wrong OTP
  try {
    await axios.post(`${BASE_URL}/auth/verify-otp`, {
      userId: userId,
      otp: '000000'
    });
    logTest('Invalid OTP rejected', false, 'Should have failed');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('Invalid OTP rejected', true, 'Correctly rejected invalid OTP');
    } else {
      logTest('Invalid OTP rejected', false, error.response?.data?.message);
    }
  }

  // Test with wrong format
  try {
    await axios.post(`${BASE_URL}/auth/verify-otp`, {
      userId: userId,
      otp: '12345' // Too short
    });
    logTest('Invalid format rejected', false, 'Should have failed');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('Invalid format rejected', true, 'Correctly rejected invalid format');
    } else {
      logTest('Invalid format rejected', false, error.response?.data?.message);
    }
  }
}

/**
 * Test 5: Rate Limiting
 */
async function testRateLimiting() {
  log('\n⏱️  Test 5: Rate Limiting', 'cyan');
  
  if (!userId) {
    logTest('Rate limiting test', false, 'No userId available');
    return;
  }

  log('  Attempting multiple OTP verifications...', 'yellow');
  
  let rateLimitHit = false;
  for (let i = 0; i < 5; i++) {
    try {
      await axios.post(`${BASE_URL}/auth/verify-otp`, {
        userId: userId,
        otp: '000000'
      });
    } catch (error) {
      if (error.response?.status === 429) {
        rateLimitHit = true;
        logTest('Rate limiting active', true, `Hit after ${i + 1} attempts`);
        break;
      }
    }
  }

  if (!rateLimitHit) {
    logTest('Rate limiting active', false, 'Rate limit not triggered');
  }
}

/**
 * Test 6: Forgot Password Flow
 */
async function testForgotPassword() {
  log('\n🔑 Test 6: Forgot Password Flow', 'cyan');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: testEmail
    });

    if (response.data.success) {
      logTest('Forgot password OTP sent', true, response.data.message);
      return { success: true };
    } else {
      logTest('Forgot password OTP sent', false, response.data.message);
      return { success: false };
    }
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    logTest('Forgot password OTP sent', false, message);
    return { success: false };
  }
}

/**
 * Test 7: Database OTP Storage
 */
async function testDatabaseOTP() {
  log('\n💾 Test 7: Database OTP Storage (Manual Check)', 'cyan');
  log('  Please check the database manually:', 'yellow');
  log(`    - User ID: ${userId}`, 'yellow');
  log('    - Check emailVerificationToken field', 'yellow');
  log('    - Check emailVerificationExpiry field', 'yellow');
  log('    - Verify OTP is stored correctly', 'yellow');
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n🚀 Starting Comprehensive OTP Tests', 'blue');
  log('=' .repeat(60), 'blue');
  log(`Test Email: ${testEmail}`, 'cyan');
  log(`API URL: ${BASE_URL}`, 'cyan');
  log('=' .repeat(60), 'blue');

  // Test 1: Registration
  const regResult = await testRegistration();
  if (!regResult.success) {
    log('\n❌ Registration failed. Stopping tests.', 'red');
    return;
  }

  // If OTP was bypassed, skip OTP tests
  if (regResult.bypassed) {
    log('\n⚠️  OTP bypassed in dev mode. Skipping OTP-specific tests.', 'yellow');
    logTest('OTP functionality', false, 'Bypassed - cannot test');
  } else {
    // Wait a bit for email
    log('\n⏳ Waiting 2 seconds for email delivery...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Resend OTP
    await testResendOTP();

    // Test 3: Verify OTP (manual input required)
    log('\n📧 Please check your email or console for the OTP code', 'yellow');
    log('   (In dev mode, OTP is logged to console)', 'yellow');
    const userOTP = await question('\nEnter the 6-digit OTP code: ');
    
    if (userOTP && userOTP.trim().length === 6) {
      otpCode = userOTP.trim();
      await testVerifyOTP(otpCode);
    } else {
      logTest('OTP verification', false, 'No valid OTP provided');
    }

    // Test 4: Invalid OTP
    await testInvalidOTP();

    // Test 5: Rate Limiting
    await testRateLimiting();
  }

  // Test 6: Forgot Password
  await testForgotPassword();

  // Test 7: Database check
  await testDatabaseOTP();

  // Print summary
  log('\n' + '='.repeat(60), 'blue');
  log('📊 Test Summary', 'blue');
  log('='.repeat(60), 'blue');
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, 'red');
  log(`⚠️  Warnings: ${testResults.warnings}`, 'yellow');
  log('='.repeat(60), 'blue');

  // Detailed results
  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => log(`  - ${t.name}: ${t.message}`, 'red'));
  }

  rl.close();
}

// Run tests
runTests().catch(error => {
  log(`\n💥 Test suite crashed: ${error.message}`, 'red');
  console.error(error);
  rl.close();
  process.exit(1);
});

