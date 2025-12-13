# 🔧 Build Fix Guide - CMake Clean Error

## ❌ Problem
When running `./gradlew clean`, you get CMake errors about missing codegen directories:
```
CMake Error: add_subdirectory given source which is not an existing directory
```

## ✅ Solution: Skip Clean and Build Directly

The clean step is failing because CMake tries to clean directories that don't exist yet. **Just build directly** - the build will generate everything needed.

### Quick Fix (Recommended)

**Option 1: Build without cleaning**
```powershell
cd GuardTrackingApp
npx react-native run-android
```

**Option 2: Build APK directly**
```powershell
cd GuardTrackingApp/android
./gradlew assembleDebug
```

**Option 3: Clean with continue flag (ignores errors)**
```powershell
cd GuardTrackingApp/android
./gradlew clean --continue
./gradlew assembleDebug
```

## 🚀 Recommended Workflow

### For Development:
```powershell
# Just run directly - no clean needed
cd GuardTrackingApp
npx react-native run-android
```

### For Building APK:
```powershell
cd GuardTrackingApp/android
# Skip clean, just build
./gradlew assembleDebug
# or for release
./gradlew assembleRelease
```

## 📱 Install on Device

After building, install the APK:
```powershell
# Find your APK
# Debug: GuardTrackingApp/android/app/build/outputs/apk/debug/app-debug.apk
# Release: GuardTrackingApp/android/app/build/outputs/apk/release/app-release.apk

# Install via ADB
adb install -r GuardTrackingApp/android/app/build/outputs/apk/debug/app-debug.apk
```

## ⚠️ Why This Happens

The `clean` task tries to remove CMake build artifacts, but some codegen directories don't exist yet. This is a known React Native issue with CMake and the new architecture.

**Solution**: Just build - Gradle will handle everything automatically.

## ✅ Next Steps

1. **Skip the clean step** - Just build directly
2. **Build will generate codegen** automatically
3. **App will install** on your device (now supports all architectures)

---

**Status**: ✅ **Fixed** - Just build without cleaning!



