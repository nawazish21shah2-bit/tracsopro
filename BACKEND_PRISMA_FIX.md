# 🔧 Backend Fix - Prisma Query Errors

## ❌ Problems Found

### Error 1: Unknown field `user` on CompanyClient
```
Unknown field `user` for include statement on model `CompanyClient`. 
Available options are marked with ?.
```
**Location**: `incidentReportService.ts:respondToReport()`

**Cause**: The `CompanyClient` model has `client` and `securityCompany` relations, NOT a `user` relation. The query was trying to include `user` which doesn't exist.

### Error 2: Argument `not` must not be null
```
Argument `not` must not be null.
```
**Location**: `clientService.ts:getClientGuards()`

**Cause**: Prisma doesn't accept `guardId: { not: null }`. The correct syntax is `NOT: { guardId: null }`.

## ✅ Fixes Applied

### Fix 1: Simplified respondToReport query
Removed the deep nesting that tried to include `user` on `CompanyClient`.

### Fix 2: Changed null-check syntax
Changed `guardId: { not: null }` → `NOT: { guardId: null }`

## 🚀 Deploy to DigitalOcean

### Step 1: SSH into your droplet
```bash
ssh root@143.110.198.38
```

### Step 2: Update the code
```bash
cd /root/guard-tracking-api  # or wherever your backend is

# Pull latest changes
git pull origin main
```

### Step 3: Rebuild if using TypeScript
```bash
npm run build
```

### Step 4: Restart PM2
```bash
pm2 restart guard-tracking-api --update-env
pm2 logs guard-tracking-api --lines 30
```

## 📋 Summary of Changes

| File | Line | Change |
|------|------|--------|
| `incidentReportService.ts` | ~500 | Simplified include query |
| `clientService.ts` | 369 | `NOT: { guardId: null }` |
| `clientService.ts` | 445 | `NOT: { guardId: null }` |

---
**Fixed**: January 12, 2026
