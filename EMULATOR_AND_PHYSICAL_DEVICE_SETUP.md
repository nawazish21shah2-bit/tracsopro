`# Running App on Emulator + Physical Device Simultaneously

## ✅ Yes, You Can Do This!

You can run the app on **both an emulator and a physical device** at the same time. This is perfect for testing:
- **Emulator:** Guard app (one account)
- **Physical Device:** Admin/Client app (different account)

Or vice versa!

## 🎯 Setup

### Configuration

The app is already configured to work with both:
- **Local IP:** `192.168.1.12:3000` 
- Works for:
  - ✅ Android Emulator
  - ✅ Android Physical Device
  - ✅ iOS Simulator
  - ✅ iOS Physical Device

### Why This Works

- **Emulator/Simulator:** Can access your local network via your computer's IP
- **Physical Device:** Can access your local network directly
- **Backend:** Listens on `0.0.0.0` (all interfaces), accessible from both

## 🚀 How to Run Both

### Step 1: Start Backend

```bash
cd backend
npm run dev:db
```

**Important:** Backend must be running and accessible on `192.168.1.12:3000`

### Step 2: Run on Emulator (Device 1)

**Android Emulator:**
```bash
cd GuardTrackingApp

# Start emulator first (if not running)
# Then run:
npx react-native run-android
```

**iOS Simulator:**
```bash
cd GuardTrackingApp
npx react-native run-ios
```

**Login as Guard:**
- Email: `guard1@test.com` (or your guard account)
- Password: `12345678`

### Step 3: Run on Physical Device (Device 2)

**Android Physical Device:**
```bash
# Connect device via USB
adb devices  # Verify device is listed

# Run on specific device
npx react-native run-android --deviceId=<device-id>
# Or just:
npx react-native run-android
# React Native will detect both and ask which one
```

**iOS Physical Device:**
```bash
# Connect device via USB
npx react-native run-ios --device
# Or specify device:
npx react-native run-ios --device "iPhone Name"
```

**Login as Admin:**
- Email: `admin@test.com` (or your admin account)
- Password: `12345678`

## 📱 Running Multiple Instances

### Option 1: Different Devices (Recommended)

**Setup:**
- Emulator: Guard app
- Physical Device: Admin app

**Commands:**
```bash
# Terminal 1 - Start backend
cd backend
npm run dev:db

# Terminal 2 - Run on emulator (Guard)
cd GuardTrackingApp
npx react-native run-android

# Terminal 3 - Run on physical device (Admin)
cd GuardTrackingApp
npx react-native run-android --deviceId=<your-device-id>
```

### Option 2: Multiple Emulators

You can also run multiple emulators:

```bash
# List available devices
adb devices

# Start first emulator
emulator -avd <emulator1-name> &

# Start second emulator
emulator -avd <emulator2-name> &

# Run on first emulator
npx react-native run-android --deviceId=<emulator1-id>

# Run on second emulator (in new terminal)
npx react-native run-android --deviceId=<emulator2-id>
```

## 🔍 Verify Both Are Connected

### Check Backend Logs

You should see:
```
Client connected: <socketId1>  // Emulator
Client connected: <socketId2>   // Physical device
Guard <guardId> connected       // From emulator
Admin/Client <adminId> connected // From physical device
```

### Check Each Device

**Emulator (Guard):**
- Console shows: "📍 Real-time location tracking started"
- Location updates being sent

**Physical Device (Admin):**
- Map shows guard marker
- Real-time updates visible
- "LIVE" indicator green

## 🎯 Testing Scenarios

### Scenario 1: Guard on Emulator, Admin on Phone
- **Emulator:** Guard account, start shift, location tracking
- **Phone:** Admin account, view map, see guard location

### Scenario 2: Guard on Phone, Admin on Emulator
- **Phone:** Guard account, real GPS tracking
- **Emulator:** Admin account, view tracking

### Scenario 3: Both on Emulators
- **Emulator 1:** Guard account
- **Emulator 2:** Admin account

## ⚙️ Device Selection

### Android - Select Specific Device

```bash
# List all devices
adb devices

# Output:
# List of devices attached
# emulator-5554    device    (Emulator)
# R58M1234567      device    (Physical device)

# Run on emulator
npx react-native run-android --deviceId=emulator-5554

# Run on physical device
npx react-native run-android --deviceId=R58M1234567
```

### iOS - Select Specific Device

```bash
# List all devices
xcrun simctl list devices

# Run on specific simulator
npx react-native run-ios --simulator="iPhone 15"

# Run on physical device
npx react-native run-ios --device "Your iPhone Name"
```

## 🐛 Troubleshooting

### "Multiple devices connected"

**Solution:**
```bash
# Specify device ID explicitly
npx react-native run-android --deviceId=<specific-device-id>
```

### Emulator can't connect to backend

**Check:**
1. ✅ Backend running on `0.0.0.0:3000`
2. ✅ IP address is correct (`192.168.1.12`)
3. ✅ Firewall allows connections
4. ✅ Try accessing `http://192.168.1.12:3000/api/health` in emulator browser

### Physical device can't connect

**Check:**
1. ✅ Same WiFi network
2. ✅ IP address correct
3. ✅ Backend accessible from network
4. ✅ Try `http://192.168.1.12:3000/api/health` in phone browser

### Both devices show same account

**Solution:**
- Logout from one device
- Login with different account
- Each device should have different user logged in

## 💡 Pro Tips

1. **Use Different Accounts:**
   - Emulator: Guard account
   - Physical Device: Admin account
   - This simulates real-world scenario

2. **Monitor Both Consoles:**
   - Keep both Metro bundlers running
   - Watch logs from both devices

3. **Test Real GPS:**
   - Use physical device for Guard (real GPS)
   - Use emulator for Admin (just viewing)

4. **Network Testing:**
   - Test with both on same WiFi
   - Test with different networks (if backend accessible)

## ✅ Quick Checklist

- [ ] Backend running on `0.0.0.0:3000`
- [ ] IP address configured: `192.168.1.12`
- [ ] Emulator running
- [ ] Physical device connected
- [ ] App installed on both
- [ ] Different accounts logged in
- [ ] Both can connect to backend
- [ ] WebSocket connections established
- [ ] Location tracking working
- [ ] Real-time updates visible

## 🎯 Example Workflow

```bash
# Terminal 1: Backend
cd backend
npm run dev:db

# Terminal 2: Emulator (Guard)
cd GuardTrackingApp
npx react-native run-android
# Login as: guard1@test.com / 12345678
# Start shift

# Terminal 3: Physical Device (Admin)
cd GuardTrackingApp
npx react-native run-android --deviceId=<your-device-id>
# Login as: admin@test.com / 12345678
# View map
```

---

**You're all set!** You can now test live tracking with one device as Guard and another as Admin, whether they're emulators, physical devices, or a mix of both! 🚀

