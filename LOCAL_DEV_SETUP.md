# Local Development Setup - Quick Fix

## Current Status
- ✅ Frontend is configured to use local backend: `http://192.168.1.12:3000/api`
- ⚠️ Backend `.env` is currently pointing to PostgreSQL: `postgresql://postgres:postgres@localhost:5432/guard_tracking`

## Quick Fix Options

### Option 1: Use Local PostgreSQL (Current Setup)
If you have PostgreSQL running locally, ensure:
1. PostgreSQL is running on `localhost:5432`
2. Database `guard_tracking` exists
3. User `postgres` with password `postgres` has access
4. Update `backend/.env` to ensure `NODE_ENV=development`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/guard_tracking?schema=public
JWT_SECRET=dev-secret-change-me-in-production
```

### Option 2: Use SQLite for Local Dev (Simpler)
If you want to use SQLite (no PostgreSQL needed):

1. **Update `backend/prisma/schema.prisma`** - Change provider:
```prisma
datasource db {
  provider = "sqlite"  // Changed from "postgresql"
  url      = env("DATABASE_URL")
}
```

2. **Update `backend/.env`**:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=dev-secret-change-me-in-production
```

3. **Regenerate Prisma client and setup database**:
```bash
cd backend
npm run db:push
npm run db:generate
npm run db:seed
```

## Verify Setup

1. **Check backend is running**:
   ```bash
   cd backend
   npm run dev:db
   ```
   Should see: `🚀 Server running on http://0.0.0.0:3000`

2. **Test health endpoint**:
   Open: `http://localhost:3000/api/health`

3. **Check frontend config**:
   - File: `GuardTrackingApp/src/config/apiConfig.ts`
   - Ensure `LOCAL_IP = '192.168.1.12'` matches your computer's IP
   - Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

4. **Test from app**:
   - Make sure app is in dev mode (`__DEV__ = true`)
   - Try login/signup
   - Check console for API URL being used

## Troubleshooting Network Error

If you see "Network Error" when trying to login:

1. **Backend not running?**
   - Start: `cd backend && npm run dev:db`
   - Check: `http://localhost:3000/api/health`

2. **Wrong IP address?**
   - Update `LOCAL_IP` in `apiConfig.ts` to match your computer's IP
   - For Android Emulator: Use `10.0.2.2` instead

3. **Firewall blocking?**
   - Ensure port 3000 is not blocked
   - Check Windows Firewall settings

4. **Database connection issue?**
   - For PostgreSQL: Ensure PostgreSQL service is running
   - For SQLite: Ensure `prisma/dev.db` file exists

## Recommended: Use SQLite for Local Dev

SQLite is simpler for local development:
- No database server needed
- File-based (easy to reset)
- Faster setup
- Works offline

Switch to SQLite by following Option 2 above.


