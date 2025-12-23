# Client-Created Shifts Visibility on Admin Side

## Overview

This document explains how client-created shifts and sites are visible to admins and how admins can assign guards to them.

---

## ✅ Current Implementation Status

### How It Works:

1. **Client Creates Site**
   - Client creates a site through their dashboard
   - Site is linked to the client via `site.clientId`
   - Site is linked to security company via `CompanySite` relation

2. **Client Creates Shift**
   - Client creates a shift for their site
   - Shift is stored with:
     - `clientId` - links to the client who created it
     - `siteId` - links to the site (optional but typically provided)
     - `guardId` - **null** (unassigned initially)
     - `locationName` and `locationAddress` - from site or manually entered

3. **Admin Sees Client-Created Shifts**
   - Admin queries shifts using `getShiftsByDateRange()` with `securityCompanyId`
   - The query includes shifts where:
     - **OR** the shift's guard belongs to the company
     - **OR** the shift's client belongs to the company (via `CompanyClient`)
     - **OR** the shift's site belongs to the company (via `CompanySite`)
   
   Since client-created shifts have a `clientId` that belongs to the company, they **will be included** in admin queries.

4. **Admin Assigns Guard**
   - Admin can see unassigned shifts (including client-created ones) in the "Unassigned" tab
   - Admin clicks "Assign Guard" on any unassigned shift
   - Admin selects a guard and assigns them
   - The shift's `guardId` is updated
   - Shift moves from "Unassigned" to "Calendar" view

---

## 🔍 Query Logic Details

### Admin Shift Query (`getShiftsByDateRange`)

The query filters shifts by `securityCompanyId` using an OR condition:

```typescript
where: {
  scheduledStartTime: { gte: startDate, lte: endDate },
  OR: [
    // Condition 1: Shift's guard belongs to company
    {
      guard: {
        companyGuards: {
          some: {
            securityCompanyId: options.securityCompanyId,
            isActive: true,
          },
        },
      },
    },
    // Condition 2: Shift's client belongs to company ✅ This catches client-created shifts
    {
      client: {
        companyClients: {
          some: {
            securityCompanyId: options.securityCompanyId,
            isActive: true,
          },
        },
      },
    },
    // Condition 3: Shift's site belongs to company ✅ This also catches client-created shifts
    {
      site: {
        companySites: {
          some: {
            securityCompanyId: options.securityCompanyId,
            isActive: true,
          },
        },
      },
    },
  ],
}
```

**Why This Works:**
- Client-created shifts have a `clientId` that links to a `Client`
- The `Client` has a `CompanyClient` relation linking it to the security company
- Condition 2 will match, so the shift is included in admin queries
- Even if `clientId` is missing but `siteId` exists, Condition 3 will match

---

## 📊 Data Flow

### Client Creates Shift:
```
Client Dashboard
  ↓
POST /api/clients/shifts
  ↓
shiftService.createShift()
  ↓
Database: Shift {
  id: "shift-123",
  clientId: "client-456",      ← Links to client
  siteId: "site-789",          ← Links to site
  guardId: null,               ← Unassigned
  scheduledStartTime: ...,
  scheduledEndTime: ...
}
```

### Admin Views Shifts:
```
Admin Dashboard
  ↓
GET /api/admin/shifts?date=2025-01-15
  ↓
getShiftsByDateRange(securityCompanyId)
  ↓
Query includes shifts where:
  - client.companyClients.securityCompanyId === adminCompanyId ✅
  - OR site.companySites.securityCompanyId === adminCompanyId ✅
  ↓
Returns client-created shifts (with guardId: null)
```

### Admin Views Unassigned Shifts:
```
Admin Dashboard → "Unassigned" Tab
  ↓
GET /api/admin/shifts/unassigned?date=2025-01-15
  ↓
getUnassignedShifts() filters to:
  - Shifts from getShiftsByDateRange() (includes client-created)
  - WHERE guardId IS NULL
  - AND status === 'SCHEDULED'
  ↓
Returns client-created unassigned shifts
```

### Admin Assigns Guard:
```
Admin clicks "Assign Guard"
  ↓
PATCH /api/admin/shifts/{shiftId}/assign-guard
  Body: { guardId: "guard-123" }
  ↓
shiftService.assignGuardToShift()
  ↓
Database: Shift {
  guardId: "guard-123"  ← Updated
}
  ↓
Shift appears in Calendar view (assigned)
```

---

## ✅ Verification Checklist

To verify client-created shifts are visible to admin:

- [ ] Client can create a site
- [ ] Client can create a shift for their site
- [ ] Shift is created with `guardId: null`
- [ ] Admin can see the shift in `/api/admin/shifts?date=YYYY-MM-DD`
- [ ] Admin can see the shift in `/api/admin/shifts/unassigned?date=YYYY-MM-DD`
- [ ] Admin can assign a guard to the client-created shift
- [ ] After assignment, shift has `guardId` set
- [ ] Client can see the assigned guard in their shift view

---

## 🧪 Test Scenarios

### Scenario 1: Client Creates Shift, Admin Assigns Guard

1. **Client Action:**
   ```bash
   POST /api/clients/shifts
   {
     "siteId": "site-123",
     "scheduledStartTime": "2025-01-15T09:00:00Z",
     "scheduledEndTime": "2025-01-15T17:00:00Z"
   }
   ```
   Expected: Shift created with `guardId: null`, `clientId: "client-456"`

2. **Admin Views Unassigned:**
   ```bash
   GET /api/admin/shifts/unassigned?date=2025-01-15
   ```
   Expected: Returns the client-created shift in the list

3. **Admin Assigns Guard:**
   ```bash
   PATCH /api/admin/shifts/{shiftId}/assign-guard
   {
     "guardId": "guard-789"
   }
   ```
   Expected: Shift updated with `guardId: "guard-789"`

4. **Verify Client Sees Guard:**
   ```bash
   GET /api/clients/shifts/{shiftId}
   ```
   Expected: Returns shift with guard information included

---

## 🔧 Potential Issues & Solutions

### Issue 1: Client-created shifts not showing in admin view

**Possible Causes:**
- `CompanyClient` relation missing or inactive
- `CompanySite` relation missing or inactive
- Query logic issue

**Solution:**
- Verify `CompanyClient` record exists: `client.companyClients` should have active record for the security company
- Verify `CompanySite` record exists if using site-based filtering
- Check query logs to see which condition is matching

### Issue 2: Site not linked to company

**Solution:**
- When client creates a site, ensure `CompanySite` relation is created
- Check that `site.companySites` includes the security company

### Issue 3: Multi-tenant isolation

**Solution:**
- The OR conditions ensure shifts are only visible to the correct security company
- All three conditions check `securityCompanyId` and `isActive: true`
- This ensures proper multi-tenant isolation

---

## 📝 Code Locations

### Backend Services:
- `backend/src/services/shiftService.ts`:
  - `getShiftsByDateRange()` - Lines 1291-1400 (includes multi-tenant filtering)
  - `createShift()` - Lines 124-268 (creates shifts, links to client/site)
  - `assignGuardToShift()` - Lines 270-350 (assigns guard to any unassigned shift)

### Backend Controllers:
- `backend/src/controllers/adminShiftController.ts`:
  - `getShifts()` - Lines 90-158 (admin shift query endpoint)
  - `getUnassignedShifts()` - Lines 243-311 (unassigned shifts endpoint)
  - `assignGuard()` - Lines 195-238 (guard assignment endpoint)

- `backend/src/controllers/clientController.ts`:
  - `createShift()` - Lines 270-350 (client creates shift)

### Frontend:
- `GuardTrackingApp/src/screens/admin/ShiftSchedulingScreen.tsx`:
  - `loadShifts()` - Loads all shifts for admin (includes client-created)
  - `loadUnassignedShifts()` - Loads unassigned shifts (includes client-created)
  - `handleAssignGuard()` - Assigns guard to any shift (including client-created)

---

## ✅ Summary

**Current Implementation:**
- ✅ Client-created shifts **ARE** visible to admin
- ✅ Client-created sites **ARE** visible to admin (through shifts)
- ✅ Admin can assign guards to client-created shifts
- ✅ Multi-tenant filtering works correctly
- ✅ Unassigned shifts view includes client-created shifts

**The system is already designed to work this way!** The query logic in `getShiftsByDateRange()` explicitly includes shifts where the client belongs to the security company, which means all client-created shifts for that company will be visible to admins.

---

## 🚀 Next Steps

If you want to verify or enhance this:

1. **Test the flow:**
   - Create a shift as a client
   - Login as admin
   - Verify the shift appears in unassigned list
   - Assign a guard
   - Verify assignment works

2. **Add visual indicators (optional):**
   - Show "Created by Client" badge on shifts
   - Show client name on shift cards
   - Filter by "Client Created" vs "Admin Created"

3. **Add notifications (optional):**
   - Notify client when guard is assigned
   - Notify admin when client creates shift

4. **Add audit trail (optional):**
   - Track who created the shift (client vs admin)
   - Track when guard was assigned and by whom

