# 🔧 APK Installation Troubleshooting Guide

## Common Installation Issues & Solutions

### Issue 1: "App not installed" or "Installation blocked"

**Solution A: Enable Unknown Sources**

1. Go to **Settings** → **Security** (or **Apps** → **Special access**)
2. Enable **"Install unknown apps"** or **"Unknown sources"**
3. For Android 8.0+: Enable it for the specific app you're using to install (File Manager, Chrome, etc.)

**Solution B: Install via ADB**

```powershell
# Connect device via USB
# Enable USB Debugging on device
adb devices  # Verify device is connected
adb install GuardTrackingApp\android\app\build\outputs\apk\release\app-release.apk
```

---

### Issue 2: "Package appears to be corrupt"

**Solution: Rebuild with proper signing**

The current build uses debug signing. For production, you need a release keystore:

```bash
cd GuardTrackingApp/android/app

# Generate release keystore
keytool -genkeypair -v -storetype PKCS12 -keystore guard-tracking-release.keystore -alias guard-tracking-key -keyalg RSA -keysize 2048 -validity 10000
```

Then update `build.gradle` (see RELEASE_BUILD_GUIDE.md for details).

**Quick Fix: Use Debug APK for Testing**

```bash
cd GuardTrackingApp/android
./gradlew assembleDebug
```

Install the debug APK:
```powershell
adb install GuardTrackingApp\android\app\build\outputs\apk\debug\app-debug.apk
```

---

### Issue 3: "App not installed as package appears to be invalid"

**Solution: Check APK integrity**

```powershell
# Verify APK exists and has size
Get-Item "GuardTrackingApp\android\app\build\outputs\apk\release\app-release.apk" | Select-Object Name, Length

# Try installing with ADB to see detailed error
adb install -r GuardTrackingApp\android\app\build\outputs\apk\release\app-release.apk
```

The `-r` flag replaces existing installation if app is already installed.

---

### Issue 4: "Insufficient storage available"

**Solution:**
- Free up space on device (need at least 100MB free)
- Clear app cache
- Uninstall previous version if exists

---

### Issue 5: "App already installed with different signature"

**Solution: Uninstall existing version first**

```powershell
# Uninstall existing app
adb uninstall com.guardtrackingapp

# Then install new version
adb install GuardTrackingApp\android\app\build\outputs\apk\release\app-release.apk
```

Or manually:
- Settings → Apps → Find "Guard Tracking App" → Uninstall
- Then install new APK

---

### Issue 6: Installation starts but fails silently

**Solution: Check device logs**

```powershell
# Connect device and check logs
adb logcat | findstr "PackageManager"
```

Or check device:
- Settings → Apps → See if app appears but is disabled
- Try enabling it

---

## ✅ Step-by-Step Installation Guide

### Method 1: ADB Installation (Recommended)

1. **Enable USB Debugging** on your Android device:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"

2. **Connect device via USB**

3. **Verify connection:**
   ```powershell
   adb devices
   ```
   Should show your device listed

4. **Install APK:**
   ```powershell
   cd c:\learnings\tracsopro
   adb install -r GuardTrackingApp\android\app\build\outputs\apk\release\app-release.apk
   ```

### Method 2: Manual Installation

1. **Copy APK to device:**
   - Connect device via USB
   - Copy `app-release.apk` to device storage (Downloads folder)

2. **Enable Unknown Sources:**
   - Settings → Security → Enable "Unknown sources"
   - Or Settings → Apps → Special access → Install unknown apps

3. **Install:**
   - Open File Manager on device
   - Navigate to Downloads
   - Tap `app-release.apk`
   - Tap "Install"

---

## 🔍 Diagnostic Commands

### Check APK Details

```powershell
# Get APK info
aapt dump badging GuardTrackingApp\android\app\build\outputs\apk\release\app-release.apk
```

### Check Device Compatibility

```powershell
# Check device Android version
adb shell getprop ro.build.version.release

# Check device architecture
adb shell getprop ro.product.cpu.abi
```

### Verify Installation

```powershell
# Check if app is installed
adb shell pm list packages | findstr guardtracking

# Get app info
adb shell dumpsys package com.guardtrackingapp
```

---

## 🚀 Quick Fix: Build and Install Debug APK

If release APK won't install, try debug version:

```powershell
cd GuardTrackingApp\android
.\gradlew assembleDebug
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

Debug APK uses debug signing which is more permissive for installation.

---

## 📱 Alternative: Use Android Studio

1. Open `GuardTrackingApp/android` in Android Studio
2. Connect device
3. Click **Run** → **Run 'app'**
4. Select your device
5. App will build and install automatically

---

## ⚠️ Common Errors

### "INSTALL_FAILED_INSUFFICIENT_STORAGE"
- Free up device storage

### "INSTALL_FAILED_UPDATE_INCOMPATIBLE"
- Uninstall existing version first

### "INSTALL_PARSE_FAILED_NO_CERTIFICATES"
- APK is corrupted, rebuild it

### "INSTALL_FAILED_DUPLICATE_PACKAGE"
- App already installed, uninstall first

---

## 🎯 Next Steps

1. **Try ADB installation first** (most reliable)
2. **If that fails, try debug APK**
3. **Check device logs** for specific error
4. **Verify device compatibility** (Android 7.0+ required)

---

**Need more help?** Share the specific error message you're seeing!




