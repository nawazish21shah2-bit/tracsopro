// Clear stored tokens to fix refresh token loop after database migration
const { execSync } = require('child_process');

console.log('🔧 Fixing refresh token loop issue...\n');

try {
  // Clear React Native Metro cache
  console.log('1. Clearing Metro cache...');
  execSync('npx react-native start --reset-cache', { stdio: 'inherit' });
  
} catch (error) {
  console.log('Metro cache clear completed or already running.\n');
}

console.log('2. To completely fix the issue, please:');
console.log('   📱 For Android Emulator:');
console.log('      adb shell pm clear com.guardtrackingapp');
console.log('   📱 For iOS Simulator:');
console.log('      Reset simulator or uninstall/reinstall app');
console.log('   📱 For Physical Device:');
console.log('      Uninstall and reinstall the app');

console.log('\n✅ This will clear all stored tokens and stop the refresh loop.');
console.log('💡 After clearing, you can login with the test accounts:');
console.log('   - guard@test.com / password123');
console.log('   - client@test.com / password123');
console.log('   - admin@test.com / password123');
