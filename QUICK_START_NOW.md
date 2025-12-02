# 🚀 Quick Start - Test Live Tracking NOW

## ✅ What's Already Done

1. ✅ **App Configuration Updated**
   - API base URL: `http://192.168.1.12:3000/api`
   - WebSocket URL: `http://192.168.1.12:3000`
   - Your local IP (192.168.1.12) is configured

2. ✅ **Backend Server Configured**
   - Server will listen on `0.0.0.0` (all network interfaces)
   - WebSocket service ready

## 🎯 Next Steps (Do These Now)

### Step 1: Start Backend Server

```bash
cd backend
npm run dev:db
```

**OR if that doesn't work:**
```bash
cd backend
npx tsx src/server-db.ts
```

**Expected Output:**
```
🚀 Server running on http://0.0.0.0:3000
📊 Environment: development
🔗 API: http://localhost:3000/api
🌐 WebSocket: ws://localhost:3000
```

### Step 2: Create Test Accounts (If Needed)

**Option A: Use Existing Accounts**
- Check if you already have test accounts in your database
- Login with any existing guard/admin accounts

**Option B: Create Manually via API**
```bash
# Use Postman or curl to create accounts
# Or use your admin panel if available
```

**Option C: Create via Database**
- Open your database
- Manually insert test users with password hash for `12345678`

### Step 3: Connect Physical Device 1 (Guard App)

1. **Connect Android Device:**
   ```bash
   # Enable USB debugging on phone
   # Connect via USB
   adb devices  # Verify connection
   
   cd GuardTrackingApp
   npx react-native run-android
   ```

2. **Connect iOS Device:**
   ```bash
   cd GuardTrackingApp
   npx react-native run-ios --device
   ```

3. **Login:**
   - Email: Use any guard account you have
   - Password: `12345678` (or your actual password)
   - Grant location permissions
   - Start a shift

### Step 4: Connect Physical Device 2 (Admin App)

1. **Run same app on second device:**
   ```bash
   # Same command, different device
   npx react-native run-android
   # or
   npx react-native run-ios --device
   ```

2. **Login as Admin:**
   - Email: Use any admin account you have
   - Password: `12345678` (or your actual password)
   - Navigate to Operations Center or Map View

## 🔍 Verify It's Working

### Check Backend Logs:
- Should see: "Client connected: <socketId>"
- Should see: "Guard <guardId> connected"
- Should see: "Location update broadcasted"

### Check Guard Device:
- Console shows: "📍 Real-time location tracking started"
- Console shows periodic location updates
- Walk around to see location changes

### Check Admin Device:
- Map shows guard marker
- "LIVE" indicator is green
- Guard position updates in real-time

## 🐛 Quick Troubleshooting

### "Network request failed"
- ✅ Verify backend is running
- ✅ Check devices on same WiFi
- ✅ Verify IP is 192.168.1.12 (run `ipconfig` again if needed)
- ✅ Try accessing `http://192.168.1.12:3000/api/health` in device browser

### "WebSocket connection failed"
- ✅ Check backend WebSocket is initialized
- ✅ Verify WebSocket URL in app uses 192.168.1.12
- ✅ Check firewall allows port 3000

### Location not updating
- ✅ Grant location permissions
- ✅ Enable GPS on device
- ✅ Go outside for better GPS signal
- ✅ Check shift is active

## 📝 Test Account Info

**If you need to create accounts manually:**

**Guard Account:**
- Email: `guard1@test.com`
- Password: `12345678`
- Role: `GUARD`

**Admin Account:**
- Email: `admin@test.com`
- Password: `12345678`
- Role: `ADMIN`

**Password Hash for `12345678`:**
- Use bcrypt to hash: `12345678`
- Or use your existing password hashing method

## 🎯 Current Configuration

- **Your Local IP:** `192.168.1.12`
- **Backend Port:** `3000`
- **API URL:** `http://192.168.1.12:3000/api`
- **WebSocket URL:** `http://192.168.1.12:3000`

## ⚡ Fastest Path to Test

1. Start backend: `cd backend && npm run dev:db`
2. Run guard app on device 1
3. Run admin app on device 2
4. Login and test!

---

**Note:** If Prisma generation failed, you can still test with existing accounts or create accounts manually via your admin panel/API.

