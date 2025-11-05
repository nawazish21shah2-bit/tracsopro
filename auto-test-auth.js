#!/usr/bin/env node

/**
 * Automated Authentication Testing Script
 * Tests both Guard and Client flows automatically using console OTP logging
 */

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000/api';

// Helper function to make API requests
const apiRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
};

// Configure environment
const configureEnvironment = () => {
  console.log('📝 Configuring environment...');
  
  const envPath = path.join(__dirname, 'backend', '.env');
  const envConfig = `# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=dev-secret-change-me-in-production
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info

# Real-time
SOCKET_IO_ENABLED=true

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=nawazish21shah2@gmail.com
SMTP_PASS=wjbh kjow zixq clze
SMTP_FROM=nawazish21shah2@gmail.com

# OTP Configuration
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RATE_LIMIT_WINDOW=300000
OTP_RATE_LIMIT_MAX=3
`;

  try {
    fs.writeFileSync(envPath, envConfig);
    console.log('✅ Environment configured');
    return true;
  } catch (error) {
    console.log('❌ Failed to configure environment:', error.message);
    return false;
  }
};

// Start backend and capture OTP logs
const startBackendWithOTPCapture = () => {
  return new Promise((resolve, reject) => {
    console.log('🔧 Starting backend with OTP logging...');
    
    const backend = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let serverStarted = false;
    const otpMap = new Map(); // Store OTPs by email

    backend.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Look for OTP logs
      const otpMatch = output.match(/🔐 DEV OTP for (.+): (\d{6})/);
      if (otpMatch) {
        const [, email, otp] = otpMatch;
        otpMap.set(email, otp);
        console.log(`📧 Captured OTP for ${email}: ${otp}`);
      }
      
      if (output.includes('Backend running on http://localhost:3000') && !serverStarted) {
        serverStarted = true;
        console.log('✅ Backend server started');
        resolve({ backend, otpMap });
      }
    });

    backend.stderr.on('data', (data) => {
      console.log('Backend Error:', data.toString().trim());
    });

    setTimeout(() => {
      if (!serverStarted) {
        backend.kill();
        reject(new Error('Backend startup timeout'));
      }
    }, 30000);
  });
};

// Test registration and get OTP
const testRegistration = async (userData, userType, otpMap) => {
  console.log(`\n🧪 Testing ${userType} Registration...`);
  console.log(`📝 Email: ${userData.email}`);
  
  const result = await apiRequest('POST', '/auth/register', userData);
  
  if (result.success) {
    const payload = result.data?.data || result.data;
    console.log(`✅ ${userType} registration successful!`);
    console.log(`👤 User ID: ${payload.user?.id}`);
    
    // Wait a moment for OTP to be generated and logged
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const otp = otpMap.get(userData.email);
    if (otp) {
      console.log(`🔐 Found OTP: ${otp}`);
      return {
        userId: payload.user?.id,
        email: userData.email,
        token: payload.token,
        user: payload.user,
        otp
      };
    } else {
      console.log(`❌ OTP not found for ${userData.email}`);
      return null;
    }
  } else {
    console.log(`❌ ${userType} registration failed:`, result.error.message || result.error);
    return null;
  }
};

// Test OTP verification
const testOTPVerification = async (userId, otp, userType) => {
  console.log(`\n🔐 Testing ${userType} OTP Verification...`);
  console.log(`🔑 Using OTP: ${otp}`);
  
  const result = await apiRequest('POST', '/auth/verify-otp', {
    userId,
    otp
  });
  
  if (result.success) {
    console.log(`✅ ${userType} OTP verification successful!`);
    return true;
  } else {
    console.log(`❌ ${userType} OTP verification failed:`, result.error.message || result.error);
    return false;
  }
};

// Test login
const testLogin = async (email, password, userType) => {
  console.log(`\n🔑 Testing ${userType} Login...`);
  
  const result = await apiRequest('POST', '/auth/login', {
    email,
    password
  });
  
  if (result.success) {
    const payload = result.data?.data || result.data;
    console.log(`✅ ${userType} login successful!`);
    console.log(`👤 User: ${payload.user.firstName} ${payload.user.lastName}`);
    console.log(`🎭 Role: ${payload.user.role}`);
    return {
      token: payload.token,
      user: payload.user
    };
  } else {
    console.log(`❌ ${userType} login failed:`, result.error.message || result.error);
    return null;
  }
};

// Test protected route
const testProtectedRoute = async (token, userType) => {
  console.log(`\n🔒 Testing ${userType} Protected Route...`);
  
  const result = await apiRequest('GET', '/auth/me', null, token);
  
  if (result.success) {
    const payload = result.data?.data || result.data;
    console.log(`✅ ${userType} can access protected routes`);
    console.log(`🎭 Role: ${payload.user.role}`);
    return true;
  } else {
    console.log(`❌ ${userType} cannot access protected routes`);
    return false;
  }
};

// Complete flow test
const testCompleteFlow = async (userData, userType, otpMap) => {
  console.log(`\n🚀 Testing Complete ${userType} Flow`);
  console.log('='.repeat(50));
  
  // Step 1: Registration
  const regResult = await testRegistration(userData, userType, otpMap);
  if (!regResult) return false;
  
  // Step 2: OTP Verification
  const otpVerified = await testOTPVerification(regResult.userId, regResult.otp, userType);
  if (!otpVerified) return false;
  
  // Step 3: Login
  const loginResult = await testLogin(regResult.email, userData.password, userType);
  if (!loginResult) return false;
  
  // Step 4: Protected Route
  const protectedAccess = await testProtectedRoute(loginResult.token, userType);
  if (!protectedAccess) return false;
  
  console.log(`\n🎉 ${userType} Flow COMPLETED SUCCESSFULLY!`);
  return {
    success: true,
    user: loginResult.user,
    token: loginResult.token
  };
};

// Main test runner
const runAutomatedTests = async () => {
  console.log('🚀 Starting Automated Authentication Tests');
  console.log('==========================================');
  
  try {
    // Configure environment
    if (!configureEnvironment()) {
      throw new Error('Environment configuration failed');
    }
    
    // Start backend with OTP capture
    const { backend, otpMap } = await startBackendWithOTPCapture();
    
    // Wait for server to be ready
    console.log('\n⏳ Waiting for server...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test server connectivity
    const healthCheck = await apiRequest('GET', '/auth/me', null, 'invalid-token');
    if (!healthCheck.success && healthCheck.status === 401) {
      console.log('✅ Server is responding');
    } else {
      throw new Error('Server connectivity issue');
    }
    
    const timestamp = Date.now();
    
    // Test data
    const guardData = {
      email: `nawazish21shah2+guard${timestamp}@gmail.com`,
      password: 'GuardPassword123',
      firstName: 'John',
      lastName: 'Guard',
      phone: '+1234567890',
      role: 'GUARD'
    };
    
    const clientData = {
      email: `nawazish21shah2+client${timestamp}@gmail.com`,
      password: 'ClientPassword123',
      firstName: 'Jane',
      lastName: 'Client',
      phone: '+1234567891',
      role: 'CLIENT',
      accountType: 'INDIVIDUAL'
    };
    
    // Run tests
    const results = {};
    
    results.guard = await testCompleteFlow(guardData, 'Guard', otpMap);
    results.client = await testCompleteFlow(clientData, 'Client', otpMap);
    
    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log('Guard Flow:', results.guard ? '✅ PASSED' : '❌ FAILED');
    console.log('Client Flow:', results.client ? '✅ PASSED' : '❌ FAILED');
    
    if (results.guard && results.client) {
      console.log('\n🎉 ALL AUTHENTICATION FLOWS WORKING!');
      console.log('✅ Guard role:', results.guard.user.role);
      console.log('✅ Client role:', results.client.user.role);
      console.log('✅ Email OTP: Working');
      console.log('✅ JWT Authentication: Working');
      console.log('✅ Database persistence: Working');
      console.log('\n📱 Ready for mobile app testing!');
    }
    
    console.log('\n🔄 Backend continues running for mobile app testing...');
    console.log('Press Ctrl+C to stop');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});

// Run the tests
runAutomatedTests().catch(console.error);
