# Live Tracking Testing Guide

This guide will help you test the live tracking functionality with multiple test account devices.

## Prerequisites

1. **Backend Server Running**
   - Ensure your backend server is running on port 3000 (or configured port)
   - WebSocket service should be initialized
   - Database should be accessible
   - **Important for Physical Devices:** Make sure your backend is accessible from your local network (not just localhost)

2. **Test Devices**
   - **Physical Devices (Recommended):** At least 2 physical devices for testing
     - One device for Guard app
     - One device for Admin/Client app
   - **Network Setup:** All devices must be on the same WiFi network as your development machine
   - **Alternative:** Can use emulators, but physical devices are better for real GPS testing

3. **Test Accounts**
   - Guard account(s) with proper permissions
   - Admin/Client account to view tracking
   - **Password:** All test accounts use: `12345678`

## Step 1: Create Test Accounts

### Option A: Using Automated Script (Recommended)

```bash
# Navigate to backend directory
cd backend

# Run the test account creation script
node scripts/create-test-accounts.js
```

This script will create:
- 2 Guard accounts (guard1@test.com, guard2@test.com)
- 1 Admin account (admin@test.com)
- 1 Client account (client@test.com)
- A test company
- A test site location

**Default Password for all accounts:** `12345678`

### Option B: Manual Account Creation

You can also create accounts manually via API or Admin panel.

### Option B: Manual Account Creation

1. **Guard Account:**
   - Email: `guard1@test.com`
   - Password: `12345678`
   - Role: `GUARD`
   - Status: `ACTIVE`

2. **Admin Account:**
   - Email: `admin@test.com`
   - Password: `12345678`
   - Role: `ADMIN`
   - Status: `ACTIVE`

3. **Client Account (Optional):**
   - Email: `client@test.com`
   - Password: `12345678`
   - Role: `CLIENT`
   - Status: `ACTIVE`

## Step 2: Setup Test Devices

### Device 1: Guard App (Physical Device)

1. **Setup Backend for Physical Device Access**
   
   **Important:** Your backend must be accessible from your local network, not just localhost.
   
   **Option A: Find Your Local IP Address**
   ```bash
   # Windows
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   
   # Mac/Linux
   ifconfig
   # Look for inet address (e.g., 192.168.1.100)
   ```
   
   **Option B: Update Backend to Listen on All Interfaces**
   - Ensure your backend server listens on `0.0.0.0` not just `localhost`
   - Check your server configuration (usually in `server.ts` or `index.js`)
   
   **Option C: Use ngrok for External Access (Optional)**
   ```bash
   # Install ngrok: https://ngrok.com/
   ngrok http 3000
   # Use the provided URL (e.g., https://abc123.ngrok.io)
   ```

2. **Update App Configuration for Physical Device**
   
   Update your API base URL in the app to use your local IP:
   
   **File:** `GuardTrackingApp/src/services/api.ts` or config file
   ```typescript
   // For Android physical device
   const baseURL = __DEV__
     ? 'http://192.168.1.100:3000'  // Replace with your local IP
     : 'https://your-production-api.com';
   
   // For iOS physical device (same)
   const baseURL = __DEV__
     ? 'http://192.168.1.100:3000'  // Replace with your local IP
     : 'https://your-production-api.com';
   ```
   
   **Also update WebSocket URL:**
   ```typescript
   // In WebSocketService.ts
   const baseURL = __DEV__
     ? 'http://192.168.1.100:3000'  // Replace with your local IP
     : 'https://your-production-api.com';
   ```

3. **Install and Run Guard App on Physical Device**
   ```bash
   cd GuardTrackingApp
   npm install
   
   # For Android - Connect device via USB and enable USB debugging
   # Make sure device is connected:
   adb devices
   
   # Run on physical device
   npx react-native run-android
   
   # For iOS - Connect device via USB
   # Trust the computer on your iPhone
   npx react-native run-ios --device
   ```

4. **Login as Guard**
   - Use guard test account: `guard1@test.com` / `12345678`
   - Grant location permissions when prompted
   - Ensure GPS is enabled on device (Settings > Location)
   - **Important:** Allow "Always" location access for background tracking

5. **Start a Shift**
   - Navigate to Shifts screen
   - Start an active shift
   - Location tracking should start automatically
   - Walk around to see location updates

### Device 2: Admin/Client App (Physical Device)

1. **Install and Run Admin/Client App on Physical Device**
   ```bash
   # Same app, different login
   # Make sure API URL is configured (same as above)
   
   # For Android
   npx react-native run-android
   
   # For iOS
   npx react-native run-ios --device
   ```

2. **Login as Admin/Client**
   - Use admin test account: `admin@test.com` / `12345678`
   - Or client account: `client@test.com` / `12345678`
   - Navigate to Operations Center or Dashboard
   - Open the Live Tracking/Map view
   - You should see the guard's location updating in real-time

## Step 3: Testing Live Tracking

### Test Scenario 1: Basic Location Tracking

1. **On Guard Device:**
   - Ensure shift is active
   - Walk around (or use location simulation)
   - Check console logs for location updates:
     ```
     📍 Location updated: 40.7128, -74.0060 (±5m)
     ```

2. **On Admin/Client Device:**
   - Open map view
   - Should see guard marker moving in real-time
   - Check for "LIVE" indicator (green dot)

### Test Scenario 2: Multiple Guards

1. **Setup:**
   - Login with Guard 1 on Device 1
   - Login with Guard 2 on Device 2 (or emulator)
   - Both guards should have active shifts

2. **Verify:**
   - Admin dashboard should show both guards
   - Map should display multiple guard markers
   - Each guard should have different colors/status

### Test Scenario 3: WebSocket Connection

1. **Check WebSocket Status:**
   - Guard app: Check console for "WebSocket connected"
   - Admin app: Check console for "WebSocket connected"
   - Backend: Check logs for socket connections

2. **Test Disconnection:**
   - Turn off WiFi on guard device
   - Location updates should queue
   - Turn WiFi back on
   - Queued updates should sync

### Test Scenario 4: Location Accuracy

1. **Test Different Environments:**
   - Indoor (lower accuracy expected)
   - Outdoor (higher accuracy expected)
   - Moving vehicle (speed tracking)

2. **Verify:**
   - Check accuracy values in location data
   - Map should show accuracy radius circles

## Step 4: Verification Checklist

### Guard App Verification

- [ ] Location permission granted
- [ ] GPS enabled on device
- [ ] Shift is active
- [ ] Location tracking started (check console)
- [ ] WebSocket connected
- [ ] Location updates being sent (check console logs)
- [ ] No errors in console

### Admin/Client App Verification

- [ ] WebSocket connected
- [ ] Map view displays guards
- [ ] Guard markers visible on map
- [ ] Real-time updates working (markers move)
- [ ] "LIVE" indicator shows green
- [ ] Guard info panel shows correct data
- [ ] No errors in console

### Backend Verification

- [ ] WebSocket server running
- [ ] Socket connections logged
- [ ] Location updates received
- [ ] Database records created (check TrackingRecord table)
- [ ] Broadcasts sent to admins/clients
- [ ] No errors in logs

## Step 5: Debugging

### Common Issues

1. **Location Not Updating**
   - Check GPS permissions
   - Verify device GPS is enabled
   - Check if shift is active
   - Review console logs for errors

2. **WebSocket Not Connecting**
   - Verify backend server is running
   - Check network connectivity
   - Verify API base URL in app config
   - Check authentication token

3. **Guards Not Visible on Map**
   - Verify guards have active shifts
   - Check if guards are sending location updates
   - Verify WebSocket connection
   - Check map region/zoom level

4. **Location Updates Not Real-time**
   - Check WebSocket connection status
   - Verify location tracking interval settings
   - Check for network latency
   - Review backend broadcast frequency

### Debug Commands

```bash
# Check backend logs
cd backend
npm run dev
# Watch for WebSocket connections and location updates

# Check database
# Connect to your database and run:
SELECT * FROM "TrackingRecord" ORDER BY timestamp DESC LIMIT 10;

# Check WebSocket connections
# In backend logs, look for:
# "Client connected: <socketId>"
# "Guard <guardId> connected"
# "Location update broadcasted for guard: <guardId>"
```

## Step 6: Performance Testing

1. **Test with Multiple Guards:**
   - Create 5-10 guard accounts
   - All start shifts simultaneously
   - Monitor backend performance
   - Check map rendering performance

2. **Test Update Frequency:**
   - Verify updates every 30 seconds (default)
   - Test with different distance filters
   - Monitor battery usage

3. **Test Offline Behavior:**
   - Disconnect guard device from network
   - Continue moving
   - Reconnect network
   - Verify queued updates sync

## Step 7: Test Script

Create a simple test script to verify functionality:

```javascript
// test-live-tracking.js
// Run this in your backend to monitor tracking

const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_ADMIN_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');
  socket.emit('request_live_locations');
});

socket.on('live_locations_data', (data) => {
  console.log('📍 Live locations received:', data);
});

socket.on('guard_location_update', (data) => {
  console.log('🔄 Location update:', {
    guardId: data.guardId,
    lat: data.location.latitude,
    lng: data.location.longitude,
    timestamp: new Date(data.timestamp)
  });
});

socket.on('error', (error) => {
  console.error('❌ Error:', error);
});
```

## Expected Results

### Successful Test Results

1. **Guard Device:**
   - Console shows: "📍 Real-time location tracking started"
   - Console shows periodic: "📍 Location updated: ..."
   - Console shows: "Location update sent: ..."

2. **Admin Device:**
   - Map shows guard marker
   - Marker updates position every 30 seconds
   - Guard info shows current location
   - "LIVE" indicator is green

3. **Backend:**
   - Logs show: "Client connected: <socketId>"
   - Logs show: "Guard <guardId> connected"
   - Logs show: "Location update broadcasted for guard: <guardId>"
   - Database has new TrackingRecord entries

## Next Steps

After successful testing:

1. **Optimize Settings:**
   - Adjust update intervals based on needs
   - Configure distance filters
   - Set up geofencing zones

2. **Monitor Production:**
   - Set up logging and monitoring
   - Track performance metrics
   - Monitor battery usage

3. **Scale Testing:**
   - Test with more guards
   - Test under load
   - Test with poor network conditions

## Troubleshooting Contact

If you encounter issues:
1. Check console logs on all devices
2. Review backend logs
3. Verify database connectivity
4. Check network connectivity
5. Review WebSocket connection status

---

**Last Updated:** [Current Date]
**Version:** 1.0

