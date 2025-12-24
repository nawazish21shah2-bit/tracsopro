# Server Error Fix Instructions

## Issues Found

1. **Prisma Error**: `profilePictureUrl` field exists in schema but Prisma Client is out of sync
2. **TSX SyntaxError**: Corrupted node_modules (tsx package issue)

## Quick Fix (Run on Ubuntu Server)

```bash
# SSH into your server first
ssh root@your-server-ip

# Navigate to backend directory
cd /root/backend

# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install

# Regenerate Prisma Client (THIS FIXES THE profilePictureUrl ERROR)
npx prisma generate

# Restart PM2 process
pm2 restart guard-tracking-api

# Check logs to verify it's working
pm2 logs guard-tracking-api --lines 50
```

## What This Does

1. **Removes corrupted dependencies** - Fixes the tsx SyntaxError
2. **Reinstalls clean dependencies** - Gets fresh packages
3. **Regenerates Prisma Client** - Syncs Prisma Client with schema (FIXES profilePictureUrl error)
4. **Restarts the API** - Applies the fixes

## Alternative: Using the Fix Script

I've created `fix-prisma-errors.sh` in the backend directory. You can use it:

```bash
cd /root/backend
chmod +x fix-prisma-errors.sh
./fix-prisma-errors.sh
```

## Verification

After running the fix, check the logs:

```bash
pm2 logs guard-tracking-api --lines 30
```

You should see:
- ✅ No more "Unknown field `profilePictureUrl`" errors
- ✅ No more tsx SyntaxError
- ✅ Server starting successfully

## Note

The `profilePictureUrl` field **DOES exist** in your Prisma schema (line 20 of schema.prisma), but the Prisma Client on the server is outdated. Running `npx prisma generate` will sync the client with the schema.



