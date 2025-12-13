# Testing Checklist - Option B Implementation

## 🧪 COMPREHENSIVE TESTING GUIDE

---

## ✅ TEST 1: Client Creates Shift Without Guard

**Steps:**
1. Login as CLIENT
2. Navigate to Sites
3. Select a site
4. Click "Create Shift"
5. Fill form:
   - Description: "Night security shift"
   - Start Date: Tomorrow
   - Start Time: "6:00 PM"
   - End Date: Tomorrow
   - End Time: "6:00 AM"
   - Guard: Leave empty (select "No Guard")
   - Notes: "Regular night shift"
6. Click "Create Shift"

**Expected:**
- ✅ Shift created successfully
- ✅ Shift has no guardId (null)
- ✅ Shift linked to client and site
- ✅ Success message shown
- ✅ Shift appears in site details

**API:** `POST /api/clients/shifts`

---

## ✅ TEST 2: Client Creates Shift With Guard

**Steps:**
1. Login as CLIENT
2. Navigate to Sites
3. Select a site
4. Click "Create Shift"
5. Fill form:
   - Description: "Day shift"
   - Start Date: Tomorrow
   - Start Time: "8:00 AM"
   - End Date: Tomorrow
   - End Time: "4:00 PM"
   - Guard: Select a guard from dropdown
   - Notes: "Day security shift"
6. Click "Create Shift"

**Expected:**
- ✅ Shift created successfully
- ✅ Shift has guardId assigned
- ✅ Shift linked to client, site, and guard
- ✅ Guard can see the shift

**API:** `POST /api/clients/shifts`

---

## ✅ TEST 3: Admin Creates Shift

**Steps:**
1. Login as ADMIN
2. Navigate to Shift Scheduling
3. Click "+" to create shift
4. Fill form:
   - Guard: Select guard (required)
   - Site: Select site (optional)
   - Start Date/Time: Tomorrow 8:00 AM
   - End Date/Time: Tomorrow 4:00 PM
   - Description: "Admin assigned shift"
5. Click "Create Shift"

**Expected:**
- ✅ Shift created successfully
- ✅ Shift has guardId (required)
- ✅ Shift linked to site/client if site selected
- ✅ Appears in shift list
- ✅ Guard can see the shift

**API:** `POST /api/admin/shifts`

---

## ✅ TEST 4: Admin Assigns Guard to Client-Created Shift

**Steps:**
1. Login as ADMIN
2. View shifts list
3. Find a shift created by client (no guardId)
4. Click to edit/assign guard
5. Select guard from dropdown
6. Save

**Expected:**
- ✅ Shift updated with guardId
- ✅ Guard can now see the shift
- ✅ Shift appears in guard's shift list

**API:** `PUT /api/admin/shifts/:id`

---

## ✅ TEST 5: Guard Views Assigned Shifts

**Steps:**
1. Login as GUARD
2. Navigate to "My Shifts"
3. View shifts list

**Expected:**
- ✅ Sees shifts assigned by admin
- ✅ Sees shifts assigned by client (if guard was selected)
- ✅ Can check in/out to shifts

**API:** `GET /api/shifts/upcoming`

---

## ✅ TEST 6: Guard Check-In/Out

**Steps:**
1. Login as GUARD
2. Navigate to active shift
3. Click "Check In"
4. Verify location captured
5. Complete shift
6. Click "Check Out"

**Expected:**
- ✅ Check-in successful
- ✅ Location recorded
- ✅ Shift status: IN_PROGRESS
- ✅ Check-out successful
- ✅ Shift status: COMPLETED

**API:** 
- `POST /api/shifts/:id/check-in`
- `POST /api/shifts/:id/check-out`

---

## ✅ TEST 7: Site Creation (Both Admin and Client)

**Client Creates Site:**
1. Login as CLIENT
2. Navigate to Sites
3. Create new site
4. Verify site created

**Admin Creates Site:**
1. Login as ADMIN
2. Navigate to Site Management
3. Create new site (for a client)
4. Verify site created and linked to client

**Expected:**
- ✅ Both can create sites
- ✅ Sites properly linked to clients
- ✅ Sites appear in respective lists

---

## ✅ TEST 8: Reports Functionality

**Steps:**
1. Guard submits shift report
2. Client views reports
3. Client responds to report

**Expected:**
- ✅ Reports created from ShiftReport model
- ✅ Client can view reports
- ✅ Client can respond to reports

**API:**
- `GET /api/clients/reports`
- `PUT /api/clients/reports/:id/respond`

---

## 🔍 VERIFICATION POINTS

### Database Checks:
```sql
-- Check shifts created
SELECT id, "guardId", "clientId", "siteId", "scheduledStartTime", "scheduledEndTime", status
FROM "Shift"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Check client-created shifts (no guard)
SELECT id, "guardId", "clientId", "siteId"
FROM "Shift"
WHERE "guardId" IS NULL
AND "clientId" IS NOT NULL;

-- Verify job board tables are gone
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ShiftPosting', 'ShiftApplication', 'ShiftAssignment', 'AssignmentReport');
-- Should return 0 rows
```

### API Response Checks:
- ✅ Response has `success: true`
- ✅ Response has `data` with shift object
- ✅ Shift object has correct `guardId`, `clientId`, `siteId`
- ✅ Dates are properly formatted

---

## 🐛 COMMON ISSUES TO CHECK

1. **Guard Dropdown Empty:**
   - Check if `getClientGuards` API works
   - Verify guards are linked to client's company
   - Check API response format

2. **Shift Creation Fails:**
   - Check siteId is valid
   - Verify site belongs to client
   - Check date/time format
   - Verify authentication token

3. **Guard Not Appearing:**
   - Check guard is linked to same SecurityCompany
   - Verify CompanyGuard relationship exists
   - Check guard's user role is GUARD

4. **Admin Can't See Client Shifts:**
   - Check shift queries include clientId
   - Verify admin has access to all shifts
   - Check filtering logic

---

## ✅ TESTING COMPLETE WHEN:

- [x] Client can create shift without guard
- [x] Client can create shift with guard
- [x] Admin can create shift with guard
- [x] Admin can assign guard to client shift
- [x] Guard can see assigned shifts
- [x] Guard can check in/out
- [x] Both admin and client can create sites
- [x] All shifts appear in correct lists
- [x] No errors in console
- [x] Database records correct
- [x] Reports functionality works

---

**Ready to start testing!** 🚀

