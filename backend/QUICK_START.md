# Quick Start - Local Development

## ✅ Setup Complete!

Your environment has been configured for local development:

- ✅ **Frontend**: Configured to use local backend at `http://192.168.1.12:3000/api`
- ✅ **Backend**: `.env` updated with `NODE_ENV=development` and SQLite database
- ✅ **Database**: Schema updated to use SQLite for local development

## Next Steps

### 1. Setup Database
```bash
cd backend
npm run db:setup
```

This will:
- Create SQLite database (`prisma/dev.db`)
- Generate Prisma client
- Seed test data

### 2. Start Backend Server
```bash
npm run dev:db
```

Server will start on `http://localhost:3000` (accessible at `http://192.168.1.12:3000`)

### 3. Verify Setup
- Check health: `http://localhost:3000/api/health`
- Check logs: Should see `🚀 Server running on http://0.0.0.0:3000`
- Check environment: Should see `📊 Environment: development`

### 4. Test from App
- Make sure app is running in dev mode
- Try login/signup
- Check console for API calls

## Configuration Summary

**Frontend (`GuardTrackingApp/src/config/apiConfig.ts`):**
- Dev mode uses: `http://192.168.1.12:3000/api`
- Production uses: `https://tracsopro.onrender.com/api`

**Backend (`backend/.env`):**
- `NODE_ENV=development`
- `DATABASE_URL="file:./prisma/dev.db"` (SQLite)
- `PORT=3000`

**Database:**
- Local: SQLite file at `backend/prisma/dev.db`
- Production: PostgreSQL (update schema and DATABASE_URL for production)

## Troubleshooting

### Network Error
- ✅ Backend running? Check `http://localhost:3000/api/health`
- ✅ Correct IP? Update `LOCAL_IP` in `apiConfig.ts` if needed
- ✅ Firewall? Ensure port 3000 is open

### Database Error
- Run: `npm run db:push` to create/update database
- Run: `npm run db:seed` to add test data

### Still Having Issues?
See `LOCAL_DEV_SETUP.md` for detailed troubleshooting.


