# Android APK Build Guide

Complete guide to build and test your Guard Tracking App on Android.

## 📋 Prerequisites

1. **Node.js** (v20+) installed
2. **Java Development Kit (JDK)** 17 or 21
3. **Android Studio** installed
4. **Android SDK** configured
5. **Environment variables** set:
   - `ANDROID_HOME` or `ANDROID_SDK_ROOT`
   - `JAVA_HOME`

## 🔧 Setup Steps

### Step 1: Verify Prerequisites

```bash
# Check Node.js version
node --version  # Should be >= 20

# Check Java version
java -version  # Should be 17 or 21

# Check Android SDK
echo $ANDROID_HOME
# or
echo $ANDROID_SDK_ROOT
```

### Step 2: Install Dependencies

```bash
cd GuardTrackingApp
npm install
```

### Step 3: Configure Android Build

Check `android/app/build.gradle` for:
- `applicationId` (your app package name)
- `versionCode` and `versionName`
- Signing configuration (for release builds)

### Step 4: Generate Signing Key (For Release Build)

**For testing, you can skip this and use debug build.**

For release build, create a keystore:

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

Then configure `android/app/build.gradle` with signing config.

## 🏗️ Build Commands

### Option 1: Debug Build (For Testing)

**Build APK:**
```bash
cd GuardTrackingApp
cd android
./gradlew assembleDebug
```

**Output location:**
```
GuardTrackingApp/android/app/build/outputs/apk/debug/app-debug.apk
```

**Install on connected device:**
```bash
cd GuardTrackingApp
npx react-native run-android
```

### Option 2: Release Build (For Distribution)

**Build APK:**
```bash
cd GuardTrackingApp
cd android
./gradlew assembleRelease
```

**Output location:**
```
GuardTrackingApp/android/app/build/outputs/apk/release/app-release.apk
```

**Note:** Release builds require signing configuration.

### Option 3: Bundle Build (For Play Store)

```bash
cd GuardTrackingApp
cd android
./gradlew bundleRelease
```

**Output location:**
```
GuardTrackingApp/android/app/build/outputs/bundle/release/app-release.aab
```

## 📱 Install APK on Device

### Method 1: Using ADB (Android Debug Bridge)

```bash
# Connect device via USB and enable USB debugging
adb devices  # Verify device is connected

# Install APK
adb install GuardTrackingApp/android/app/build/outputs/apk/debug/app-debug.apk
```

### Method 2: Transfer and Install Manually

1. Copy APK to your phone (via USB, email, or cloud storage)
2. On your phone, enable "Install from Unknown Sources"
3. Open the APK file and install

### Method 3: Using React Native CLI

```bash
cd GuardTrackingApp
npx react-native run-android
```

This will build and install automatically if device is connected.

## 🔍 Troubleshooting

### Build Fails with "SDK location not found"

```bash
# Create local.properties file
cd GuardTrackingApp/android
echo "sdk.dir=$ANDROID_HOME" > local.properties
# or
echo "sdk.dir=$ANDROID_SDK_ROOT" > local.properties
```

### Build Fails with Java Version Error

Make sure you're using JDK 17 or 21:

```bash
# Check current Java version
java -version

# Set JAVA_HOME if needed
export JAVA_HOME=/path/to/jdk-17
```

### Build Fails with "Gradle Sync Failed"

```bash
cd GuardTrackingApp/android
./gradlew clean
./gradlew build
```

### APK Installation Fails

1. Enable "USB Debugging" in Developer Options
2. Enable "Install from Unknown Sources"
3. Uninstall previous version if exists:
   ```bash
   adb uninstall com.guardtrackingapp
   ```

## 🎯 Quick Build Script

Create a file `build-android.sh`:

```bash
#!/bin/bash

cd GuardTrackingApp

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building Android APK..."
cd android
./gradlew clean
./gradlew assembleDebug

echo "✅ Build complete!"
echo "📱 APK location: android/app/build/outputs/apk/debug/app-debug.apk"
```

Make it executable:
```bash
chmod +x build-android.sh
./build-android.sh
```

## 📝 Build Configuration

### Update App Version

Edit `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 1
        versionName "1.0.0"
        applicationId "com.guardtrackingapp"
    }
}
```

### Update App Name

Edit `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">Guard Tracking</string>
</resources>
```

## ✅ Pre-Build Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Android SDK configured
- [ ] JAVA_HOME set correctly
- [ ] API configuration updated in `src/config/apiConfig.ts`
- [ ] Device connected (for direct install) or APK ready for transfer
- [ ] USB debugging enabled (if using ADB)

## 🚀 Testing the Build

After installing the APK:

1. **Open the app** on your device
2. **Test API connection** - try to register/login
3. **Check logs** if issues:
   ```bash
   adb logcat | grep -i "guard\|react"
   ```

## 📦 Distribution

For testing, use the debug APK. For production:

1. Build release APK with proper signing
2. Test thoroughly
3. Upload to Play Store or distribute directly

---

**Your APK will be ready at:**
`GuardTrackingApp/android/app/build/outputs/apk/debug/app-debug.apk`


