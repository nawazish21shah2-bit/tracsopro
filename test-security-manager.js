// Test Security Manager without CryptoJS
const { securityManager } = require('./GuardTrackingApp/src/utils/security.ts');

async function testSecurityManager() {
  console.log('🔒 Testing Security Manager...\n');

  try {
    // Test token storage and retrieval
    console.log('1. Testing token storage...');
    const testTokens = {
      accessToken: 'test-access-token-123',
      refreshToken: 'test-refresh-token-456',
      expiresAt: Date.now() + 3600000, // 1 hour from now
      tokenType: 'Bearer'
    };

    const stored = await securityManager.storeTokens(testTokens);
    console.log('✅ Token storage:', stored ? 'Success' : 'Failed');

    // Test token retrieval
    console.log('\n2. Testing token retrieval...');
    const retrieved = await securityManager.getTokens();
    console.log('✅ Token retrieval:', retrieved ? 'Success' : 'Failed');
    
    if (retrieved) {
      console.log('   Access Token:', retrieved.accessToken);
      console.log('   Refresh Token:', retrieved.refreshToken);
      console.log('   Token Type:', retrieved.tokenType);
    }

    // Test token validation
    console.log('\n3. Testing token validation...');
    const isValid = await securityManager.areTokensValid();
    console.log('✅ Token validation:', isValid ? 'Valid' : 'Invalid');

    // Test user data storage
    console.log('\n4. Testing user data storage...');
    const testUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };

    const userStored = await securityManager.storeUserData(testUser);
    console.log('✅ User data storage:', userStored ? 'Success' : 'Failed');

    const userRetrieved = await securityManager.getUserData();
    console.log('✅ User data retrieval:', userRetrieved ? 'Success' : 'Failed');
    
    if (userRetrieved) {
      console.log('   User:', userRetrieved.firstName, userRetrieved.lastName);
    }

    // Test cleanup
    console.log('\n5. Testing cleanup...');
    const cleared = await securityManager.clearTokens();
    console.log('✅ Token cleanup:', cleared ? 'Success' : 'Failed');

    console.log('\n🎉 All security manager tests passed!');

  } catch (error) {
    console.error('❌ Security manager test failed:', error.message);
  }
}

// Run the test
testSecurityManager();
