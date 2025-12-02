# Fix: App Installing on Emulator Instead of Phone

## Current Issue
The app is installing on `Pixel_9_Edited(AVD) - 16` (emulator) instead of your physical phone.

## Solution: Close Emulator First

### Step 1: Close the Emulator
1. **Close the Android Emulator window** completely
2. Or stop it from Android Studio:
   - Open Android Studio
   - Go to: Tools > Device Manager
   - Click the stop button (⏹️) next to the running emulator

### Step 2: Verify Phone is Connected
1. **Check phone screen** for "Allow USB debugging?" prompt
2. **Tap "Allow"** or "Always allow from this computer"
3. **Check phone notification** - should show "USB debugging connected"

### Step 3: Run Again
```bash
cd GuardTrackingApp
npx react-native run-android
```

Now it should install on your phone!

## Alternative: Keep Emulator Open

If you want to keep emulator open and install on phone:

1. **Get your phone's device ID:**
   - React Native will show available devices when you run the command
   - Or check the output - it will list devices

2. **Specify phone device:**
   ```bash
   npx react-native run-android --device=<your-phone-device-id>
   ```

## Quick Check: Is Phone Detected?

The phone might not be detected. Check:

1. **USB Connection:**
   - Try different USB cable
   - Try different USB port
   - Make sure cable supports data (not just charging)

2. **USB Mode:**
   - Pull down notification panel on phone
   - Tap "USB" or "Charging"
   - Select "File Transfer" or "MTP"

3. **Developer Options:**
   - Settings > Developer Options > USB Debugging (ON)
   - Settings > Developer Options > Install via USB (ON) - if available

## Expected Output

When phone is detected, you should see:
```
Installing APK 'app-debug.apk' on '<Your Phone Model>' for :app:debug
Installed on 1 device.
info Starting the app on "<phone-device-id>"...
```

Instead of:
```
Installing APK 'app-debug.apk' on 'Pixel_9_Edited(AVD) - 16' for :app:debug
```

---

**Try closing the emulator first - that's the easiest solution!**

