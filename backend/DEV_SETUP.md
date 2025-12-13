# Local Development Setup Guide

## Quick Setup for Local Backend and Database

### Step 1: Configure Environment Variables

The backend needs a `.env` file in the `backend/` directory. For local development with SQLite:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=dev-secret-change-me-in-production
```

**To set this up automatically, run:**
```bash
cd backend
node setup-local-dev.js
```

Or manually create/update `backend/.env` with the configuration above.

### Step 2: Update Prisma Schema for SQLite (Optional)

If you want to use SQLite for local development (simpler, no PostgreSQL needed), update `backend/prisma/schema.prisma`:

Change:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

To:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**Note:** If you prefer to use local PostgreSQL, keep the schema as-is and ensure PostgreSQL is running locally.

### Step 3: Setup Database

```bash
cd backend
npm run db:setup
```

This will:
- Create/update the database
- Generate Prisma client
- Seed test data

### Step 4: Start Backend Server

```bash
npm run dev:db
```

The server will start on `http://localhost:3000` (or `http://0.0.0.0:3000` for network access).

### Step 5: Verify Frontend Configuration

Make sure `GuardTrackingApp/src/config/apiConfig.ts` has your local IP:

```typescript
const LOCAL_IP = '192.168.1.12'; // ⚠️ CHANGE THIS TO YOUR ACTUAL IP ADDRESS
```

Find your IP with:
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` or `ip addr`

### Step 6: Test Connection

1. Start the backend: `cd backend && npm run dev:db`
2. Check health: `http://localhost:3000/api/health`
3. Test from app: Try logging in or signing up

## Troubleshooting

### Network Error
- **Check backend is running**: `http://localhost:3000/api/health`
- **Check IP address**: Make sure `LOCAL_IP` in `apiConfig.ts` matches your computer's IP
- **Check firewall**: Ensure port 3000 is not blocked
- **For Android Emulator**: Use `10.0.2.2` instead of your IP

### Database Connection Error
- **SQLite**: Make sure `DATABASE_URL="file:./prisma/dev.db"` in `.env`
- **PostgreSQL**: Ensure PostgreSQL is running and connection string is correct
- **Run migrations**: `npm run db:push` or `npm run db:migrate`

### Environment Variables Not Loading
- Make sure `.env` file is in `backend/` directory
- Restart the server after changing `.env`
- Check `NODE_ENV=development` is set

## Development vs Production

- **Development**: Uses local backend (`http://192.168.1.12:3000`) and local database (SQLite or local PostgreSQL)
- **Production**: Uses production backend (`https://tracsopro.onrender.com`) and production database

The app automatically detects dev mode using `__DEV__` flag in React Native.


