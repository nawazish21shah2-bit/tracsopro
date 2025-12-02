# Installing App on Physical Phone

## Issue: App installed on emulator instead of phone

When you have both emulator and phone connected, React Native might choose the emulator by default.

## Solution: Install on Phone Specifically

### Step 1: Check Connected Devices

React Native will show available devices. When you run:
```bash
npx react-native run-android
```

If multiple devices are connected, it will show a menu or use the first one.

### Step 2: Get Your Phone's Device ID

**Option A: Let React Native show you**
```bash
cd GuardTrackingApp
npx react-native run-android
# If multiple devices, it will show a list
```

**Option B: Check phone connection**
- Make sure phone is connected via USB
- Enable USB debugging
- Check phone screen for "Allow USB debugging?" - click Allow
- Make sure "Always allow from this computer" is checked

### Step 3: Install on Phone

**If only phone is connected:**
```bash
npx react-native run-android
# Will automatically use phone
```

**If both emulator and phone are connected:**
```bash
# Option 1: Disconnect emulator first, then run
npx react-native run-android

# Option 2: Specify phone device ID
npx react-native run-android --device=<your-phone-device-id>
```

## Quick Fix: Disconnect Emulator

1. **Close the emulator** (or stop it from Android Studio)
2. **Keep phone connected** via USB
3. **Run:**
   ```bash
   cd GuardTrackingApp
   npx react-native run-android
   ```
4. **It should now install on your phone**

## Verify Phone Connection

**Check on your phone:**
- Settings > Developer Options > USB Debugging (enabled)
- When connected, phone should show "USB debugging connected"
- Check phone screen for any authorization prompts

**Common issues:**
- Phone not authorized: Check phone screen for prompt
- USB debugging not enabled: Enable in Developer Options
- Wrong USB mode: Make sure it's set to "File Transfer" or "MTP"

## After Installation

Once installed on phone:
- App icon should appear on phone
- You can open it from app drawer
- Make sure phone and computer are on same WiFi for backend connection

