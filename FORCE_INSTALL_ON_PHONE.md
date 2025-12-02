# Force Install App on Phone (Not Emulator)

## Problem
App keeps installing on emulator instead of phone, even when phone is connected.

## Solution: Force Install on Phone

### Method 1: Close Emulator Completely (Easiest)

1. **Close Emulator:**
   - Close the emulator window completely
   - Or: Android Studio > Tools > Device Manager > Stop emulator

2. **Unplug and replug phone USB**

3. **Check phone screen:**
   - Look for "Allow USB debugging?" 
   - Tap "Allow" or "Always allow"

4. **Run:**
   ```bash
   cd GuardTrackingApp
   npx react-native run-android
   ```

### Method 2: Use ADB to Check Devices

If you have ADB in PATH or Android Studio:

```bash
# Find ADB (usually in Android SDK)
# Windows: C:\Users\<YourName>\AppData\Local\Android\Sdk\platform-tools\adb.exe

# List devices
adb devices

# Should show:
# List of devices attached
# emulator-5554    device    (Emulator - close this!)
# <your-phone-id>  device    (Your phone)
```

### Method 3: Disable Emulator in Android Studio

1. Open Android Studio
2. Go to: Tools > Device Manager
3. Right-click on the emulator
4. Select "Stop" or "Delete" (you can recreate it later)

### Method 4: Check Phone Connection

**On Phone:**
1. Settings > Developer Options
2. Make sure these are ON:
   - USB Debugging ✅
   - Install via USB ✅ (if available)
   - USB Debugging (Security settings) ✅

**USB Connection:**
1. When connected, pull down notification panel
2. Tap "USB" or "Charging this device"
3. Select "File Transfer" or "MTP"
4. NOT "Charging only"

**Check Phone Screen:**
- Should show "USB debugging connected" notification
- If you see "Allow USB debugging?" - tap Allow

### Method 5: Restart ADB Server

If phone still not detected:

```bash
# Kill ADB server
adb kill-server

# Start ADB server
adb start-server

# Check devices again
adb devices
```

### Method 6: Physical Check

1. **Unplug phone USB**
2. **Wait 5 seconds**
3. **Plug back in**
4. **Check phone screen for prompt**
5. **Tap "Allow"**
6. **Try installing again**

## Verify Phone is Detected

When you run `npx react-native run-android`, React Native should show:

```
info Installing the app...
> Task :app:installDebug
Installing APK 'app-debug.apk' on '<Your Phone Model>' for :app:debug
Installed on 1 device.
info Starting the app on "<phone-device-id>"...
```

**NOT:**
```
Installing APK 'app-debug.apk' on 'Pixel_9_Edited(AVD) - 16' for :app:debug
```

## If Still Not Working

1. **Try different USB cable** (some cables are charge-only)
2. **Try different USB port** on computer
3. **Restart phone**
4. **Restart computer** (sometimes helps)
5. **Check phone manufacturer drivers** (Samsung, Xiaomi, etc. may need special drivers)

## Quick Test

1. Close emulator completely
2. Unplug phone
3. Wait 10 seconds
4. Plug phone back in
5. Check phone screen for "Allow USB debugging?" - tap Allow
6. Run: `npx react-native run-android`

---

**Most common issue: Emulator is still running. Make sure it's completely closed!**

