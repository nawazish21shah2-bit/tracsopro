# Guard Check-In/Check-Out Fixes

## Issues Fixed

### 1. Check-In Issues
**Problem**: Guards couldn't check in to shifts that were already in `IN_PROGRESS` status (e.g., from seed data).

**Solution**: 
- Modified `checkInToShift` in both `shiftService.ts` and `shiftServiceSimple.ts`
- Now allows checking in if:
  - Status is `SCHEDULED` (normal case)
  - Status is `IN_PROGRESS` but `actualStartTime` is not set (auto-started or seeded shifts)
  - Status is `IN_PROGRESS` with `actualStartTime` (allows updating check-in location)

### 2. Check-Out Issues
**Problem**: Guards getting "no active shift" error when trying to check out.

**Solution**:
- Check-out already works for `IN_PROGRESS` and `ON_BREAK` status
- The `getActiveShift` method correctly finds shifts with status `IN_PROGRESS` or `ON_BREAK`
- Error messages improved to be more descriptive

## Files Modified

1. **`backend/src/services/shiftService.ts`**
   - Updated `checkInToShift` method to handle already IN_PROGRESS shifts
   - Allows updating check-in location if already checked in

2. **`backend/src/services/shiftServiceSimple.ts`**
   - Updated `checkInToShift` method with same logic
   - Preserves existing `actualStartTime` if already set

## How It Works Now

### Check-In Flow
1. Guard finds their shift (SCHEDULED or IN_PROGRESS)
2. Guard taps "Check In"
3. System validates:
   - Shift belongs to guard
   - Status is not COMPLETED/CANCELLED/NO_SHOW
4. If already IN_PROGRESS with actualStartTime:
   - Updates check-in location only
5. Otherwise:
   - Sets status to IN_PROGRESS
   - Sets actualStartTime (if not already set)
   - Records check-in location

### Check-Out Flow
1. Guard finds their active shift (IN_PROGRESS or ON_BREAK)
2. Guard taps "Check Out"
3. System validates:
   - Shift belongs to guard
   - Status is IN_PROGRESS or ON_BREAK
4. Updates:
   - Status to COMPLETED
   - actualEndTime
   - checkOutLocation
   - Calculates total break time

## Emergency Alerts

Emergency alerts are already working:
- Endpoint: `POST /api/emergency/alert`
- Requires: guardId, type, severity, location
- Automatically finds active shift if shiftId not provided
- Sends notifications to admins and clients

## Reports

Reports can be submitted:
- During active shifts via `POST /api/shifts/:id/incident`
- As incident reports via `POST /api/incident-reports`
- Both require guard authentication and active shift

## Testing

To test the fixes:

1. **Check-In Test**:
   - Login as guard
   - Find a shift (SCHEDULED or IN_PROGRESS)
   - Tap "Check In"
   - Should work even if shift is already IN_PROGRESS

2. **Check-Out Test**:
   - After checking in
   - Tap "Check Out"
   - Should complete the shift successfully

3. **Emergency Alert Test**:
   - During active shift
   - Tap emergency button
   - Should send alert to admins

4. **Report Test**:
   - During active shift
   - Submit incident report
   - Should be saved and visible to admins/clients

## Deployment

These changes will be automatically deployed via GitHub Actions when pushed to `main` branch.

