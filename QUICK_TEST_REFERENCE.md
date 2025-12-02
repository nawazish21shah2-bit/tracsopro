# Quick Testing Reference Card

## 🚀 Start Everything

```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start React Native App
cd GuardTrackingApp
npm run android  # or npm run ios
```

## 🔧 Configuration Checklist

### 1. Update IP Address
**File:** `GuardTrackingApp/src/services/api.ts` (Line 31)
```typescript
const LOCAL_IP = '192.168.1.12'; // ← Change to your IP
```

**File:** `GuardTrackingApp/src/services/WebSocketService.ts` (Line 84)
```typescript
const LOCAL_IP = '192.168.1.12'; // ← Change to your IP
```

**Find Your IP:**
- Windows: `ipconfig` → Look for "IPv4 Address"
- Mac/Linux: `ifconfig` → Look for inet address

### 2. Verify Backend Running
```bash
curl http://localhost:3000/api/health
# Should return: {"status":"ok"}
```

### 3. Test from Device Browser
Open on your phone: `http://YOUR_IP:3000/api/health`

---

## 📍 Test Location Tracking

### Quick Test Steps:
1. ✅ Login as guard: `guard1@example.com` / `Passw0rd!`
2. ✅ Start a shift
3. ✅ Walk around
4. ✅ Check backend logs for location updates

### What to Look For:

**In React Native Console:**
```
📍 Real-time location tracking started
📍 Location updated: 40.7589, -73.9851 (±10m)
```

**In Backend Console:**
```
POST /api/tracking/location
WebSocket: location_update received
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect to backend | 1. Check IP address<br>2. Verify backend running<br>3. Check firewall |
| Location not updating | 1. Check permissions<br>2. Enable GPS<br>3. Test outdoors |
| WebSocket not connecting | 1. Check WebSocket IP matches API IP<br>2. Verify backend WebSocket enabled |
| Token errors | 1. Re-login<br>2. Check backend JWT_SECRET |

---

## 🔍 Quick Commands

```bash
# Find your IP (Windows)
ipconfig

# Find your IP (Mac/Linux)
ifconfig | grep "inet "

# Test backend health
curl http://localhost:3000/api/health

# View Android logs
adb logcat | grep -i location

# View iOS logs (Xcode)
# Open Xcode → Window → Devices → Select device → View logs
```

---

## 📱 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Guard | guard1@example.com | Passw0rd! |
| Supervisor | supervisor1@example.com | Passw0rd! |
| Admin | admin@example.com | Passw0rd! |

---

## ✅ Testing Checklist

- [ ] Backend running on port 3000
- [ ] IP address configured correctly
- [ ] Device can reach backend (test in browser)
- [ ] Location permissions granted
- [ ] GPS enabled on device
- [ ] Logged in as guard
- [ ] Shift started
- [ ] Location updates appearing in logs
- [ ] WebSocket connected (check backend logs)

---

## 🎯 Common Test Scenarios

### Scenario 1: Basic Tracking (5 min)
1. Login → Start Shift → Walk → End Shift
2. Verify: Location updates in backend logs

### Scenario 2: Network Test (2 min)
1. Start shift
2. Turn off Wi-Fi
3. Walk around
4. Turn Wi-Fi back on
5. Verify: Locations sync to backend

### Scenario 3: Geofencing (3 min)
1. Add geofence at current location
2. Walk outside zone
3. Walk back inside
4. Verify: Entry/exit notifications

---

## 📞 Need Help?

1. Check `DEVELOPMENT_TESTING_GUIDE.md` for detailed info
2. Review backend logs for errors
3. Check React Native console for errors
4. Verify network connectivity

---

**Pro Tip:** Keep backend terminal and React Native terminal visible side-by-side to monitor both logs simultaneously!
