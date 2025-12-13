# Critical Fixes Remaining - Option B Cleanup

## 🔴 CRITICAL: Major Files Still Need Updates

### 1. `backend/src/services/shiftServiceSimple.ts` ⚠️
**Status**: ❌ Has 41 references to `shiftAssignment`  
**Priority**: 🔴 CRITICAL  
**Impact**: Core shift functionality broken

**What Needs Fixing:**
- `getShiftStatistics()` - Uses `shiftAssignment`
- `getShiftById()` - Checks `shiftAssignment` first
- `getActiveShift()` - Checks `shiftAssignment` first
- `getUpcomingShifts()` - Gets from `shiftAssignment`
- `getTodaysShifts()` - Gets from `shiftAssignment`
- `getPastShifts()` - Gets from `shiftAssignment`
- `getWeeklySummary()` - Gets from `shiftAssignment`
- `transformAssignmentToShift()` - Transforms `shiftAssignment`
- `mapAssignmentStatusToShiftStatus()` - Maps `ShiftAssignmentStatus`

**Action Required:**
- Update all methods to use `Shift` model only
- Remove `ShiftAssignmentStatus` enum usage
- Use `ShiftStatus` enum instead
- Remove transformation methods

---

### 2. `backend/src/services/adminSiteService.ts` ⚠️
**Status**: ❌ Has 2 references to `shiftAssignment`  
**Priority**: 🔴 HIGH

**What Needs Fixing:**
- Line 61: `shiftAssignments: true` in include
- Line 153: `prisma.shiftAssignment.count()`

**Action Required:**
- Replace with `shifts` instead
- Update count query

---

### 3. `GuardTrackingApp/src/screens/client/ClientSites.tsx` ⚠️
**Status**: ❌ Has 1 reference to `shiftAssignments`  
**Priority**: 🟡 MEDIUM

**What Needs Fixing:**
- Line 187: `site.shiftAssignments?.[0]`

**Action Required:**
- Replace with `site.shifts?.[0]`

---

## 🎯 RECOMMENDED ACTION PLAN

### Step 1: Fix shiftServiceSimple.ts (30-45 min)
This is the core shift service - needs complete refactor to use `Shift` model only.

### Step 2: Fix adminSiteService.ts (5 min)
Quick fix - replace references.

### Step 3: Fix ClientSites.tsx (2 min)
Quick fix - replace reference.

### Step 4: Run Migration
After all fixes are done, run:
```bash
cd backend
npx prisma migrate dev --name remove_job_board_models
npx prisma generate
```

---

## ⚠️ WARNING

**Do NOT run migration until these files are fixed!**

The migration will drop the tables, but the code still references them, causing runtime errors.

---

**Priority: Fix shiftServiceSimple.ts first - it's the most critical!** 🚀

