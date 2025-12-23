# Backend Conflict Detection - Implementation Complete

## ✅ What Was Implemented

### New Service: `shiftConflictService.ts`

A comprehensive conflict detection service that checks for:
1. **Overlapping Shifts** - Prevents guards from being assigned to overlapping time slots
2. **Overtime Limits** - Warns/errors when weekly hours exceed thresholds (40h warning, 45h error)
3. **Rest Periods** - Ensures minimum 8 hours rest between shifts
4. **Site Capacity** - Warns when many shifts overlap at the same site

### Integration Points

#### 1. Shift Creation (`shiftService.createShift`)
- When creating a shift **with a guard**, conflicts are checked
- Error-level conflicts **block** shift creation
- Warning-level conflicts are **logged** but allow creation
- Shifts created **without a guard** skip conflict checks (conflicts checked when guard is assigned later)

#### 2. Guard Assignment (`shiftService.assignGuardToShift`)
- Conflicts are checked before assigning guard to unassigned shift
- Error-level conflicts **block** assignment
- Warning-level conflicts are **logged** but allow assignment
- Uses `excludeShiftId` to avoid false positives

---

## 🎯 Conflict Types

### Error-Level (Blocks Action)
- **OVERLAP**: Guard has overlapping shifts at the same time
  - Message: "Guard has X overlapping shift(s) at this time"
  
- **OVERTIME (Critical)**: Would exceed 45 hours per week
  - Message: "This shift would result in X.X hours this week (exceeds 45h limit)"

### Warning-Level (Allows Action, Logs)
- **OVERTIME (Warning)**: Would exceed 40 hours but not 45 hours
  - Message: "This shift would result in X.X hours this week (overtime)"
  
- **REST_PERIOD**: Less than 8 hours between shifts
  - Message: "Insufficient rest period: Only X.X hours between shifts (minimum 8h required)"
  
- **SITE_CAPACITY**: Many overlapping shifts at same site
  - Message: "X other shift(s) at this site during this time"

---

## 📝 Usage Examples

### Example 1: Blocking Overlap
```typescript
// Try to create shift that overlaps with existing shift
await shiftService.createShift({
  guardId: "guard-123",
  scheduledStartTime: new Date("2025-01-15T09:00:00Z"),
  scheduledEndTime: new Date("2025-01-15T17:00:00Z"),
  // ... other fields
});

// Result: ValidationError: "Cannot create shift: Guard has 1 overlapping shift(s) at this time"
```

### Example 2: Overtime Warning
```typescript
// Guard already has 38 hours this week, create 5-hour shift
await shiftService.createShift({
  guardId: "guard-123",
  scheduledStartTime: new Date("2025-01-15T09:00:00Z"),
  scheduledEndTime: new Date("2025-01-15T14:00:00Z"), // 5 hours
  // ... other fields
});

// Result: Shift created, but warning logged:
// "Shift creation warnings: This shift would result in 43.0 hours this week (overtime)"
```

### Example 3: Rest Period Warning
```typescript
// Guard finishes shift at 17:00, try to assign shift starting at 23:00 (only 6 hours rest)
await shiftService.assignGuardToShift("shift-456", "guard-123");

// Result: Guard assigned, but warning logged:
// "Guard assignment warnings: Insufficient rest period: Only 6.0 hours between shifts (minimum 8h required)"
```

---

## 🔧 Configuration

### Constants (in `shiftConflictService.ts`)
```typescript
const MAX_WEEKLY_HOURS = 40;           // Standard work week
const OVERTIME_WARNING_THRESHOLD = 45; // Error threshold
const MIN_REST_HOURS = 8;              // Minimum rest between shifts
```

These can be adjusted based on your business rules.

---

## ✅ Testing Checklist

- [ ] Create overlapping shifts → Should block with error
- [ ] Create shift exceeding 45h/week → Should block with error
- [ ] Create shift between 40-45h/week → Should warn but allow
- [ ] Assign guard with < 8h rest → Should warn but allow
- [ ] Create shift without guard → Should skip conflict checks
- [ ] Assign guard later → Should check conflicts at assignment time

---

## 📊 Impact

### Before:
- ❌ No conflict detection in backend
- ❌ Guards could be assigned overlapping shifts
- ❌ No overtime limits enforced
- ❌ No rest period validation

### After:
- ✅ Backend validates conflicts before creation/assignment
- ✅ Overlapping shifts blocked
- ✅ Overtime limits enforced (40h warning, 45h error)
- ✅ Rest period validation (8h minimum)
- ✅ Site capacity warnings
- ✅ Errors block action, warnings log but allow

---

## 🔗 Related Files

- **Service**: `backend/src/services/shiftConflictService.ts` (NEW)
- **Integration**: `backend/src/services/shiftService.ts` (UPDATED)
  - `createShift()` - Lines ~207-224
  - `assignGuardToShift()` - Lines ~352-370

---

## 🎉 Status: COMPLETE

Backend conflict detection is now fully implemented and integrated!

**Next Steps** (Optional):
- Add conflict information to API responses (so frontend can display)
- Add admin override option for warnings
- Customize thresholds per guard/client
- Add shift templates with conflict pre-checking

