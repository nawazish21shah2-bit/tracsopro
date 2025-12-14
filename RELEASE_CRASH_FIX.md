# 🔧 Release Build Crash Fix Guide

## ❌ Problem
Release build installs but **crashes immediately** when opened.

## 🔍 Common Causes

### 1. **JavaScript Bundle Not Included** (Most Likely)
Release builds need the JavaScript bundle bundled into the APK. If Metro bundler isn't running or bundle isn't generated, the app crashes.

### 2. **Missing ProGuard Rules**
If ProGuard is enabled and strips necessary code, the app crashes.

### 3. **Native Module Issues**
Missing native libraries or incompatible architectures.

### 4. **Missing Assets**
Fonts, images, or other assets not included in release build.

## ✅ Solutions

### Solution 1: Build Bundle First (Recommended)

**Step 1: Generate JavaScript Bundle**
```powershell
cd GuardTrackingApp
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/
```

**Step 2: Build Release APK**
```powershell
cd android
.\gradlew assembleRelease
```

**Step 3: Install and Test**
```powershell
adb install -r app/build/outputs/apk/release/app-release.apk
```

### Solution 2: Use React Native CLI (Easier)

This automatically bundles JavaScript:
```powershell
cd GuardTrackingApp
npx react-native run-android --mode=release
```

### Solution 3: Check Crash Logs

**Get crash logs from device:**
```powershell
# If adb is in PATH
adb logcat -d | Select-String -Pattern "FATAL|AndroidRuntime|tracsopro" | Select-Object -Last 30

# Or find adb in Android SDK
$env:ANDROID_HOME\platform-tools\adb.exe logcat -d | Select-String -Pattern "FATAL|AndroidRuntime" | Select-Object -Last 30
```

**Common error patterns:**
- `Unable to load script` = Missing JavaScript bundle
- `ClassNotFoundException` = ProGuard stripped class
- `UnsatisfiedLinkError` = Missing native library
- `Asset not found` = Missing asset file

### Solution 4: Disable ProGuard (Temporary)

If ProGuard is causing issues, disable it:

**Edit `GuardTrackingApp/android/app/build.gradle`:**
```gradle
def enableProguardInReleaseBuilds = false  // Change to false
```

Then rebuild.

### Solution 5: Add Essential ProGuard Rules

If ProGuard is enabled, add these rules to `proguard-rules.pro`:

```proguard
# React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}

# Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
```

## 🚀 Quick Fix (Try This First)

**Option A: Build with Bundle (Recommended)**
```powershell
cd GuardTrackingApp

# 1. Generate bundle
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

# 2. Create assets directory if it doesn't exist
New-Item -ItemType Directory -Force -Path android/app/src/main/assets

# 3. Build release
cd android
.\gradlew assembleRelease

# 4. Install
cd ..
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

**Option B: Use React Native CLI**
```powershell
cd GuardTrackingApp
npx react-native run-android --mode=release
```

## 🔍 Debugging Steps

### 1. Check if Bundle Exists
```powershell
# Check if bundle file exists in APK
# The bundle should be at: android/app/src/main/assets/index.android.bundle
Test-Path GuardTrackingApp/android/app/src/main/assets/index.android.bundle
```

### 2. Check APK Contents
```powershell
# Unzip APK and check for bundle
cd GuardTrackingApp/android/app/build/outputs/apk/release
Expand-Archive -Path app-release.apk -DestinationPath apk-contents -Force
Get-ChildItem -Recurse apk-contents | Where-Object { $_.Name -like "*bundle*" }
```

### 3. Enable Debug Logging
Add to `MainApplication.kt` or `MainApplication.java`:
```kotlin
if (BuildConfig.DEBUG) {
    Log.d("ReactNative", "Bundle path: ${applicationContext.filesDir.absolutePath}")
}
```

## 📝 Most Likely Fix

**The JavaScript bundle is missing!** Release builds need the bundle pre-packaged.

**Quick fix:**
```powershell
cd GuardTrackingApp

# Create assets directory
New-Item -ItemType Directory -Force -Path android/app/src/main/assets

# Generate bundle
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

# Rebuild
cd android
.\gradlew clean
.\gradlew assembleRelease
```

## ⚠️ Important Notes

1. **Metro Bundler**: Not needed for release builds (bundle is pre-packaged)
2. **Assets**: Must be included in `android/app/src/main/res/`
3. **ProGuard**: If enabled, must have proper rules
4. **Native Modules**: Must be compiled for all architectures

## 🎯 Next Steps

1. **Try Solution 1** (build bundle first)
2. **Check crash logs** to see exact error
3. **Verify bundle exists** in APK
4. **Test on device** after rebuild

---

**Status**: 🔧 **Debugging** - Check crash logs and ensure bundle is included!

