# Phone Not Detected - Fix Guide

## Problem
React Native is automatically launching the emulator because it can't detect your phone.

## Solution Steps

### Step 1: Check Phone Connection

**On Your Phone:**
1. **Unplug USB cable**
2. **Wait 10 seconds**
3. **Plug back in**
4. **Check phone screen** - Look for:
   - "Allow USB debugging?" popup → Tap **"Allow"** or **"Always allow from this computer"**
   - Notification saying "USB debugging connected"

### Step 2: Check USB Mode

**On Phone:**
1. Pull down notification panel
2. Tap "USB" or "Charging this device"
3. Select **"File Transfer"** or **"MTP"**
4. **NOT** "Charging only"

### Step 3: Check Developer Options

**On Phone:**
1. Settings → Developer Options
2. Make sure these are **ON**:
   - ✅ USB Debugging
   - ✅ Install via USB (if available)
   - ✅ USB Debugging (Security settings) - if available

### Step 4: Try Different USB Cable/Port

- Some USB cables are **charge-only** (won't work for debugging)
- Try a **different USB cable**
- Try a **different USB port** on your computer

### Step 5: Check Phone Drivers

**For Windows:**
- Some phone brands need special drivers (Samsung, Xiaomi, etc.)
- Check your phone manufacturer's website for USB drivers
- Or install Android USB drivers from Android Studio

### Step 6: Prevent Auto-Launch Emulator

React Native auto-launches emulator when no device is found. To prevent this:

**Option A: Use flag to prevent auto-launch**
```bash
cd GuardTrackingApp
npx react-native run-android --no-packager
```

**Option B: Check if phone is detected first**
React Native should detect your phone automatically if it's properly connected.

### Step 7: Verify Phone is Detected

**Check if phone shows up:**
When you run the command, React Native should detect your phone. If it doesn't, the phone isn't being recognized.

**Signs phone is detected:**
- No "Launching emulator" message
- Shows your phone model in the output
- Installs on your phone, not emulator

**Signs phone is NOT detected:**
- "Launching emulator" message appears
- Installs on "Pixel_9_Edited(AVD)" or similar
- No phone model shown in output

## Quick Test

1. **Unplug phone**
2. **Close emulator completely**
3. **Run:** `npx react-native run-android`
4. **Should show error:** "No devices/emulators found"
5. **Plug phone in**
6. **Check phone screen for "Allow USB debugging?"**
7. **Tap "Allow"**
8. **Run again:** `npx react-native run-android`

## Common Issues

### "Allow USB debugging?" not appearing
- Unplug and replug USB
- Revoke USB debugging authorizations (Settings → Developer Options → Revoke USB debugging authorizations)
- Plug back in and allow again

### Phone shows "USB debugging connected" but React Native doesn't see it
- Restart ADB: The phone might need ADB server restart
- Try different USB cable
- Check USB mode is "File Transfer"

### Phone brand-specific issues
- **Samsung:** May need Samsung USB drivers
- **Xiaomi:** May need Mi USB drivers
- **OnePlus:** Usually works with standard drivers
- **Google Pixel:** Usually works with standard drivers

## Alternative: Install APK Manually

If React Native keeps launching emulator, you can:

1. **Build APK:**
   ```bash
   cd GuardTrackingApp/android
   ./gradlew assembleDebug
   ```

2. **Find APK:**
   - Location: `GuardTrackingApp/android/app/build/outputs/apk/debug/app-debug.apk`

3. **Transfer to phone:**
   - Copy APK to phone
   - Install manually on phone
   - Enable "Install from unknown sources" if needed

4. **Run Metro bundler:**
   ```bash
   cd GuardTrackingApp
   npx react-native start
   ```

5. **Open app on phone** and it will connect to Metro

---

**Most likely issue: Phone not authorized or USB mode wrong. Check phone screen for "Allow USB debugging?" prompt!**

