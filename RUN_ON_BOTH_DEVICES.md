# Running App on Phone AND Emulator Simultaneously

## ✅ Yes! You Can Run on Both at the Same Time

This is perfect for testing live tracking:
- **Emulator:** Guard app (one account)
- **Phone:** Admin app (different account)

Or vice versa!

## 🚀 How to Do It

### Step 1: Start Backend
```bash
cd backend
npm run dev:db
```

### Step 2: Run on Emulator (Terminal 1)
```bash
cd GuardTrackingApp
npx react-native run-android --device=emulator-5554
# Or just:
npx react-native run-android
# (if emulator is the only device, it will use it)
```

**Login as Guard:**
- Email: `guard1@test.com`
- Password: `12345678`

### Step 3: Run on Phone (Terminal 2)
**First, make sure phone is connected and authorized:**
- Phone screen should show "USB debugging connected"
- USB mode set to "File Transfer"

**Then run:**
```bash
cd GuardTrackingApp
npx react-native run-android --device=<your-phone-device-id>
```

**Or if phone is the only device connected:**
```bash
npx react-native run-android
```

**Login as Admin:**
- Email: `admin@test.com`
- Password: `12345678`

## 📱 Getting Device IDs

When you have both connected, React Native will show available devices. You can also check:

**If you have ADB:**
```bash
adb devices
# Shows:
# emulator-5554    device
# <your-phone-id> device
```

**Or React Native will show them when you run:**
```bash
npx react-native run-android
# If multiple devices, it may ask which one or show a list
```

## 🎯 Testing Workflow

### Setup:
1. **Backend running** (Terminal 1)
2. **Emulator running** with Guard app (Terminal 2)
3. **Phone connected** with Admin app (Terminal 3)

### Test:
- **Emulator (Guard):** Start shift, location tracking begins
- **Phone (Admin):** View map, see guard location updating in real-time

## ⚠️ Important Notes

### Both Devices Need:
- ✅ Same WiFi network (for backend connection)
- ✅ Backend accessible at `192.168.1.12:3000`
- ✅ Different user accounts logged in

### Metro Bundler:
- Only **one Metro bundler** needed (runs on port 8081)
- Both devices connect to the same Metro bundler
- React Native handles this automatically

### Device Selection:
- If both devices connected, React Native may:
  - Ask which device to use
  - Use the first one it finds
  - You can specify with `--device=<device-id>`

## 🔍 Verify Both Are Running

### Check Backend Logs:
Should see:
```
Client connected: <socketId1>  // From emulator
Client connected: <socketId2>   // From phone
Guard <guardId> connected       // From emulator
Admin <adminId> connected       // From phone
```

### Check Each Device:
- **Emulator:** App running, Guard logged in
- **Phone:** App running, Admin logged in
- **Both:** Can communicate with backend

## 💡 Pro Tips

1. **Use Different Accounts:**
   - Emulator: Guard account
   - Phone: Admin account
   - This simulates real-world scenario

2. **Monitor Both:**
   - Keep both Metro bundler outputs visible
   - Watch logs from both devices
   - Check backend logs for connections

3. **Test Real GPS:**
   - Use phone for Guard (real GPS tracking)
   - Use emulator for Admin (just viewing)

## 🐛 Troubleshooting

### "Multiple devices connected"
React Native will ask which one or use the first. Specify explicitly:
```bash
# Emulator
npx react-native run-android --device=emulator-5554

# Phone
npx react-native run-android --device=<your-phone-id>
```

### Both show same account
- Logout from one device
- Login with different account
- Each device maintains its own session

### One device can't connect to backend
- Check both on same WiFi
- Verify backend is accessible
- Check IP address is correct (`192.168.1.12`)

---

**Yes, you can absolutely run on both at the same time! Perfect for testing live tracking! 🚀**

