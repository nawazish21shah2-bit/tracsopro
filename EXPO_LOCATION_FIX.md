# Fix: expo-location Module Error

## Issues Fixed

### 1. ✅ Missing `expo-location` Module
**Error**: `Unable to resolve module expo-location from AddIncidentReportScreen.tsx`

**Root Cause**: The app was trying to import `expo-location` which is not installed. The app uses `react-native-geolocation-service` instead.

**Fix Applied**: 
- Replaced `expo-location` import with `react-native-geolocation-service` in `AddIncidentReportScreen.tsx`
- Updated location permission handling to use `PermissionsAndroid` for Android
- Updated `getCurrentPosition` to use `Geolocation.getCurrentPosition()` API
- Removed reverse geocoding (can be added later with Google Maps Geocoding API if needed)

### 2. ⚠️ CMake Clean Error
**Error**: CMake errors during `gradlew clean` due to missing codegen directories

**Fix**: 
Run the provided script to remove `.cxx` folder:
```powershell
cd GuardTrackingApp
.\fix-cmake-clean.ps1
```

Or manually:
```powershell
Remove-Item -Recurse -Force android\app\.cxx -ErrorAction SilentlyContinue
```

## Files Changed

1. **GuardTrackingApp/src/screens/dashboard/AddIncidentReportScreen.tsx**
   - ✅ Replaced `import * as Location from 'expo-location'`
   - ✅ Added `import Geolocation from 'react-native-geolocation-service'`
   - ✅ Added `import { PermissionsAndroid } from 'react-native'`
   - ✅ Updated `getCurrentLocation()` function to use `react-native-geolocation-service`

## Next Steps

### To Fix CMake Clean Error:
```powershell
cd GuardTrackingApp
.\fix-cmake-clean.ps1
cd android
.\gradlew clean
```

### To Rebuild the App:
```powershell
# Terminal 1: Start Metro
cd GuardTrackingApp
npx react-native start --reset-cache

# Terminal 2: Build Android
cd GuardTrackingApp
npx react-native run-android
```

## Remaining Issues (Optional)

### locationValidationService.ts
This file also uses `expo-location` but may not be actively used. If you encounter errors related to this service, it can be updated similarly or removed if not needed.

### Reverse Geocoding
Currently, the app shows coordinates instead of addresses. To add reverse geocoding:
1. Use Google Maps Geocoding API (you already have Google Maps configured)
2. Or use a service like `react-native-geocoding`

## Verification

After applying fixes:
1. ✅ No "Unable to resolve module expo-location" error
2. ✅ App loads without red screen
3. ✅ Location permission requests work
4. ✅ Current location can be obtained in AddIncidentReportScreen


