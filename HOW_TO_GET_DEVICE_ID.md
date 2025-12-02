# How to Get Device ID for React Native

## 🔍 Quick Method

### Step 1: List All Connected Devices

```bash
adb devices
```

### Step 2: Read the Output

You'll see something like:
```
List of devices attached
emulator-5554    device    (This is an emulator)
R58M1234567      device    (This is a physical device)
```

**The first column is the Device ID:**
- `emulator-5554` = Emulator device ID
- `R58M1234567` = Physical device ID

### Step 3: Use the Device ID

```bash
# Run on emulator
npx react-native run-android --deviceId=emulator-5554

# Run on physical device
npx react-native run-android --deviceId=R58M1234567
```

## 📱 Detailed Examples

### Example 1: Only Emulator Connected

```bash
$ adb devices
List of devices attached
emulator-5554    device
```

**Device ID:** `emulator-5554`

**Command:**
```bash
npx react-native run-android --deviceId=emulator-5554
```

### Example 2: Only Physical Device Connected

```bash
$ adb devices
List of devices attached
R58M1234567      device
```

**Device ID:** `R58M1234567`

**Command:**
```bash
npx react-native run-android --deviceId=R58M1234567
```

### Example 3: Both Emulator and Physical Device

```bash
$ adb devices
List of devices attached
emulator-5554    device
R58M1234567      device
```

**You have two options:**

**Option A: Run on Emulator**
```bash
npx react-native run-android --deviceId=emulator-5554
```

**Option B: Run on Physical Device**
```bash
npx react-native run-android --deviceId=R58M1234567
```

## 🎯 Step-by-Step Workflow

### 1. Connect Your Devices

**For Physical Device:**
- Connect via USB
- Enable USB Debugging (Settings > Developer Options)
- Trust computer if prompted

**For Emulator:**
- Start Android Studio
- Launch an emulator

### 2. Check Connection

```bash
adb devices
```

**Expected Output:**
```
List of devices attached
emulator-5554    device
R58M1234567      device
```

**If device shows "unauthorized":**
- Check phone for "Allow USB debugging?" prompt
- Click "Allow" or "Always allow"

**If device not listed:**
- Check USB connection
- Verify USB debugging is enabled
- Try different USB cable/port
- Restart adb: `adb kill-server && adb start-server`

### 3. Copy the Device ID

From the output, copy the device ID (first column):
- `emulator-5554` ← This is the ID
- `R58M1234567` ← This is the ID

### 4. Use Device ID in Command

```bash
npx react-native run-android --deviceId=<paste-device-id-here>
```

**Example:**
```bash
npx react-native run-android --deviceId=emulator-5554
```

## 🔧 Alternative: Let React Native Choose

If you don't specify `--deviceId`, React Native will:
- Use the only connected device (if one device)
- Ask you to choose (if multiple devices)

**Example:**
```bash
# If only one device connected
npx react-native run-android
# Automatically uses that device

# If multiple devices connected
npx react-native run-android
# Shows menu to select device
```

## 📋 Common Device ID Formats

### Android Emulators
- `emulator-5554`
- `emulator-5556`
- `emulator-5558`
- Pattern: `emulator-<port>`

### Physical Android Devices
- `R58M1234567` (Samsung)
- `HT7A1W123456` (HTC)
- `ZY223ABCDE` (Motorola)
- Pattern: Random alphanumeric string

## 🐛 Troubleshooting

### "device not found"

**Solution:**
```bash
# Restart adb
adb kill-server
adb start-server
adb devices
```

### "unauthorized" status

**Solution:**
1. Check phone screen
2. Look for "Allow USB debugging?" prompt
3. Click "Allow" or check "Always allow"
4. Run `adb devices` again

### Device ID keeps changing

**Physical devices:** Device ID usually stays the same
**Emulators:** Port number (last 4 digits) may change if you restart emulator

**Solution:** Run `adb devices` again to get current ID

### Multiple devices, want specific one

**Solution:** Always use `--deviceId` flag:
```bash
npx react-native run-android --deviceId=<specific-id>
```

## 💡 Pro Tips

1. **Save Device IDs:**
   - Keep a note of your device IDs
   - Physical device ID usually stays the same
   - Emulator ID changes with port

2. **Quick Check:**
   ```bash
   # Quick way to see just device IDs
   adb devices | grep -v "List" | grep "device" | awk '{print $1}'
   ```

3. **Verify Before Running:**
   ```bash
   # Always check devices before running
   adb devices
   # Then use the ID
   ```

4. **Use Aliases (Optional):**
   ```bash
   # Create shortcuts in your shell profile
   alias rn-emu='npx react-native run-android --deviceId=emulator-5554'
   alias rn-phone='npx react-native run-android --deviceId=R58M1234567'
   ```

## ✅ Quick Reference

```bash
# 1. List devices
adb devices

# 2. Copy device ID from output

# 3. Use in command
npx react-native run-android --deviceId=<device-id>

# Example:
npx react-native run-android --deviceId=emulator-5554
```

---

**That's it!** Just run `adb devices` and use the ID from the first column! 🚀

