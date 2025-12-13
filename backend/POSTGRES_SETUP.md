# PostgreSQL Local Development Setup

## Configuration

Your backend is now configured to use **PostgreSQL** for local development.

### Current Settings

**`backend/.env`:**
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/guard_tracking?schema=public
JWT_SECRET=dev-secret-change-me-in-production
```

**`backend/prisma/schema.prisma`:**
- Provider: `postgresql`

## Prerequisites

Make sure PostgreSQL is installed and running:

1. **Check if PostgreSQL is running:**
   ```bash
   # Windows (PowerShell)
   Get-Service -Name postgresql*
   
   # Or check if port 5432 is listening
   netstat -an | findstr 5432
   ```

2. **Start PostgreSQL if not running:**
   ```bash
   # Windows
   net start postgresql-x64-XX  # Replace XX with your version
   ```

## Setup Database

### Step 1: Create Database (if not exists)

Connect to PostgreSQL and create the database:

```bash
# Using psql command line
psql -U postgres

# Then in psql:
CREATE DATABASE guard_tracking;
\q
```

Or using a GUI tool like pgAdmin:
- Create new database: `guard_tracking`
- Owner: `postgres`

### Step 2: Update Connection String (if needed)

If your PostgreSQL credentials are different, update `backend/.env`:

```env
# Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/guard_tracking?schema=public
```

**Common variations:**
- Different password: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/guard_tracking?schema=public`
- Different port: `postgresql://postgres:postgres@localhost:5433/guard_tracking?schema=public`
- Different user: `postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/guard_tracking?schema=public`

### Step 3: Run Database Setup

```bash
cd backend

# Push schema to database (creates tables)
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed test data
npm run db:seed
```

### Step 4: Start Backend Server

```bash
npm run dev:db
```

You should see:
```
🚀 Server running on http://0.0.0.0:3000
📊 Environment: development
✅ Database connected successfully
```

## Verify Connection

### Test Database Connection

```bash
cd backend
npx prisma db pull  # This will fail if connection is wrong
```

### Test from Backend

Check health endpoint:
```bash
curl http://localhost:3000/api/health
```

Or open in browser: `http://localhost:3000/api/health`

## Troubleshooting

### "Connection refused" or "Cannot connect to database"

1. **PostgreSQL not running:**
   ```bash
   # Check service status
   Get-Service -Name postgresql*
   
   # Start service
   net start postgresql-x64-XX
   ```

2. **Wrong credentials:**
   - Check username/password in `.env`
   - Test connection: `psql -U postgres -d guard_tracking`

3. **Database doesn't exist:**
   ```sql
   CREATE DATABASE guard_tracking;
   ```

4. **Wrong port:**
   - Default PostgreSQL port is `5432`
   - Check: `netstat -an | findstr 5432`

### "Database does not exist"

Create the database:
```sql
CREATE DATABASE guard_tracking;
```

### "Authentication failed"

1. Check PostgreSQL password
2. Update `.env` with correct password
3. Or reset PostgreSQL password if needed

### "Schema 'public' does not exist"

This usually means the database is new. Run:
```bash
npm run db:push
```

## Frontend Configuration

The frontend is already configured to use local backend:
- **File**: `GuardTrackingApp/src/config/apiConfig.ts`
- **Local IP**: `192.168.1.12` (update if your IP is different)
- **Dev URL**: `http://192.168.1.12:3000/api`

## Summary

✅ **Backend**: Uses local PostgreSQL at `localhost:5432`  
✅ **Database**: `guard_tracking`  
✅ **Environment**: `development`  
✅ **Frontend**: Connects to `http://192.168.1.12:3000/api`  

Your setup is ready for local development with PostgreSQL!


