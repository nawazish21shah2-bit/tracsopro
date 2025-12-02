# ⚡ QUICK TESTING CHECKLIST

A concise checklist for rapid testing of major flows. Use this for quick validation during development.

---

## 🚀 **QUICK START**

```bash
# 1. Start Backend
cd backend && npm run dev

# 2. Start Metro
cd GuardTrackingApp && npx react-native start

# 3. Run App
npx react-native run-android
```

**Test Accounts**: All passwords are `12345678`
- Guard: `guard1@test.com`
- Admin: `admin@test.com`
- Client: `client1@test.com`
- Super Admin: `superadmin@tracsopro.com`

---

## ✅ **GUARD FLOW (5 min)**

### Authentication
- [ ] Login with `guard1@test.com` / `12345678`
- [ ] Verify dashboard loads

### Core Features
- [ ] Navigate to "Jobs" tab → View available shifts
- [ ] Apply for a shift
- [ ] Navigate to "Shifts" tab → View my shifts
- [ ] Start check-in (if shift available)
- [ ] Verify location tracking starts
- [ ] Create incident report
- [ ] Check-out from shift

---

## ✅ **ADMIN FLOW (5 min)**

### Authentication
- [ ] Login with `admin@test.com` / `12345678`
- [ ] Verify admin dashboard loads

### Core Features
- [ ] View Operations tab → See live guard locations
- [ ] Navigate to Management → User Management
- [ ] Create a new guard user
- [ ] Navigate to Site Management
- [ ] Create a new site
- [ ] Navigate to Reports → Review incidents

---

## ✅ **CLIENT FLOW (5 min)**

### Authentication
- [ ] Login with `client1@test.com` / `12345678`
- [ ] Verify client dashboard loads

### Core Features
- [ ] Navigate to Sites & Shifts tab
- [ ] Create a new site
- [ ] Post a new shift
- [ ] View active guards on map
- [ ] View reports

---

## ✅ **LIVE TRACKING TEST (3 min)**

### Setup
- [ ] Device 1: Login as Guard
- [ ] Device 2: Login as Admin (or use browser)
- [ ] Backend running on `192.168.1.12:3000`

### Test Steps
- [ ] Guard: Start active shift (check-in)
- [ ] Admin: Open Operations Center
- [ ] **Verify**: Guard appears on map
- [ ] Guard: Move device (walk around)
- [ ] **Verify**: Location updates in real-time on Admin map
- [ ] Guard: Report incident
- [ ] **Verify**: Incident appears in Admin's incident queue

---

## ✅ **MULTI-USER WORKFLOW (10 min)**

### Complete Flow
1. **Client** (Device 1):
   - [ ] Create site
   - [ ] Post shift

2. **Guard** (Device 2):
   - [ ] See shift in "Available Shifts"
   - [ ] Apply for shift

3. **Client** (Device 1):
   - [ ] See application
   - [ ] Approve application

4. **Guard** (Device 2):
   - [ ] See shift in "My Shifts"
   - [ ] Check-in at shift location

5. **Admin** (Device 3 or Browser):
   - [ ] See guard on operations map
   - [ ] Monitor live location

6. **Guard** (Device 2):
   - [ ] Report incident
   - [ ] Check-out

7. **Client & Admin**:
   - [ ] See incident in reports
   - [ ] See completed shift

---

## ✅ **ERROR HANDLING (3 min)**

- [ ] Disable network → Try login → **Expected**: Error message
- [ ] Wrong password → **Expected**: Auth error
- [ ] Deny location permission → Try check-in → **Expected**: Permission request
- [ ] Re-enable network → **Verify**: Auto-sync works

---

## ✅ **CRITICAL BUGS TO CHECK**

### Must Work
- [ ] App doesn't crash on launch
- [ ] Login works for all roles
- [ ] Navigation between screens works
- [ ] Location tracking doesn't drain battery excessively
- [ ] WebSocket connection stable
- [ ] Data persists after app restart

### Common Issues
- [ ] Blank screens → Clear cache and rebuild
- [ ] Location not updating → Check permissions and backend
- [ ] WebSocket disconnects → Check network and backend
- [ ] Login fails → Check backend server status

---

## 📊 **PERFORMANCE CHECKS**

- [ ] App launches in < 3 seconds
- [ ] Map scrolls smoothly with 10+ markers
- [ ] Lists scroll smoothly with 100+ items
- [ ] Battery usage acceptable during tracking

---

## 🔒 **SECURITY CHECKS**

- [ ] Guard cannot access admin routes
- [ ] Client cannot access guard features
- [ ] Tokens expire correctly
- [ ] Sensitive data encrypted

---

## 🐛 **QUICK DEBUG COMMANDS**

```bash
# Clear Metro cache
npx react-native start --reset-cache

# Rebuild app
npx react-native run-android

# Check devices
adb devices

# View logs
npx react-native log-android

# Check backend
curl http://192.168.1.12:3000/api/health
```

---

## 📝 **TESTING NOTES**

- **Backend URL**: Update `LOCAL_IP` in `api.ts` and `WebSocketService.ts` if different
- **Physical Device**: Better for GPS testing than emulator
- **Network**: All devices must be on same WiFi
- **Backend**: Must be accessible from network (not just localhost)

---

**Quick Reference**: See `COMPREHENSIVE_TESTING_FLOW.md` for detailed test cases.


