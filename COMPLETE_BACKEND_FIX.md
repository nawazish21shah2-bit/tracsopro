# 🔧 Complete Backend Fix & Deployment Guide

## ❌ Problems Identified on DigitalOcean Server

### Error 1: `Unknown field 'user' on CompanyClient`
**Fixed in**: `incidentReportService.ts`

### Error 2: `Argument 'not' must not be null`
**Fixed in**: `clientService.ts`

### Error 3: `Unknown field 'profilePictureUrl' on User` (NEW)
**Cause**: Database schema is out of sync. The `profilePictureUrl` column was added to the User model but the server's database hasn't been migrated.

---

## 🚀 Complete Deployment Steps

### Step 1: Push Code Changes (on your local Windows machine)
```powershell
cd c:\learnings\tracsopro
git add .
git commit -m "fix: backend Prisma query errors and schema sync"
git push origin main
```

### Step 2: SSH into DigitalOcean
```bash
ssh root@143.110.198.38
```

### Step 3: Pull Latest Code
```bash
cd /root
git pull origin main
```

### Step 4: Sync Database Schema (IMPORTANT!)
```bash
# Generate Prisma client with latest schema
npx prisma generate

# Push schema changes to database (without losing data)
npx prisma db push

# Or if you want to create a proper migration:
# npx prisma migrate dev --name sync_schema
```

### Step 5: Rebuild TypeScript
```bash
npm run build
```

### Step 6: Restart PM2
```bash
pm2 restart guard-tracking-api --update-env
pm2 logs guard-tracking-api --lines 30
```

---

## 📋 Summary of All Code Fixes

| File | Issue | Fix |
|------|-------|-----|
| `incidentReportService.ts` | `user` on CompanyClient | Simplified include query |
| `clientService.ts:369` | `guardId: { not: null }` | Changed to `NOT: { guardId: null }` |
| `clientService.ts:445` | Same as above | Same fix |
| Database | `profilePictureUrl` missing | Run `npx prisma db push` |

---

## ⚠️ If Still Getting Schema Errors

Check the Prisma schema on the server matches your local one:
```bash
cat prisma/schema.prisma | head -50
```

Then force sync:
```bash
npx prisma db push --accept-data-loss
```
**Warning**: Only use `--accept-data-loss` if you're okay with potential data changes.

---

## ✅ Verification

After deployment, test with:
```bash
pm2 logs guard-tracking-api --lines 50
```

You should see clean logs without Prisma errors.

---
**Created**: January 12, 2026
