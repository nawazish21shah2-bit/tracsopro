# Quick Live Tracking Test Reference

## 🚀 Quick Start (5 Minutes)

### 1. Create Test Accounts
```bash
cd backend
node scripts/create-test-accounts.js
```

### 2. Start Backend
```bash
cd backend
npm run dev
```

### 3. Run Guard App (Device 1)
```bash
cd GuardTrackingApp
npx react-native run-android  # or run-ios
```
- Login: `guard1@test.com` / `12345678`
- Start a shift
- Grant location permissions

### 4. Run Admin App (Device 2)
```bash
# Same app, different login
npx react-native run-android  # or run-ios
```
- Login: `admin@test.com` / `12345678`
- Open Operations Center or Map View

## ✅ Verification Checklist

### Guard Device
- [ ] Location permission granted
- [ ] GPS enabled
- [ ] Shift active
- [ ] Console shows: "📍 Real-time location tracking started"
- [ ] Console shows periodic location updates

### Admin Device
- [ ] WebSocket connected
- [ ] Map shows guard marker
- [ ] "LIVE" indicator is green
- [ ] Guard marker updates position

### Backend
- [ ] Server running on port 3000
- [ ] WebSocket connections logged
- [ ] Location updates received
- [ ] Database records created

## 🔍 Quick Debug

### Location Not Updating?
1. Check GPS permissions
2. Verify shift is active
3. Check console logs
4. Verify WebSocket connection

### Guards Not Visible?
1. Verify guards have active shifts
2. Check WebSocket connection
3. Verify map region/zoom
4. Check backend logs

### WebSocket Issues?
1. Verify backend is running
2. Check network connectivity
3. Verify API base URL in app config
4. Check authentication token

## 📱 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Guard 1 | guard1@test.com | 12345678 |
| Guard 2 | guard2@test.com | 12345678 |
| Admin | admin@test.com | 12345678 |
| Client | client@test.com | 12345678 |

## 📱 Testing on Physical Devices

### Important Setup Steps:

1. **Find Your Local IP Address**
   ```bash
   # Windows
   ipconfig
   # Mac/Linux
   ifconfig
   # Look for IPv4 (e.g., 192.168.1.100)
   ```

2. **Update API Base URL in App**
   - Edit `GuardTrackingApp/src/services/api.ts`
   - Change `localhost` or `10.0.2.2` to your local IP
   - Example: `http://192.168.1.100:3000`

3. **Update WebSocket URL**
   - Edit `GuardTrackingApp/src/services/WebSocketService.ts`
   - Change to your local IP address
   - Example: `http://192.168.1.100:3000`

4. **Ensure All Devices on Same WiFi**
   - Your computer (running backend)
   - Physical device 1 (Guard app)
   - Physical device 2 (Admin app)

5. **Run on Physical Device**
   ```bash
   # Android - Connect via USB, enable USB debugging
   adb devices  # Verify device connected
   npx react-native run-android
   
   # iOS - Connect via USB
   npx react-native run-ios --device
   ```

## 🎯 Expected Console Output

### Guard App
```
📍 Real-time location tracking started
📍 Location updated: 40.7128, -74.0060 (±5m)
Location update sent: { guardId: '...', latitude: 40.7128, ... }
```

### Admin App
```
WebSocket connected
WebSocket authenticated successfully
Received live locations update
```

### Backend
```
Client connected: <socketId>
Guard <guardId> connected
Location update broadcasted for guard: <guardId>
```

## 🛠️ Common Commands

```bash
# Check database records
# Connect to your database and run:
SELECT * FROM "TrackingRecord" ORDER BY timestamp DESC LIMIT 10;

# Check WebSocket connections
# Look in backend logs for connection messages

# Clear test data (if needed)
# Delete test accounts via database or admin panel
```

## 📝 Notes

- Location updates every 30 seconds by default
- Updates sent when guard moves 5+ meters
- Offline updates are queued and synced when online
- WebSocket is required for real-time updates

---

For detailed testing guide, see `LIVE_TRACKING_TEST_GUIDE.md`

