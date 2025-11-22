# Physical Device Testing Setup Guide

## 🎯 Quick Setup for Physical Device Testing

Testing on physical devices is **recommended** for live tracking because:
- ✅ Real GPS location (not simulated)
- ✅ Better location accuracy
- ✅ Real-world network conditions
- ✅ Actual battery usage testing

## 📋 Prerequisites

1. **Backend Server** running on your development machine
2. **Physical devices** (at least 2: one for Guard, one for Admin)
3. **Same WiFi network** for all devices
4. **USB connection** for initial app installation

## 🔧 Step-by-Step Setup

### Step 1: Find Your Local IP Address

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your WiFi adapter
# Example: 192.168.1.100
```

**Mac/Linux:**
```bash
ifconfig
# Look for "inet" under en0 or wlan0
# Example: 192.168.1.100
```

**Note:** Your IP address might change when you reconnect to WiFi. Check it each time.

### Step 2: Update Backend to Accept Network Connections

Ensure your backend server listens on all network interfaces, not just localhost.

**Check your server file** (`backend/src/server.ts` or similar):
```typescript
// ✅ Good - listens on all interfaces
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// ❌ Bad - only localhost
server.listen(PORT, 'localhost', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 3: Update App Configuration

You need to update the API base URL in your React Native app to use your local IP instead of localhost.

#### Option A: Update API Service

**File:** `GuardTrackingApp/src/services/api.ts`

Find the base URL configuration and update it:

```typescript
// Replace this:
const baseURL = __DEV__
  ? (Platform.OS === 'android'
      ? 'http://10.0.2.2:3000'  // Android emulator
      : 'http://localhost:3000')  // iOS simulator
  : 'https://your-production-api.com';

// With this (replace 192.168.1.100 with YOUR local IP):
const baseURL = __DEV__
  ? 'http://192.168.1.100:3000'  // Your local IP
  : 'https://your-production-api.com';
```

#### Option B: Update WebSocket Service

**File:** `GuardTrackingApp/src/services/WebSocketService.ts`

Find the WebSocket connection URL:

```typescript
// Replace this:
const baseURL = __DEV__
  ? (Platform.OS === 'android'
      ? 'http://10.0.2.2:3000'
      : 'http://localhost:3000')
  : 'https://your-production-api.com';

// With this:
const baseURL = __DEV__
  ? 'http://192.168.1.100:3000'  // Your local IP
  : 'https://your-production-api.com';
```

#### Option C: Use Environment Variables (Recommended)

Create a config file for easier management:

**File:** `GuardTrackingApp/src/config/api.ts`
```typescript
import { Platform } from 'react-native';

// Replace with your local IP address
const LOCAL_IP = '192.168.1.100';  // Change this!
const PORT = 3000;

export const API_BASE_URL = __DEV__
  ? `http://${LOCAL_IP}:${PORT}`
  : 'https://your-production-api.com';

export const WS_BASE_URL = __DEV__
  ? `http://${LOCAL_IP}:${PORT}`
  : 'https://your-production-api.com';
```

Then import in your services:
```typescript
import { API_BASE_URL, WS_BASE_URL } from '../config/api';
```

### Step 4: Configure Firewall (If Needed)

**Windows:**
1. Open Windows Defender Firewall
2. Allow Node.js through firewall
3. Or temporarily disable firewall for testing

**Mac:**
1. System Preferences > Security & Privacy > Firewall
2. Allow Node.js connections

**Linux:**
```bash
# Allow port 3000
sudo ufw allow 3000
```

### Step 5: Install App on Physical Device

#### Android Physical Device

1. **Enable Developer Options:**
   - Settings > About Phone
   - Tap "Build Number" 7 times

2. **Enable USB Debugging:**
   - Settings > Developer Options
   - Enable "USB Debugging"

3. **Connect Device:**
   ```bash
   # Connect device via USB
   # Verify connection
   adb devices
   # Should show your device
   ```

4. **Run App:**
   ```bash
   cd GuardTrackingApp
   npx react-native run-android
   ```

#### iOS Physical Device

1. **Trust Computer:**
   - Connect iPhone via USB
   - Tap "Trust" on iPhone when prompted

2. **Configure Signing:**
   - Open Xcode
   - Select your project
   - Go to "Signing & Capabilities"
   - Select your development team

3. **Run App:**
   ```bash
   cd GuardTrackingApp
   npx react-native run-ios --device
   ```

### Step 6: Test Connection

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   # Should show: "Server running on port 3000"
   ```

2. **On Physical Device:**
   - Open the app
   - Try to login
   - Check if connection works

3. **Verify:**
   - Check backend logs for incoming requests
   - Check app console for connection errors
   - Test API endpoint: `http://YOUR_IP:3000/api/health` (if you have one)

## 🧪 Testing Workflow

### Device 1: Guard App

1. **Install App:**
   ```bash
   npx react-native run-android --device
   # or
   npx react-native run-ios --device
   ```

2. **Login:**
   - Email: `guard1@test.com`
   - Password: `12345678`

3. **Grant Permissions:**
   - Allow location access
   - Choose "Always" for background tracking

4. **Start Shift:**
   - Navigate to Shifts
   - Start an active shift
   - Location tracking should start automatically

5. **Walk Around:**
   - Move to different locations
   - Watch console for location updates

### Device 2: Admin App

1. **Install App** (same app, different login)

2. **Login:**
   - Email: `admin@test.com`
   - Password: `12345678`

3. **View Tracking:**
   - Navigate to Operations Center
   - Open Map View
   - Should see guard's location updating

## 🔍 Troubleshooting

### "Network request failed" or "Connection refused"

**Problem:** App can't connect to backend

**Solutions:**
1. ✅ Verify backend is running
2. ✅ Check IP address is correct
3. ✅ Ensure devices on same WiFi
4. ✅ Check firewall settings
5. ✅ Try accessing `http://YOUR_IP:3000` in device browser

### "WebSocket connection failed"

**Problem:** WebSocket can't connect

**Solutions:**
1. ✅ Verify WebSocket URL uses your local IP
2. ✅ Check backend WebSocket is initialized
3. ✅ Ensure port 3000 is accessible
4. ✅ Check backend logs for connection attempts

### Location not updating

**Problem:** GPS not working

**Solutions:**
1. ✅ Grant location permissions
2. ✅ Enable GPS on device
3. ✅ Go outside for better GPS signal
4. ✅ Check location services in device settings

### Backend not accessible

**Problem:** Can't reach backend from device

**Solutions:**
1. ✅ Verify backend listens on `0.0.0.0` not `localhost`
2. ✅ Check firewall allows port 3000
3. ✅ Ensure same WiFi network
4. ✅ Try ping from device: `ping YOUR_IP`

## 🎯 Alternative: Using ngrok (For External Testing)

If you need to test from different networks:

1. **Install ngrok:**
   ```bash
   # Download from https://ngrok.com/
   # Or via npm
   npm install -g ngrok
   ```

2. **Start ngrok:**
   ```bash
   ngrok http 3000
   # Will give you a URL like: https://abc123.ngrok.io
   ```

3. **Update App:**
   ```typescript
   const baseURL = __DEV__
     ? 'https://abc123.ngrok.io'  // Your ngrok URL
     : 'https://your-production-api.com';
   ```

**Note:** ngrok free tier has limitations. Use only for testing.

## ✅ Verification Checklist

- [ ] Backend running and accessible
- [ ] Local IP address found
- [ ] API base URL updated in app
- [ ] WebSocket URL updated in app
- [ ] Firewall configured (if needed)
- [ ] Physical device connected
- [ ] App installed on device
- [ ] Login successful
- [ ] Location permissions granted
- [ ] Location tracking working
- [ ] Real-time updates visible

## 📝 Quick Reference

**Test Accounts:**
- Guard: `guard1@test.com` / `12345678`
- Admin: `admin@test.com` / `12345678`

**Common IP Ranges:**
- Home WiFi: `192.168.1.x` or `192.168.0.x`
- Office WiFi: `10.0.0.x` or `172.16.0.x`

**Ports:**
- Backend API: `3000`
- WebSocket: `3000` (same port)

---

**Pro Tip:** Save your local IP in a config file so you can easily update it when it changes!

