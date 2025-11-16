/**
 * Simple Payment System Test
 * Tests the payment controller implementation
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

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

// Make HTTP request
const request = async (method, endpoint, data = null, token = 'mock_token') => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: 5000,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
    };
  }
};

// Test payment intent creation
const testPaymentIntent = async () => {
  log('💳 Testing payment intent creation...');
  
  const paymentData = {
    amount: 100.00,
    currency: 'usd',
    description: 'Test payment for security services',
    metadata: {
      test: 'true'
    }
  };
  
  const result = await request('POST', '/payments/intent', paymentData);
  
  if (result.success && result.data.success) {
    log('✅ Payment intent created successfully', 'success');
    log(`   Amount: $${paymentData.amount}`);
    log(`   Client Secret: ${result.data.data.clientSecret ? 'Generated' : 'Missing'}`);
    return true;
  } else {
    log(`❌ Payment intent creation failed: ${JSON.stringify(result.error)}`, 'error');
    return false;
  }
};

// Test invoice creation
const testInvoiceCreation = async () => {
  log('📄 Testing invoice creation...');
  
  const invoiceData = {
    items: [
      {
        description: 'Security Guard Services',
        quantity: 8,
        unitPrice: 25.00,
        serviceType: 'guard_service'
      },
      {
        description: 'Overtime Premium',
        quantity: 2,
        unitPrice: 37.50,
        serviceType: 'overtime'
      }
    ],
    description: 'Test Invoice - Security Services',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    currency: 'usd'
  };
  
  const result = await request('POST', '/payments/invoice', invoiceData);
  
  if (result.success && result.data.success) {
    log('✅ Invoice created successfully', 'success');
    log(`   Total Amount: $${result.data.data.amount}`);
    log(`   Items: ${result.data.data.items?.length || 0}`);
    return true;
  } else {
    log(`❌ Invoice creation failed: ${JSON.stringify(result.error)}`, 'error');
    return false;
  }
};

// Test monthly invoice generation
const testMonthlyInvoice = async () => {
  log('📅 Testing monthly invoice generation...');
  
  const monthlyData = {
    year: 2024,
    month: 11
  };
  
  const result = await request('POST', '/payments/invoice/monthly', monthlyData);
  
  if (result.success && result.data.success) {
    log('✅ Monthly invoice generated successfully', 'success');
    log(`   Amount: $${result.data.data.amount}`);
    log(`   Description: ${result.data.data.description}`);
    return true;
  } else {
    log(`❌ Monthly invoice generation failed: ${JSON.stringify(result.error)}`, 'error');
    return false;
  }
};

// Test payment methods
const testPaymentMethods = async () => {
  log('💳 Testing payment methods retrieval...');
  
  const result = await request('GET', '/payments/methods');
  
  if (result.success && result.data.success) {
    log('✅ Payment methods retrieved successfully', 'success');
    log(`   Found ${result.data.data?.length || 0} payment methods`);
    return true;
  } else {
    log(`❌ Payment methods retrieval failed: ${JSON.stringify(result.error)}`, 'error');
    return false;
  }
};

// Test setup intent
const testSetupIntent = async () => {
  log('🔧 Testing setup intent creation...');
  
  const result = await request('POST', '/payments/setup-intent');
  
  if (result.success && result.data.success) {
    log('✅ Setup intent created successfully', 'success');
    log(`   Client Secret: ${result.data.data.clientSecret ? 'Generated' : 'Missing'}`);
    return true;
  } else {
    log(`❌ Setup intent creation failed: ${JSON.stringify(result.error)}`, 'error');
    return false;
  }
};

// Test invoices retrieval
const testInvoicesRetrieval = async () => {
  log('📋 Testing invoices retrieval...');
  
  const result = await request('GET', '/payments/invoices?page=1&limit=10');
  
  if (result.success && result.data.success) {
    log('✅ Invoices retrieved successfully', 'success');
    log(`   Found ${result.data.data?.length || 0} invoices`);
    if (result.data.pagination) {
      log(`   Page: ${result.data.pagination.page}/${result.data.pagination.totalPages}`);
    }
    return true;
  } else {
    log(`❌ Invoices retrieval failed: ${JSON.stringify(result.error)}`, 'error');
    return false;
  }
};

// Test automatic payments setup
const testAutomaticPayments = async () => {
  log('⚙️ Testing automatic payments setup...');
  
  const autoPayData = {
    paymentMethodId: 'pm_test_123456'
  };
  
  const result = await request('POST', '/payments/auto-pay', autoPayData);
  
  if (result.success && result.data.success) {
    log('✅ Automatic payments setup successfully', 'success');
    return true;
  } else {
    log(`❌ Automatic payments setup failed: ${JSON.stringify(result.error)}`, 'error');
    return false;
  }
};

// Main test function
const runPaymentTests = async () => {
  log('🚀 Starting Payment System Tests...');
  log('=' .repeat(50));
  
  const results = {
    paymentIntent: false,
    invoiceCreation: false,
    monthlyInvoice: false,
    paymentMethods: false,
    setupIntent: false,
    invoicesRetrieval: false,
    automaticPayments: false,
  };
  
  try {
    // Run all payment tests
    results.paymentIntent = await testPaymentIntent();
    results.invoiceCreation = await testInvoiceCreation();
    results.monthlyInvoice = await testMonthlyInvoice();
    results.paymentMethods = await testPaymentMethods();
    results.setupIntent = await testSetupIntent();
    results.invoicesRetrieval = await testInvoicesRetrieval();
    results.automaticPayments = await testAutomaticPayments();
    
    // Results summary
    log('=' .repeat(50));
    log('📊 PAYMENT SYSTEM TEST RESULTS', 'info');
    log('=' .repeat(50));
    
    const tests = [
      { name: 'Payment Intent Creation', result: results.paymentIntent },
      { name: 'Invoice Creation', result: results.invoiceCreation },
      { name: 'Monthly Invoice Generation', result: results.monthlyInvoice },
      { name: 'Payment Methods', result: results.paymentMethods },
      { name: 'Setup Intent', result: results.setupIntent },
      { name: 'Invoices Retrieval', result: results.invoicesRetrieval },
      { name: 'Automatic Payments', result: results.automaticPayments },
    ];
    
    let passed = 0;
    tests.forEach(test => {
      const status = test.result ? '✅ PASS' : '❌ FAIL';
      log(`${test.name}: ${status}`, test.result ? 'success' : 'error');
      if (test.result) passed++;
    });
    
    log('=' .repeat(50));
    log(`Overall: ${passed}/${tests.length} tests passed`, passed === tests.length ? 'success' : 'warning');
    
    if (passed >= 5) {
      log('🎉 Payment system is working well!', 'success');
    } else {
      log('⚠️  Payment system needs attention', 'warning');
    }
    
  } catch (error) {
    log(`❌ Payment test suite failed: ${error.message}`, 'error');
  }
};

// Run tests if called directly
if (require.main === module) {
  runPaymentTests();
}

module.exports = { runPaymentTests };
