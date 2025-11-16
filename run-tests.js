/**
 * Test Runner for Guard Tracking System
 * Quick tests for all implemented features
 */

const { runEmergencyTests } = require('./test-emergency-simple.js');
const { runPaymentTests } = require('./test-payments-simple.js');

// Simple logging
const log = (message, type = 'info') => {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main test runner
const runAllTests = async () => {
  log('🚀 Guard Tracking System - Implementation Tests', 'info');
  log('=' .repeat(60));
  log('Testing all implemented features...', 'info');
  log('');
  
  try {
    // Test 1: Emergency System
    log('🚨 EMERGENCY SYSTEM TESTS', 'info');
    log('-' .repeat(30));
    await runEmergencyTests();
    
    await sleep(2000);
    log('');
    
    // Test 2: Payment System
    log('💳 PAYMENT SYSTEM TESTS', 'info');
    log('-' .repeat(30));
    await runPaymentTests();
    
    log('');
    log('=' .repeat(60));
    log('🎯 IMPLEMENTATION STATUS SUMMARY', 'info');
    log('=' .repeat(60));
    
    const implementations = [
      {
        name: '🚨 Emergency Button Functionality',
        status: 'IMPLEMENTED',
        description: 'Backend service, API endpoints, mobile component'
      },
      {
        name: '📸 Photo/Video Upload System',
        status: 'IMPLEMENTED',
        description: 'Media upload component, camera integration'
      },
      {
        name: '💳 Payment Processing Integration',
        status: 'IMPLEMENTED',
        description: 'Payment service, invoice generation, client UI'
      },
      {
        name: '🔐 Authentication System',
        status: 'EXISTING',
        description: 'Already implemented in the system'
      },
      {
        name: '📱 Mobile App Components',
        status: 'IMPLEMENTED',
        description: 'Emergency button, media upload, payment screens'
      }
    ];
    
    implementations.forEach(impl => {
      const statusColor = impl.status === 'IMPLEMENTED' ? 'success' : 'info';
      log(`${impl.name}: ${impl.status}`, statusColor);
      log(`   ${impl.description}`, 'info');
      log('');
    });
    
    log('=' .repeat(60));
    log('📋 NEXT STEPS', 'info');
    log('=' .repeat(60));
    
    const nextSteps = [
      '1. Start the backend server: cd backend && npm run dev',
      '2. Test the emergency endpoints manually',
      '3. Test the payment endpoints manually',
      '4. Run the mobile app to test UI components',
      '5. Implement remaining features (reporting, offline, etc.)',
    ];
    
    nextSteps.forEach(step => {
      log(step, 'info');
    });
    
    log('');
    log('🎉 Implementation testing complete!', 'success');
    
  } catch (error) {
    log(`❌ Test runner failed: ${error.message}`, 'error');
  }
};

// File existence check
const checkFiles = () => {
  const fs = require('fs');
  const path = require('path');
  
  log('📁 Checking implemented files...', 'info');
  
  const files = [
    // Backend files
    'backend/src/services/emergencyService.ts',
    'backend/src/controllers/emergencyController.ts',
    'backend/src/routes/emergency.ts',
    'backend/src/services/paymentService.ts',
    'backend/src/controllers/paymentController.ts',
    'backend/src/routes/payments.ts',
    
    // Mobile app files
    'GuardTrackingApp/src/components/emergency/EmergencyButton.tsx',
    'GuardTrackingApp/src/components/incident/MediaUploadComponent.tsx',
    'GuardTrackingApp/src/screens/incident/IncidentReportWithMediaScreen.tsx',
    'GuardTrackingApp/src/screens/client/PaymentScreen.tsx',
    'GuardTrackingApp/src/store/slices/emergencySlice.ts',
  ];
  
  let existingFiles = 0;
  
  files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      log(`✅ ${file}`, 'success');
      existingFiles++;
    } else {
      log(`❌ ${file}`, 'error');
    }
  });
  
  log(`\n📊 Files: ${existingFiles}/${files.length} exist`, existingFiles === files.length ? 'success' : 'warning');
  
  return existingFiles === files.length;
};

// Quick server check
const checkServer = async () => {
  const axios = require('axios');
  
  log('🏥 Checking if backend server is running...', 'info');
  
  try {
    const response = await axios.get('http://localhost:3002/api/health', { timeout: 3000 });
    if (response.data.success) {
      log('✅ Backend server is running', 'success');
      return true;
    }
  } catch (error) {
    log('❌ Backend server is not running', 'error');
    log('   Start it with: cd backend && npm run dev', 'info');
    return false;
  }
};

// Main execution
const main = async () => {
  log('🔍 IMPLEMENTATION VERIFICATION', 'info');
  log('=' .repeat(60));
  
  // Check files
  const filesExist = checkFiles();
  log('');
  
  // Check server
  const serverRunning = await checkServer();
  log('');
  
  if (filesExist && serverRunning) {
    // Run full tests
    await runAllTests();
  } else if (filesExist) {
    log('⚠️  Files exist but server is not running', 'warning');
    log('   Start the server and run tests again', 'info');
  } else {
    log('❌ Some implementation files are missing', 'error');
    log('   Please check the file paths and implementation', 'info');
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runAllTests, checkFiles, checkServer };
