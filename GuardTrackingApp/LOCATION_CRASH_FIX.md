# 🔧 Location Crash Fix - Check-in/Check-out

## ❌ Problem Identified
The app was crashing immediately when trying to Check-in or Check-out because of this error:
```
FATAL EXCEPTION: mqt_v_native
TypeError: Invalid task of type: undefined
```

## 🔍 Root Cause
In `CheckInOutScreen.tsx`, the code was using:
```javascript
const { Geolocation } = require('react-native');
```

This is **broken** because:
1. React Native removed the Geolocation module from core long ago
2. `require('react-native').Geolocation` returns `undefined`
3. Calling `undefined.getCurrentPosition()` causes the crash

## ✅ Fix Applied
Changed to use the safe location helper that properly imports `react-native-geolocation-service`:
```javascript
import { getCurrentLocationWithRetry } from '../../utils/safeLocationHelper';
```

This helper:
- Uses the correct `react-native-geolocation-service` package
- Handles permission requests properly
- Has retry logic for better reliability
- Includes error handling that won't crash the app

## 🚀 Rebuild the App

### Option 1: Debug Build (for testing with live logging)
```powershell
# Connect your phone via USB with USB Debugging enabled
cd c:\learnings\tracsopro\GuardTrackingApp

# Make sure Metro is running
npx react-native start --reset-cache

# In another terminal, build and install
npx react-native run-android
```

### Option 2: Release Build (for production testing)
```powershell
cd c:\learnings\tracsopro\GuardTrackingApp

# Create the JavaScript bundle
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

# Build the release APK
cd android
.\gradlew assembleRelease

# Install on connected device
adb install -r app\build\outputs\apk\release\app-release.apk
```

## 🔍 How to Debug (Get Crash Logs in Real-Time)

### 1. Connect Phone and Get Logs
```powershell
# Clear old logs and start watching in real-time
adb logcat -c
adb logcat *:S ReactNative:V ReactNativeJS:V AndroidRuntime:E tracsopro:V

# Or filter for crashes only
adb logcat *:S AndroidRuntime:E
```

### 2. Reproduce the Crash
- Open the app on your phone
- Navigate to the check-in screen
- Press the Check-in button
- Watch the terminal for errors

### 3. Save Logs to File
```powershell
# Run this AFTER a crash to capture the log
adb logcat -d > crash_log_new.txt
```

## 📱 Debugging Location on Emulator

Android emulators don't have real GPS, but you can fake location:

### Method 1: Android Studio Emulator Controls
1. Open Android Studio → AVD Manager → Start Emulator
2. Click the "..." (Extended Controls) button on the emulator sidebar
3. Go to **Location** tab
4. Enter latitude/longitude manually and click "Save point"
5. Click "Set Location" to push it to the emulator

### Method 2: ADB Command (for any emulator/device)
```powershell
# Enable mock locations first in Developer Options
# Then send a fake location:
adb emu geo fix <longitude> <latitude>

# Example: New York City
adb emu geo fix -73.9857 40.7484
```

### Method 3: Google Maps on Emulator
1. Open Google Maps on the emulator
2. Sign in to a Google account
3. Search for a location
4. This often triggers the GPS stack to work

## 🔄 Full Rebuild Steps (If Issues Persist)

```powershell
cd c:\learnings\tracsopro\GuardTrackingApp

# 1. Clean everything
cd android
.\gradlew clean
cd ..

# 2. Clear node cache
rmdir /s /q node_modules
npm install

# 3. Reset Metro cache
npx react-native start --reset-cache
# (Ctrl+C to stop after it starts)

# 4. Create bundle
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

# 5. Build release
cd android
.\gradlew assembleRelease
cd ..

# 6. Uninstall old app first
adb uninstall com.tracsopro

# 7. Install new APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

## 📋 Checklist After Fix

- [ ] Rebuilt the app with the fix
- [ ] Installed on test device
- [ ] Tested Check-in - no crash
- [ ] Tested Check-out - no crash
- [ ] Location is correctly captured (check backend logs)

## 🐛 If Still Crashing

If the app still crashes after this fix, run:
```powershell
adb logcat -d | Select-String -Pattern "FATAL|AndroidRuntime|tracsopro|TypeError" | Select-Object -Last 50
```

And share the output - there may be another issue.

---
**Fix completed**: January 12, 2026
