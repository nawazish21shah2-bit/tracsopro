# Development Testing Guide - Guard Tracking App

This guide explains how to test live user location tracking and other app flows in development mode.

## 📋 Prerequisites

1. **Backend server running** on port 3000
2. **React Native development environment** set up
3. **Physical device or emulator** with location services enabled
4. **Network connectivity** between device and development machine

---

## 🚀 Quick Start

### Step 1: Start Backend Server

```bash
cd backend

# Option A: In-memory server (fast, no database)
npm run dev

# Option B: Database server (persistent data)
npm run dev:db
```

The server should start on `http://localhost:3000`

**Verify it's running:**
- Open browser: `http://localhost:3000/api/health`
- Should return: `{ "status": "ok" }`

### Step 2: Configure Network Connection

The app needs to connect to your development machine. Update the IP address in:

**File:** `GuardTrackingApp/src/services/api.ts` (Line 31)

```typescript
// Replace with your actual local IP address
const LOCAL_IP = '192.168.1.12'; // Change this to your machine's IP
```

**How to find your IP:**
- **Windows:** Run `ipconfig` in PowerShell, look for "IPv4 Address"
- **Mac/Linux:** Run `ifconfig` or `ip addr`, look for your local network IP

**Important Notes:**
- For Android emulator: Use `10.0.2.2` instead of local IP
- For physical devices: Use your computer's local IP (e.g., `192.168.1.12`)
- Both device and computer must be on the same Wi-Fi network

### Step 3: Start React Native App

```bash
cd GuardTrackingApp

# For Android
npm run android

# For iOS (Mac only)
npm run ios
```

---

## 📍 Testing Location Tracking

### 1. Enable Location Permissions

When you first open the app:
- **Android:** Grant "Allow all the time" location permission
- **iOS:** Grant "While Using App" or "Always" location permission

### 2. Login as Guard

Use test account credentials:
- **Email:** `guard1@example.com`
- **Password:** `Passw0rd!`

Or create a new guard account through registration.

### 3. Start a Shift

1. Navigate to **Shifts** screen
2. Create or accept a shift
3. Tap **"Start Shift"** button
4. Location tracking should automatically start

### 4. Verify Location Tracking

**Check Console Logs:**
```bash
# In your terminal where React Native is running
# Look for logs like:
📍 Real-time location tracking started
📍 Location updated: 40.7589, -73.9851 (±10m)
```

**Check Backend Logs:**
```bash
# In backend terminal
# Look for location update requests:
POST /api/tracking/location
```

**Check WebSocket Connection:**
- Location updates are sent via WebSocket for real-time tracking
- Check backend logs for WebSocket connection messages

### 5. Test Location Features

#### A. Real-time Tracking
- Walk around with your device
- Check backend logs for location updates every 10-30 seconds
- Verify coordinates change as you move

#### B. Geofencing
- Add a geofence zone in the app
- Walk into/out of the zone
- Check for geofence entry/exit notifications

#### C. Background Tracking
- Put app in background
- Move around
- Check that location updates continue (may require additional setup)

---

## 🔄 Testing Other App Flows

### Authentication Flow

1. **Registration:**
   - Navigate to Register screen
   - Fill in details
   - Submit → Should receive OTP email
   - Enter OTP → Should login automatically

2. **Login:**
   - Use test credentials
   - Should navigate to main app

3. **Token Refresh:**
   - Wait 30 minutes (token expiry)
   - Make any API call
   - Should auto-refresh token

### Shift Management Flow

1. **Create Shift (Admin):**
   - Login as admin
   - Navigate to Shifts → Create
   - Fill shift details
   - Assign to guard
   - Submit

2. **Accept Shift (Guard):**
   - Login as guard
   - View available shifts
   - Accept shift
   - Start shift → Location tracking begins

3. **End Shift:**
   - Complete shift activities
   - Tap "End Shift"
   - Submit shift report
   - Location tracking stops

### Incident Reporting Flow

1. Navigate to **Incidents** screen
2. Tap **"Report Incident"**
3. Fill incident details:
   - Type, description, severity
   - Attach photos (if available)
   - Location (auto-captured)
4. Submit → Should appear in incidents list

### Messaging Flow

1. Navigate to **Messages** screen
2. Select a conversation or create new
3. Send message
4. Check WebSocket connection for real-time delivery

---

## 🛠️ Development Mode Features

### Debug Logging

The app includes extensive logging in development mode:

**Location Tracking Logs:**
```
📍 Location tracking started
📍 Location updated: lat, lng (±accuracy)
📍 Geofence triggered: zone name
```

**API Logs:**
```
🔑 Token found for GET /api/guards
API Request: GET /api/guards
API Response: 200 /api/guards
```

**WebSocket Logs:**
```
🔌 WebSocket connected
📡 Location update sent via WebSocket
```

### Network Debugging

**Check API Connection:**
1. Open React Native Debugger
2. Check Network tab
3. Verify requests to `http://YOUR_IP:3000/api`

**Test API Manually:**
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/guards
```

---

## 🐛 Troubleshooting

### Location Not Updating

**Problem:** Location tracking not working

**Solutions:**
1. **Check Permissions:**
   - Go to device Settings → Apps → Your App → Permissions
   - Ensure Location is enabled with "Allow all the time"

2. **Check GPS:**
   - Ensure GPS is enabled on device
   - Try opening Google Maps to verify GPS works

3. **Check Network:**
   - Verify device can reach backend server
   - Test: `curl http://YOUR_IP:3000/api/health` from device browser

4. **Check Logs:**
   - Look for permission errors in console
   - Check backend logs for location update requests

### Backend Connection Issues

**Problem:** App can't connect to backend

**Solutions:**
1. **Verify Backend Running:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Check IP Address:**
   - Ensure `LOCAL_IP` in `api.ts` matches your computer's IP
   - Use `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

3. **Check Firewall:**
   - Windows: Allow Node.js through firewall
   - Mac: Check System Preferences → Security

4. **Test from Device:**
   - Open browser on device
   - Navigate to `http://YOUR_IP:3000/api/health`
   - Should return JSON response

### WebSocket Connection Issues

**Problem:** Real-time features not working

**Solutions:**
1. **Check WebSocket URL:**
   - Should be `ws://YOUR_IP:3000` (not `http://`)
   - Check `WebSocketService.ts` configuration

2. **Check Backend WebSocket:**
   - Backend should log WebSocket connection attempts
   - Verify Socket.IO is enabled in backend

3. **Check Network:**
   - WebSocket requires same network as HTTP API
   - Some networks block WebSocket connections

### Location Accuracy Issues

**Problem:** Location not accurate enough

**Solutions:**
1. **Enable High Accuracy:**
   - Already enabled in code (`enableHighAccuracy: true`)
   - Ensure device GPS is set to "High accuracy" mode

2. **Check Device Settings:**
   - Android: Settings → Location → Mode → High accuracy
   - iOS: Settings → Privacy → Location Services → System Services

3. **Test Outdoors:**
   - GPS works better outdoors
   - Indoor testing may have poor accuracy

---

## 📱 Testing on Physical Device vs Emulator

### Physical Device (Recommended for Location)

**Advantages:**
- Real GPS location
- Better performance
- Real-world testing

**Setup:**
1. Connect device via USB
2. Enable USB debugging (Android) or Developer mode (iOS)
3. Run: `npm run android` or `npm run ios`
4. Use your computer's local IP in `api.ts`

### Android Emulator

**Advantages:**
- Faster iteration
- Easy to reset

**Limitations:**
- Mock location only (use Extended Controls → Location)
- May have network issues

**Setup:**
1. Use `10.0.2.2` instead of local IP for Android emulator
2. Or use your local IP if emulator supports it
3. Set mock location: Extended Controls → Location

### iOS Simulator

**Advantages:**
- Fast development
- Easy debugging

**Limitations:**
- Mock location only
- No real GPS

**Setup:**
1. Use your local IP in `api.ts`
2. Set mock location: Features → Location → Custom Location

---

## 🔍 Monitoring & Debugging Tools

### React Native Debugger

1. Open React Native Debugger
2. Enable Network Inspector
3. Monitor API requests and responses
4. Check WebSocket messages

### Backend Logs

Monitor backend terminal for:
- API requests
- WebSocket connections
- Location updates
- Errors

### Device Logs

**Android:**
```bash
adb logcat | grep -i "location\|tracking\|geolocation"
```

**iOS:**
- Use Xcode Console
- Or: `xcrun simctl spawn booted log stream --level=debug`

### Network Monitoring

**Check API Calls:**
```bash
# Monitor backend logs
cd backend
npm run dev
# Watch for location update requests
```

**Test API Endpoints:**
```bash
# Get tracking history
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/tracking/GUARD_ID

# Get live locations
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/tracking/active/locations
```

---

## ✅ Testing Checklist

### Location Tracking
- [ ] Location permission granted
- [ ] GPS enabled on device
- [ ] Backend server running
- [ ] Network connection working
- [ ] Location updates appearing in logs
- [ ] Location data sent to backend
- [ ] WebSocket connection active
- [ ] Geofencing working (if tested)

### Authentication
- [ ] Registration flow works
- [ ] OTP verification works
- [ ] Login works
- [ ] Token refresh works
- [ ] Logout works

### Shift Management
- [ ] Create shift works
- [ ] Accept shift works
- [ ] Start shift triggers location tracking
- [ ] End shift stops location tracking
- [ ] Shift reports can be submitted

### Other Features
- [ ] Incident reporting works
- [ ] Messaging works
- [ ] Notifications work
- [ ] Offline mode works (if implemented)

---

## 🎯 Quick Test Scenarios

### Scenario 1: Basic Location Tracking
1. Login as guard
2. Start a shift
3. Walk around for 5 minutes
4. Check backend logs for location updates
5. End shift
6. Verify location history saved

### Scenario 2: Geofencing
1. Create a geofence zone at your current location (50m radius)
2. Walk outside the zone
3. Walk back inside
4. Check for entry/exit notifications

### Scenario 3: Background Tracking
1. Start shift
2. Put app in background
3. Walk around
4. Check that location still updates (may require additional permissions)

### Scenario 4: Network Interruption
1. Start shift
2. Turn off Wi-Fi/data
3. Walk around
4. Turn network back on
5. Verify locations sync to backend

---

## 📚 Additional Resources

- **Backend API Docs:** Check `backend/README.md` for API endpoints
- **App Architecture:** Check `IMPLEMENTATION_GUIDE.md`
- **Setup Guide:** Check `backend/SETUP_GUIDE.md`

---

## 💡 Tips for Effective Testing

1. **Use Real Devices:** Location tracking works best on physical devices
2. **Test Outdoors:** GPS accuracy is better outdoors
3. **Monitor Logs:** Keep backend and React Native logs visible
4. **Test Network Issues:** Disable/enable network to test offline handling
5. **Test Battery Impact:** Monitor battery usage during long tracking sessions
6. **Test Multiple Guards:** Use multiple test accounts to test multi-user scenarios

---

## 🆘 Need Help?

If you encounter issues:
1. Check this troubleshooting section
2. Review backend and app logs
3. Verify network connectivity
4. Check device permissions
5. Ensure backend is running and accessible

For more help, check the main project documentation or create an issue.

