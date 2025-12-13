# Option B Quick Checklist
## Direct Assignment Model - Step-by-Step

---

## ⚡ QUICK START (7-10 hours total)

### 🔴 PHASE 1: Database (1-2 hours)

- [ ] **Step 1.1:** Update `backend/prisma/schema.prisma`
  - [ ] Remove `model ShiftPosting { ... }`
  - [ ] Remove `model ShiftApplication { ... }`
  - [ ] Remove `model ShiftAssignment { ... }`
  - [ ] Remove `model AssignmentReport { ... }`
  - [ ] Remove enums: `ShiftPostingStatus`, `ApplicationStatus`, `ShiftAssignmentStatus`, `AssignmentReportType`
  - [ ] Remove relations from `Guard`, `Site`, `Client` models

- [ ] **Step 1.2:** Run migration
  ```bash
  cd backend
  npx prisma migrate dev --name remove_job_board_models
  npx prisma generate
  ```

- [ ] **Step 1.3:** (Optional) Migrate existing data
  - [ ] Create script to convert `ShiftAssignment` → `Shift`
  - [ ] Run migration script if you have existing data

---

### 🟡 PHASE 2: Backend (2-3 hours)

- [ ] **Step 2.1:** Delete service files
  ```bash
  rm backend/src/services/shiftPostingService.ts
  rm backend/src/services/shiftAssignmentService.ts  # if exists
  ```

- [ ] **Step 2.2:** Remove imports
  - [ ] Search: `grep -r "shiftPostingService" backend/src`
  - [ ] Remove all imports and usages

- [ ] **Step 2.3:** Update `backend/src/services/shiftServiceSimple.ts`
  - [ ] Verify `createShift()` sets `clientId` from site
  - [ ] Test: Admin can create shift
  - [ ] Test: Shift links to client and site correctly

- [ ] **Step 2.4:** Add client shift creation route
  - [ ] File: `backend/src/routes/clients.ts` or `backend/src/routes/sites.ts`
  - [ ] Add: `POST /api/clients/shifts` or `POST /api/sites/:id/shifts`
  - [ ] Verify site belongs to client
  - [ ] Create shift with `clientId` set

- [ ] **Step 2.5:** Remove shift posting routes
  - [ ] Search: `grep -r "shift-postings" backend/src/routes`
  - [ ] Remove all shift posting routes

- [ ] **Step 2.6:** Update admin service
  - [ ] Remove shift posting methods from `adminService.ts`
  - [ ] Keep admin shift creation (already works)

---

### 🟢 PHASE 3: Frontend (3-4 hours)

- [ ] **Step 3.1:** Delete job board screens
  ```bash
  rm GuardTrackingApp/src/screens/guard/AvailableShiftsScreen.tsx
  rm GuardTrackingApp/src/screens/guard/ApplyForShiftScreen.tsx
  rm GuardTrackingApp/src/screens/dashboard/JobsScreen.tsx  # if job board related
  ```

- [ ] **Step 3.2:** Update navigation
  - [ ] Remove "Available Shifts" / "Jobs" from guard navigation
  - [ ] Remove "Apply for Shift" route
  - [ ] Keep "My Shifts" and "Check In" screens

- [ ] **Step 3.3:** Update `GuardTrackingApp/src/services/api.ts`
  - [ ] Remove: `getAvailableShiftPostings()`
  - [ ] Remove: `getShiftPostingById()`
  - [ ] Remove: `applyForShift()`
  - [ ] Remove: `createShiftPosting()`
  - [ ] Remove: `getShiftApplications()`
  - [ ] Remove: `reviewApplication()`
  - [ ] Add: `createShift()` or `createClientShift()` if not exists

- [ ] **Step 3.4:** Update `CreateShiftScreen.tsx`
  - [ ] Change from creating `ShiftPosting` to creating `Shift`
  - [ ] Add guard selection (dropdown/picker)
  - [ ] Update API call to use shift creation endpoint
  - [ ] Remove: hourlyRate, maxGuards, requirements (or move to notes)

- [ ] **Step 3.5:** Update `ClientDashboard.tsx`
  - [ ] Remove shift posting cards
  - [ ] Show direct shifts list
  - [ ] Add "Create Shift" button

- [ ] **Step 3.6:** Update `SiteDetailsScreen.tsx`
  - [ ] Remove shift posting list
  - [ ] Show shifts for the site
  - [ ] Add "Create Shift" button

---

### 🔵 PHASE 4: Testing (1 hour)

- [ ] **Test Admin Flow:**
  - [ ] Admin creates shift → Works
  - [ ] Admin views shifts → Works

- [ ] **Test Client Flow:**
  - [ ] Client creates shift for their site → Works
  - [ ] Client views shifts for their sites → Works
  - [ ] Client cannot create shift for other client's site → Blocked

- [ ] **Test Guard Flow:**
  - [ ] Guard views their shifts → Works
  - [ ] Guard checks in → Works
  - [ ] Guard checks out → Works
  - [ ] Guard cannot see other guards' shifts → Blocked

- [ ] **Test Data Integrity:**
  - [ ] Shifts link to correct client
  - [ ] Shifts link to correct site
  - [ ] Shifts link to correct guard
  - [ ] Check-in/out works correctly

---

### 🟣 PHASE 5: Cleanup (30 min)

- [ ] **Search for remaining references:**
  ```bash
  grep -r "ShiftPosting" GuardTrackingApp/src
  grep -r "shiftPosting" GuardTrackingApp/src
  grep -r "ShiftApplication" GuardTrackingApp/src
  grep -r "ShiftAssignment" GuardTrackingApp/src
  grep -r "applyForShift" GuardTrackingApp/src
  grep -r "shift-postings" GuardTrackingApp/src
  ```

- [ ] **Remove all found references**

- [ ] **Verify no TypeScript errors:**
  ```bash
  cd GuardTrackingApp
  npm run type-check  # or tsc --noEmit
  ```

- [ ] **Verify backend compiles:**
  ```bash
  cd backend
  npm run build  # or tsc
  ```

---

## 🎯 KEY CHANGES SUMMARY

### What's Removed:
- ❌ Job board (browsing/application system)
- ❌ ShiftPosting model
- ❌ ShiftApplication model
- ❌ ShiftAssignment model
- ❌ Guard application workflow

### What's Kept:
- ✅ Direct shift creation (admin/client)
- ✅ Shift model (single source of truth)
- ✅ Check-in/check-out
- ✅ Guard shift viewing
- ✅ All existing shift operations

### What's Changed:
- 🔄 Clients now create shifts directly (not postings)
- 🔄 Guards are assigned directly (no applications)
- 🔄 Simpler workflow (create → assign → check-in)

---

## ⚠️ BREAKING CHANGES

1. **Guards can no longer browse available shifts**
2. **Guards can no longer apply to shifts**
3. **Clients must assign guards directly** (or admin does it)
4. **No application/approval workflow**

**Impact:** Guards lose ability to choose shifts. All assignments are done by admin/client.

---

## 📝 NOTES

- **Time Estimate:** 7-10 hours
- **Risk:** Medium (frontend changes required)
- **Data Loss:** Existing ShiftPosting/Application/Assignment data will be lost (unless migrated)
- **User Impact:** Guards lose job browsing feature

---

## ✅ COMPLETION CHECKLIST

Before considering complete:
- [ ] Database migration successful
- [ ] All backend services updated
- [ ] All frontend screens updated
- [ ] Navigation updated
- [ ] API service updated
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All user flows tested
- [ ] Documentation updated

---

**Ready to start? Begin with Phase 1 (Database) and work through each phase sequentially.**



