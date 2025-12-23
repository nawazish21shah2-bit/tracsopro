# Local Seed Instructions

## Seeding Ongoing Shifts Locally

The seed script has been successfully run on your local database! ✅

### What Was Created

- **5 ongoing shifts** with status `IN_PROGRESS`
- Shifts are assigned to guards
- Shifts are linked to clients and sites
- All shifts have start times in the past and end times in the future

### Shift Details Created

1. **Nawazish Shah** → ubl's Main Site (Client: ubl ubl)
   - Time: 9:59:57 PM - 5:59:57 AM
   
2. **user test Guard** → Hbl's Main Site (Client: Hbl bank)
   - Time: 10:59:57 PM - 6:59:57 AM
   
3. **Test Guard** → ubl's Main Site (Client: ubl ubl)
   - Time: 11:29:57 PM - 7:29:57 AM
   
4. **Sarah Williams** → My new site (Client: Client 1)
   - Time: 8:59:57 PM - 4:59:57 AM
   
5. **James Wilson** → Hbl's Main Site (Client: Hbl bank)
   - Time: 7:59:57 PM - 3:59:57 AM

### How to Run Again

If you need to seed more shifts or re-run the script:

```bash
cd backend
npm run db:seed-ongoing-shifts
```

Or directly:

```bash
cd backend
npx tsx prisma/seed-ongoing-shifts.ts
```

### Visibility

These shifts will be visible in your app:
- **Guards**: Can see their assigned shifts and check in/out
- **Clients**: Can see shifts at their sites
- **Admins**: Can see all shifts

### Testing

You can now:
1. Login as a guard and see their active shift
2. Check in to the shift (even though it's already IN_PROGRESS)
3. Check out from the shift
4. Submit reports during the shift
5. Send emergency alerts

### Notes

- The script automatically finds existing guards and clients
- Creates sites if they don't exist
- Shifts are created with realistic times (started in the past, ending in the future)
- All shifts have `actualStartTime` set (guards have checked in)



