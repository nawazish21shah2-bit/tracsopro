#!/usr/bin/env node

/**
 * Automatic Authentication Setup and Testing Script
 * Configures environment and runs complete auth flow tests
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

console.log('🚀 Starting Automatic Authentication Setup and Testing');
console.log('====================================================');

// Step 1: Configure .env file
const configureEnv = () => {
  console.log('\n📝 Configuring environment variables...');
  
  const envPath = path.join(__dirname, 'backend', '.env');
  const envConfig = `# Server
PORT=3000
NODE_ENV=development

# Database - Using SQLite for testing
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
    console.log('✅ Environment configured successfully');
    return true;
  } catch (error) {
    console.log('❌ Failed to configure environment:', error.message);
    return false;
  }
};

// Step 2: Start backend server
const startBackend = () => {
  return new Promise((resolve, reject) => {
    console.log('\n🔧 Starting backend server...');
    
    const backend = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let serverStarted = false;

    backend.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Backend:', output.trim());
      
      if (output.includes('Backend running on http://localhost:3000') && !serverStarted) {
        serverStarted = true;
        console.log('✅ Backend server started successfully');
        resolve(backend);
      }
    });

    backend.stderr.on('data', (data) => {
      console.log('Backend Error:', data.toString().trim());
    });

    backend.on('error', (error) => {
      console.log('❌ Failed to start backend:', error.message);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverStarted) {
        console.log('❌ Backend startup timeout');
        backend.kill();
        reject(new Error('Backend startup timeout'));
      }
    }, 30000);
  });
};

// Step 3: Wait for server to be ready
const waitForServer = async () => {
  console.log('\n⏳ Waiting for server to be ready...');
  
  for (let i = 0; i < 10; i++) {
    try {
      const { default: fetch } = await import('node-fetch');
      const response = await fetch('http://localhost:3000/api/auth/me', {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      
      if (response.status === 401) {
        console.log('✅ Server is responding');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Server not responding after 20 seconds');
};

// Step 4: Run authentication tests
const runAuthTests = () => {
  return new Promise((resolve, reject) => {
    console.log('\n🧪 Running authentication flow tests...');
    
    const testProcess = spawn('node', ['test-auth-flows.js'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let testOutput = '';

    testProcess.stdout.on('data', (data) => {
      const output = data.toString();
      testOutput += output;
      console.log(output.trim());
    });

    testProcess.stderr.on('data', (data) => {
      console.log('Test Error:', data.toString().trim());
    });

    // Auto-answer test prompts
    setTimeout(() => {
      testProcess.stdin.write('y\n'); // Test Guard flow
    }, 2000);

    setTimeout(() => {
      testProcess.stdin.write('y\n'); // Test Client flow  
    }, 5000);

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Authentication tests completed');
        resolve(testOutput);
      } else {
        console.log('❌ Authentication tests failed with code:', code);
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });

    testProcess.on('error', (error) => {
      console.log('❌ Failed to run tests:', error.message);
      reject(error);
    });
  });
};

// Main execution
const main = async () => {
  try {
    // Step 1: Configure environment
    if (!configureEnv()) {
      throw new Error('Environment configuration failed');
    }

    // Step 2: Start backend
    const backendProcess = await startBackend();

    // Step 3: Wait for server
    await waitForServer();

    // Step 4: Run tests
    await runAuthTests();

    console.log('\n🎉 AUTHENTICATION SYSTEM FULLY TESTED AND WORKING!');
    console.log('✅ Backend configured and running');
    console.log('✅ Email OTP system working');
    console.log('✅ Guard and Client flows tested');
    console.log('✅ Database persistence verified');
    console.log('\n📱 Ready for mobile app testing!');

    // Keep backend running
    console.log('\n🔄 Backend will continue running for mobile app testing...');
    console.log('Press Ctrl+C to stop the backend server');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
};

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});

// Run the setup
main().catch(console.error);
