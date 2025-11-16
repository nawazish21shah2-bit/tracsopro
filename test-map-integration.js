/**
 * Map Integration Test Script
 * Tests the react-native-maps integration in the Guard Tracking App
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🗺️  Starting Map Integration Test...\n');

// Test 1: Verify react-native-maps is installed
console.log('1. Checking react-native-maps installation...');
try {
  const packageJson = JSON.parse(fs.readFileSync('./GuardTrackingApp/package.json', 'utf8'));
  const mapsVersion = packageJson.dependencies['react-native-maps'];
  if (mapsVersion) {
    console.log('✅ react-native-maps installed:', mapsVersion);
  } else {
    console.log('❌ react-native-maps not found in dependencies');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
  process.exit(1);
}

// Test 2: Verify Android configuration
console.log('\n2. Checking Android configuration...');
try {
  const androidManifest = fs.readFileSync('./GuardTrackingApp/android/app/src/main/AndroidManifest.xml', 'utf8');
  
  // Check permissions
  if (androidManifest.includes('ACCESS_FINE_LOCATION') && androidManifest.includes('ACCESS_COARSE_LOCATION')) {
    console.log('✅ Location permissions configured');
  } else {
    console.log('❌ Location permissions missing');
  }
  
  // Check Google Maps API key
  if (androidManifest.includes('com.google.android.geo.API_KEY')) {
    console.log('✅ Google Maps API key configuration found');
    console.log('⚠️  Remember to replace YOUR_GOOGLE_MAPS_API_KEY_HERE with actual API key');
  } else {
    console.log('❌ Google Maps API key configuration missing');
  }
} catch (error) {
  console.log('❌ Error reading AndroidManifest.xml:', error.message);
}

// Test 3: Verify iOS configuration
console.log('\n3. Checking iOS configuration...');
try {
  const infoPlist = fs.readFileSync('./GuardTrackingApp/ios/GuardTrackingApp/Info.plist', 'utf8');
  
  // Check location permissions
  if (infoPlist.includes('NSLocationWhenInUseUsageDescription') && 
      infoPlist.includes('NSLocationAlwaysAndWhenInUseUsageDescription')) {
    console.log('✅ iOS location permissions configured');
  } else {
    console.log('❌ iOS location permissions missing');
  }
} catch (error) {
  console.log('❌ Error reading Info.plist:', error.message);
}

// Test 4: Verify InteractiveMapView component
console.log('\n4. Checking InteractiveMapView component...');
try {
  const mapComponent = fs.readFileSync('./GuardTrackingApp/src/components/client/InteractiveMapView.tsx', 'utf8');
  
  // Check for MapView import
  if (mapComponent.includes('import MapView')) {
    console.log('✅ MapView imported correctly');
  } else {
    console.log('❌ MapView import missing');
  }
  
  // Check for real MapView usage
  if (mapComponent.includes('<MapView') && mapComponent.includes('ref={mapRef}')) {
    console.log('✅ Real MapView component implemented');
  } else {
    console.log('❌ MapView component not properly implemented');
  }
  
  // Check for markers
  if (mapComponent.includes('<Marker') && mapComponent.includes('guardLocations.map')) {
    console.log('✅ Guard markers implemented');
  } else {
    console.log('❌ Guard markers missing');
  }
  
  // Check for geofences
  if (mapComponent.includes('<Circle') && mapComponent.includes('<Polygon')) {
    console.log('✅ Geofence components implemented');
  } else {
    console.log('❌ Geofence components missing');
  }
} catch (error) {
  console.log('❌ Error reading InteractiveMapView.tsx:', error.message);
}

// Test 5: Check ClientDashboard integration
console.log('\n5. Checking ClientDashboard integration...');
try {
  const clientDashboard = fs.readFileSync('./GuardTrackingApp/src/screens/client/ClientDashboard.tsx', 'utf8');
  
  if (clientDashboard.includes('InteractiveMapView') && clientDashboard.includes('Live Guards Location')) {
    console.log('✅ InteractiveMapView integrated in ClientDashboard');
  } else {
    console.log('❌ InteractiveMapView not found in ClientDashboard');
  }
} catch (error) {
  console.log('❌ Error reading ClientDashboard.tsx:', error.message);
}

// Test 6: Check AdminOperationsCenter integration
console.log('\n6. Checking AdminOperationsCenter integration...');
try {
  const adminOps = fs.readFileSync('./GuardTrackingApp/src/screens/admin/AdminOperationsCenter.tsx', 'utf8');
  
  if (adminOps.includes('InteractiveMapView') && adminOps.includes('Live Guard Locations')) {
    console.log('✅ InteractiveMapView integrated in AdminOperationsCenter');
  } else {
    console.log('❌ InteractiveMapView not found in AdminOperationsCenter');
  }
} catch (error) {
  console.log('❌ Error reading AdminOperationsCenter.tsx:', error.message);
}

// Test 7: Syntax check
console.log('\n7. Running TypeScript syntax check...');
try {
  process.chdir('./GuardTrackingApp');
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
  console.log('✅ TypeScript syntax check passed');
} catch (error) {
  console.log('❌ TypeScript syntax errors found:');
  console.log(error.stdout?.toString() || error.message);
} finally {
  process.chdir('..');
}

console.log('\n🗺️  Map Integration Test Complete!\n');

console.log('📋 Next Steps:');
console.log('1. Replace YOUR_GOOGLE_MAPS_API_KEY_HERE with actual Google Maps API key');
console.log('2. Run: cd GuardTrackingApp && npm install');
console.log('3. For Android: cd android && ./gradlew clean');
console.log('4. For iOS: cd ios && pod install');
console.log('5. Test on device/simulator: npm run android or npm run ios');
console.log('6. Verify map loads and shows guard markers');
console.log('7. Test zoom controls and geofence toggles');
console.log('8. Verify real-time location updates');

console.log('\n⚠️  Important Notes:');
console.log('- Google Maps API key is required for Android');
console.log('- Location permissions must be granted on device');
console.log('- Test on physical device for best results');
console.log('- Ensure backend WebSocket service is running for live updates');
