# Android Phone Connection Troubleshooting Guide

## Quick Fix Steps

### Step 1: Check USB Connection
1. **Unplug and replug** your USB cable
2. Try a **different USB port** (preferably USB 2.0, not USB 3.0)
3. Try a **different USB cable** (some cables are charge-only)

### Step 2: Enable USB Debugging on Phone
1. **Enable Developer Options:**
   - Go to **Settings → About Phone**
   - Find **"Build Number"**
   - **Tap it 7 times** until you see "You are now a developer!"

2. **Enable USB Debugging:**
   - Go to **Settings → Developer Options**
   - Turn on **"USB Debugging"**
   - Turn on **"Stay Awake"** (optional, helps during development)

3. **Connect and Authorize:**
   - Connect your phone via USB
   - You should see a popup: **"Allow USB debugging?"**
   - Tap **"Allow"**
   - **Check the box**: "Always allow from this computer"
   - Tap **"OK"**

### Step 3: Fix USB Drivers (Windows)

#### Option A: Use Google USB Driver
1. Open **Device Manager** (Win+X → Device Manager)
2. Look for your phone under:
   - **"Android Phone"** or
   - **"Other devices"** → "Unknown device" or device with yellow warning
3. **Right-click** → **Update driver**
4. Choose **"Browse my computer for drivers"**
5. Navigate to: `C:\Users\%USERNAME%\AppData\Local\Android\Sdk\extras\google\usb_driver`
6. Click **Next** and install

#### Option B: Install Manufacturer Drivers
- **Samsung**: Install [Samsung USB Driver](https://developer.samsung.com/mobile/android-usb-driver.html)
- **OnePlus/Oppo**: Install [OnePlus USB Driver](https://www.oneplus.com/support/software)
- **Xiaomi**: Install [Mi USB Driver](https://www.xiaomi.com/support/download/driver)
- **Huawei**: Install [HiSuite](https://consumer.huawei.com/en/support/hisuite/)
- **Google Pixel**: Usually works with Google USB Driver

#### Option C: Universal ADB Driver
Download and install [Universal ADB Driver](https://adb.clockworkmod.com/)

### Step 4: Verify Connection

Run this command to check:
```powershell
cd GuardTrackingApp
.\run-on-phone.ps1
```

Or manually check:
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\platform-tools\adb.exe" devices
```

You should see your device listed like:
```
List of devices attached
ABC123XYZ    device
```

### Step 5: Change USB Connection Mode (if needed)

On your phone, when connected:
1. Pull down the notification shade
2. Tap the **USB notification**
3. Select **"File Transfer"** or **"MTP"** mode
4. Some phones: Settings → Developer Options → **"Select USB Configuration"** → Choose **"MTP"**

## Common Issues

### Issue: "unauthorized" in adb devices
**Solution:** 
- Unplug and replug USB
- On phone, tap "Allow" when USB debugging prompt appears
- Check "Always allow from this computer"

### Issue: Device shows as "offline"
**Solution:**
- Restart ADB: `adb kill-server && adb start-server`
- Unplug and replug USB
- Restart phone

### Issue: No popup appears on phone
**Solution:**
- Revoke USB debugging authorizations:
  - Settings → Developer Options → **"Revoke USB debugging authorizations"**
- Unplug and replug USB
- The prompt should appear again

### Issue: Device Manager shows "Unknown Device"
**Solution:**
- Install proper USB drivers (see Step 3 above)
- Try different USB port/cable
- Restart computer after installing drivers

## Alternative: Wireless Debugging (Android 11+)

If USB continues to be problematic:

1. **On Phone:**
   - Settings → Developer Options
   - Enable **"Wireless debugging"**
   - Note the **IP address and port** shown

2. **On Computer:**
   ```powershell
   adb connect <IP_ADDRESS>:<PORT>
   ```

3. **Verify:**
   ```powershell
   adb devices
   ```

## Still Not Working?

1. **Restart everything:**
   - Restart phone
   - Restart computer
   - Try again

2. **Check phone manufacturer website** for specific USB driver requirements

3. **Try on different computer** to isolate if it's a driver issue

4. **Check phone compatibility:**
   - Some older phones may have issues
   - Ensure Android version is 5.0+ (API 21+)

## Success Indicators

✅ Device appears in `adb devices` as "device" (not "unauthorized" or "offline")
✅ No yellow warning in Device Manager
✅ USB debugging prompt appears and is accepted
✅ Script successfully detects and installs app

