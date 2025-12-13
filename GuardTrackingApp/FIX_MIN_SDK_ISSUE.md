# Fix for minSdkVersion 22 Issue

## Problem
React Native 0.82.1 has a bug where its Gradle plugin incorrectly passes `minSdkVersion 22` to CMake during native module configuration, even though it's set to 24 everywhere. This causes build failures for native modules like `react-native-screens` and `react-native-worklets`.

## Root Cause
The issue is in React Native 0.82.1's compiled Gradle plugin (`@react-native/gradle-plugin`), which cannot be easily patched. The plugin reads minSdkVersion from an internal source and passes 22 to CMake, causing the error:
```
User has minSdkVersion 22 but library was built for 24 [//ReactAndroid/hermestooling]
```

## What We've Tried
1. ✅ Set minSdkVersion 24 in `android/app/build.gradle`
2. ✅ Set minSdkVersion 24 in `android/build.gradle`
3. ✅ Set minSdkVersion 24 in `android/gradle.properties`
4. ✅ Patched `react-native-screens/android/build.gradle` to force minSdkVersion 24
5. ✅ Patched `react-native-worklets/android/build.gradle` to force minSdkVersion 24
6. ✅ Added `-DANDROID_PLATFORM=android-24` to CMake arguments
7. ✅ Deep cleaned all build caches

**All attempts failed** because React Native's Gradle plugin reads minSdkVersion from its internal configuration, not from these files.

## Solutions

### Option 1: Update React Native (Recommended)
Update to the latest React Native version which fixes this bug:

```powershell
cd GuardTrackingApp
npm install react-native@latest
cd android
.\gradlew.bat clean
cd ..
npm run android
```

**Note:** This may require updating other dependencies for compatibility.

### Option 2: Use Patch-Package (Temporary Workaround)
Install `patch-package` to persist the patches we made:

```powershell
npm install --save-dev patch-package postinstall-postinstall
```

Add to `package.json`:
```json
"scripts": {
  "postinstall": "patch-package"
}
```

Then create patches:
```powershell
npx patch-package react-native-screens
npx patch-package react-native-worklets
```

**Warning:** This is a temporary workaround and patches will need to be reapplied after `npm install`.

### Option 3: Wait for React Native 0.82.2+
A patch version may be released that fixes this issue.

## Current Status
- ✅ Phone connection working (Device ID: `1b1b794f`)
- ✅ All build configurations correct
- ✅ Environment variables fixed
- ❌ React Native 0.82.1 Gradle plugin bug preventing build

## Recommendation
**Update React Native** to the latest version. This is the proper fix and will resolve the issue permanently.

