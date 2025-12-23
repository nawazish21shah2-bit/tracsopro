# Shift Flow Testing Checklist

Use this checklist to verify the streamlined shift creation and assignment flow works correctly.

## Prerequisites
- [ ] Backend server stopped
- [ ] Prisma Client regenerated (`npx prisma generate`)
- [ ] Backend server restarted
- [ ] Database schema updated (guardId is nullable)

---

## 1. Client Creates Shift (No Guard)

### Test Steps:
1. Login as **Client**
2. Navigate to create shift screen
3. Select a site
4. Create shift **without selecting a guard**
5. Fill in dates/times
6. Submit

### Expected Results:
- [ ] Shift created successfully
- [ ] Shift has `guardId: null`
- [ ] Shift status is `SCHEDULED`
- [ ] Shift appears in client's shift list
- [ ] No errors in console/backend logs

### API Test:
```bash
POST /api/clients/shifts
{
  "siteId": "site-id",
  "scheduledStartTime": "2025-01-15T09:00:00Z",
  "scheduledEndTime": "2025-01-15T17:00:00Z"
}
# Should return 201 with shift object (guardId: null)
```

---

## 2. Client Creates Shift (With Guard)

### Test Steps:
1. Login as **Client**
2. Create shift **with guard selected**
3. Submit

### Expected Results:
- [ ] Shift created successfully
- [ ] Shift has `guardId: "guard-id"`
- [ ] Guard can see the shift in their upcoming shifts
- [ ] No errors

### API Test:
```bash
POST /api/clients/shifts
{
  "siteId": "site-id",
  "guardId": "guard-id",  # Optional
  "scheduledStartTime": "2025-01-15T09:00:00Z",
  "scheduledEndTime": "2025-01-15T17:00:00Z"
}
# Should return 201 with shift object (guardId: "guard-id")
```

---

## 3. Admin Creates Shift (No Guard)

### Test Steps:
1. Login as **Admin**
2. Create shift **without guard**
3. Submit

### Expected Results:
- [ ] Shift created successfully
- [ ] Shift has `guardId: null`
- [ ] Shift appears in unassigned shifts list
- [ ] No errors

### API Test:
```bash
POST /api/admin/shifts
{
  "siteId": "site-id",  # Optional
  "locationName": "Location Name",
  "locationAddress": "Address",
  "scheduledStartTime": "2025-01-15T09:00:00Z",
  "scheduledEndTime": "2025-01-15T17:00:00Z"
}
# Should return 201 (guardId not required)
```

---

## 4. Admin Creates Shift (With Guard)

### Test Steps:
1. Login as **Admin**
2. Create shift **with guard selected**
3. Submit

### Expected Results:
- [ ] Shift created successfully
- [ ] Shift has `guardId: "guard-id"`
- [ ] Guard can see the shift
- [ ] No errors

### API Test:
```bash
POST /api/admin/shifts
{
  "guardId": "guard-id",  # Optional
  "siteId": "site-id",
  "scheduledStartTime": "2025-01-15T09:00:00Z",
  "scheduledEndTime": "2025-01-15T17:00:00Z"
}
# Should return 201 with shift object
```

---

## 5. Get Unassigned Shifts (Admin)

### Test Steps:
1. Login as **Admin**
2. Navigate to unassigned shifts list
3. Verify shifts without guards appear

### Expected Results:
- [ ] Only shifts with `guardId: null` are returned
- [ ] Only `SCHEDULED` shifts are included
- [ ] Shifts with guards are NOT included
- [ ] List updates correctly

### API Test:
```bash
GET /api/admin/shifts/unassigned?date=2025-01-15
# Should return array of shifts where guardId is null
```

---

## 6. Assign Guard to Shift (Admin)

### Test Steps:
1. Login as **Admin**
2. View unassigned shifts
3. Select a shift
4. Click "Assign Guard"
5. Select a guard
6. Submit

### Expected Results:
- [ ] Guard assigned successfully
- [ ] Shift now has `guardId`
- [ ] Shift removed from unassigned list
- [ ] Guard can see the shift
- [ ] No overlapping shift conflicts

### API Test:
```bash
PATCH /api/admin/shifts/{shiftId}/assign-guard
{
  "guardId": "guard-id"
}
# Should return 200 with updated shift object
```

---

## 7. Assign Guard Conflict Detection

### Test Steps:
1. Create two overlapping shifts for same guard
2. Try to assign guard to second shift
3. Should detect conflict

### Expected Results:
- [ ] Error returned: "Guard has overlapping shifts"
- [ ] Guard NOT assigned
- [ ] Shift remains unassigned

### API Test:
```bash
# Create shift 1: 09:00-17:00
POST /api/admin/shifts { guardId: "guard-1", ... }

# Try to assign same guard to overlapping shift 2: 10:00-18:00
PATCH /api/admin/shifts/{shift2Id}/assign-guard { guardId: "guard-1" }
# Should return 400 with conflict error
```

---

## 8. Guard Cannot Create Shift

### Test Steps:
1. Login as **Guard**
2. Try to create a shift (if UI allows)
3. Should be blocked or return error

### Expected Results:
- [ ] Endpoint returns 403/404 or method not allowed
- [ ] Error message indicates guards cannot create shifts
- [ ] No shift created

### API Test:
```bash
POST /api/shifts
# Should return error (endpoint removed or blocked)
```

---

## 9. Guard Checks In to Assigned Shift

### Test Steps:
1. Assign guard to shift
2. Login as **Guard**
3. Navigate to shift
4. Check in

### Expected Results:
- [ ] Check-in successful
- [ ] Shift status changes to `IN_PROGRESS`
- [ ] `actualStartTime` is set
- [ ] Check-in location recorded
- [ ] No errors

### API Test:
```bash
POST /api/shifts/{shiftId}/check-in
{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10,
    "address": "123 Main St"
  }
}
# Should return 200 with updated shift
```

---

## 10. Guard Cannot Check In to Unassigned Shift

### Test Steps:
1. Create shift without guard
2. Login as **Guard**
3. Try to check in (if they can see it)

### Expected Results:
- [ ] Check-in fails
- [ ] Error: "Shift does not belong to this guard" or similar
- [ ] Shift remains `SCHEDULED`

---

## 11. Client Views Assigned Guard

### Test Steps:
1. Assign guard to shift
2. Login as **Client**
3. View shift details
4. Verify guard information displayed

### Expected Results:
- [ ] Guard name displayed
- [ ] Guard contact info visible (if allowed)
- [ ] Can communicate with guard
- [ ] Guard info updates when guard is assigned

### API Test:
```bash
GET /api/clients/shifts/{shiftId}
# Should return shift with guard object included
```

---

## 12. Guard Views Shift Details

### Test Steps:
1. Assign guard to shift
2. Login as **Guard**
3. View shift details

### Expected Results:
- [ ] Shift details visible
- [ ] Site information displayed
- [ ] Client information visible (if allowed)
- [ ] Can communicate with client
- [ ] Check-in button enabled

---

## 13. Query Tests

### Test: Get shifts by date (includes assigned and unassigned)
```bash
GET /api/admin/shifts?date=2025-01-15
# Should return all shifts for date (both assigned and unassigned)
```

### Test: Get shifts filtered by guard
```bash
GET /api/admin/shifts?date=2025-01-15&guardId=guard-id
# Should return only shifts for that guard
```

### Test: Get client shifts
```bash
GET /api/clients/shifts
# Should return client's shifts (with guard info if assigned)
```

---

## Error Cases

### Test: Assign guard to already assigned shift
- [ ] Error: "Shift already has a guard assigned"

### Test: Assign guard to non-scheduled shift
- [ ] Error: "Can only assign guard to scheduled shifts"

### Test: Assign invalid guard
- [ ] Error: "Guard not found"

### Test: Client creates shift for wrong site
- [ ] Error: "Site does not belong to this client"

---

## Performance Tests

- [ ] Unassigned shifts query is fast (< 500ms)
- [ ] Guard assignment is fast (< 500ms)
- [ ] Large number of shifts (100+) handled correctly
- [ ] Pagination works for shift lists

---

## Integration Tests

- [ ] Client creates → Admin assigns → Guard checks in (full flow)
- [ ] Admin creates with guard → Guard checks in (direct flow)
- [ ] Communication enabled after guard assignment
- [ ] Notifications sent when guard assigned
- [ ] Shift status updates propagate correctly

---

## Notes

- All tests should be run in development/staging environment first
- Test with real data if possible
- Check backend logs for any errors
- Verify database state after each operation
- Test edge cases (past dates, overlapping times, etc.)

---

## Status

Update this section as you test:

- [ ] All tests passing
- [ ] Issues found: (list any issues)
- [ ] Ready for production: Yes/No
