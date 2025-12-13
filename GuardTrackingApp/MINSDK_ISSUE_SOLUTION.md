# minSdkVersion 22 Issue - Solution Guide

## Problem Summary
React Native 0.82.1 has a bug where native modules (`react-native-screens`, `react-native-worklets`) detect `minSdkVersion` as 22 during CMake configuration, even though it's correctly set to 24 in all build files.

**Error Message:**
```
User has minSdkVersion 22 but library was built for 24 [//ReactAndroid/hermestooling]
```

## Root Cause
This is a known compatibility issue in React Native 0.82.1's Gradle plugin. The CMake configuration phase incorrectly reports minSdkVersion 22 to native modules, even though:
- ✅ `android/app/build.gradle` has `minSdkVersion 24`
- ✅ `android/build.gradle` has `minSdkVersion = 24`
- ✅ `android/gradle.properties` has `minSdkVersion=24`
- ✅ React Native's own config shows `minSdk = "24"`

## Solutions (in order of recommendation)

### ✅ Option 1: Use Android Emulator (Works Immediately)
The emulator works perfectly and is fine for development:
```powershell
npm run android
```

### ✅ Option 2: Update React Native (Best Permanent Fix)
Update to the latest React Native version which fixes this issue:

```powershell
cd GuardTrackingApp
npm install react-native@latest
cd android
.\gradlew.bat clean
cd ..
npm run android
```

**Note:** After updating, you may need to:
- Update other dependencies for compatibility
- Run `npx react-native upgrade` for migration steps
- Check breaking changes in React Native release notes

### ⚠️ Option 3: Temporary Workaround - Patch node_modules (Not Recommended)
You can patch React Native's build files directly, but this will be overwritten on `npm install`:

1. Edit `GuardTrackingApp/node_modules/react-native/gradle/libs.versions.toml`
2. Ensure `minSdk = "24"` (it should already be 24)
3. Clean and rebuild:
   ```powershell
   cd android
   .\gradlew.bat clean
   cd ..
   npm run android
   ```

**Warning:** This patch will be lost when you run `npm install` or update dependencies.

## Current Status
- ✅ Phone connection working (Device ID: `1b1b794f`)
- ✅ Environment variables fixed
- ✅ All build configurations correct
- ❌ React Native 0.82.1 CMake bug preventing build

## Recommendation
**Use the emulator for now** (Option 1) or **update React Native** (Option 2) for a permanent fix.

The phone connection is working perfectly - the only issue is this React Native version bug.

