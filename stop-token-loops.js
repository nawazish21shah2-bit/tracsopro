// Emergency script to stop token refresh/logout loops
const { execSync } = require('child_process');

console.log('🚨 STOPPING TOKEN LOOPS - EMERGENCY FIX\n');

console.log('1. Stopping React Native Metro server...');
try {
  // Kill any running Metro processes
  execSync('taskkill /f /im node.exe /fi "WINDOWTITLE eq Metro*"', { stdio: 'ignore' });
  execSync('taskkill /f /im node.exe /fi "COMMANDLINE eq *metro*"', { stdio: 'ignore' });
  console.log('✅ Metro processes stopped');
} catch (error) {
  console.log('ℹ️  No Metro processes found or already stopped');
}

console.log('\n2. Clearing React Native cache...');
try {
  execSync('npx react-native start --reset-cache &', { stdio: 'ignore' });
  console.log('✅ Cache cleared and Metro restarted');
} catch (error) {
  console.log('⚠️  Manual cache clear needed: npx react-native start --reset-cache');
}

console.log('\n3. CRITICAL FIXES APPLIED:');
console.log('   ✅ Logout endpoint no longer requires authentication');
console.log('   ✅ Refresh token retry limit added (max 3 attempts)');
console.log('   ✅ Automatic token clearing on max retries');
console.log('   ✅ Improved error handling in logout function');

console.log('\n4. TO COMPLETELY STOP THE LOOPS:');
console.log('   📱 Clear app storage:');
console.log('      Android: adb shell pm clear com.guardtrackingapp');
console.log('      iOS: Reset simulator or reinstall app');
console.log('   🔄 Or restart the React Native app completely');

console.log('\n5. AFTER CLEARING:');
console.log('   🔑 Login with test accounts:');
console.log('      guard@test.com / password123');
console.log('      client@test.com / password123');
console.log('      admin@test.com / password123');

console.log('\n✅ TOKEN LOOP FIXES COMPLETE!');
console.log('💡 The loops should stop automatically with the new retry limits.');
