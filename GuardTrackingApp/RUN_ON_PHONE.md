# Simple Guide: Run App on Your Phone

## ✅ Your Phone is Connected!
Device ID: `1b1b794f`

## Current Issue
There's a build configuration issue with minSdkVersion. Here's a workaround:

## Quick Fix - Try This First:

1. **Make sure your phone is still connected:**
   ```powershell
   cd GuardTrackingApp
   .\check-phone.ps1
   ```

2. **Try building with a workaround:**
   ```powershell
   cd GuardTrackingApp
   $env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"
   $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
   npx react-native run-android --device=1b1b794f --no-packager
   ```

## Alternative: Build APK and Install Manually

If the build keeps failing, you can build the APK and install it manually:

1. **Build the APK:**
   ```powershell
   cd GuardTrackingApp\android
   .\gradlew.bat assembleDebug
   ```

2. **Find the APK:**
   - Location: `GuardTrackingApp\android\app\build\outputs\apk\debug\app-debug.apk`

3. **Install on your phone:**
   ```powershell
   $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
   & "$env:ANDROID_HOME\platform-tools\adb.exe" -s 1b1b794f install GuardTrackingApp\android\app\build\outputs\apk\debug\app-debug.apk
   ```

4. **Start Metro bundler:**
   ```powershell
   cd GuardTrackingApp
   npm start
   ```

5. **Open the app on your phone** - it should connect to Metro automatically.

## Next Steps to Fix Build Issue

The minSdkVersion error suggests React Native libraries expect minSdk 24, but something is reading 22. This might require:
- Updating React Native version
- Or checking if there's a gradle.properties override

For now, try the manual APK install method above - it should work!

