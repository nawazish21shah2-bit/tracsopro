# Shift Creation Scripts

This directory contains scripts to create test shifts for development and testing purposes.

## Available Scripts

### 1. `create-today-shift-checkin.js`
Creates a shift for today (or tomorrow if it's past 5 PM) and checks in the guard.

**Usage:**
```bash
cd backend
node scripts/create-today-shift-checkin.js
```

**What it does:**
- Finds an existing guard
- Finds or creates a site
- Creates a shift for today (9 AM - 5 PM, or tomorrow if past 5 PM)
- Checks in the guard to the shift
- Sets shift status to `IN_PROGRESS`

### 2. `create-today-active-shift.js`
Creates an active shift for today that's already in progress (started earlier today).

**Usage:**
```bash
cd backend
node scripts/create-today-active-shift.js
```

**What it does:**
- Finds an existing guard
- Finds or creates a site
- Creates a shift for today that started 2 hours ago (or 6 AM if earlier)
- Ends at 10 PM today
- Automatically checks in the guard
- Sets shift status to `IN_PROGRESS`

**Recommended for:**
- Testing submit report functionality
- Testing emergency alerts
- Testing features that require an active shift

## Notes

- Both scripts will use the first guard found in the database
- If no site exists, a test site will be created
- The scripts automatically check if a shift already exists to avoid duplicates
- Check-in location is set to default NYC coordinates (you can modify in the script)

## Example Output

```
🚀 Creating today's active shift (already in progress)...

1. Finding an existing guard...
✅ Found guard: John Doe (guard1@example.com)

2. Finding a site for the shift...
✅ Using existing site: Downtown Corporate Center

3. Creating today's active shift...
✅ Created shift: b7eb4227-5f59-43b8-8a9f-32dc80c32171

4. Checking in guard to shift...
✅ Guard checked in successfully!

✅ Success! Today's active shift is ready for testing.
```

## Troubleshooting

If you get an error about no guards found:
- Run the seed scripts first: `node scripts/seed-test-roles-client.js`
- Or create a guard user manually in the database

If you get database connection errors:
- Make sure your `.env` file is configured correctly
- Ensure the database is running and accessible

