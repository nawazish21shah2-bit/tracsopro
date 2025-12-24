# Fix Prisma Errors on Ubuntu Server

## ⚠️ IMPORTANT: Run these commands ON YOUR UBUNTU SERVER, not Windows!

You must SSH into your server first.

---

## Step 1: Connect to Your Server

```bash
ssh root@your-server-ip
# or
ssh root@ubuntu-s-1vcpu-1gb-sfo2-01
```

---

## Step 2: Navigate to Backend Directory

```bash
cd /root/backend
```

---

## Step 3: Fix Prisma and Dependency Errors

Run these commands **ON THE SERVER**:

```bash
# Remove corrupted dependencies
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall dependencies (fixes tsx SyntaxError)
npm install

# Regenerate Prisma Client (FIXES profilePictureUrl error)
npx prisma generate

# Restart the API
pm2 restart guard-tracking-api
```

---

## Step 4: Verify the Fix

```bash
# Check logs
pm2 logs guard-tracking-api --lines 50
```

You should see:
- ✅ No more "Unknown field `profilePictureUrl`" errors
- ✅ No more tsx SyntaxError
- ✅ Server starting successfully

---

## Alternative: Use the Fix Script

If the script is on the server:

```bash
cd /root/backend
chmod +x fix-prisma-errors.sh
./fix-prisma-errors.sh
```

---

## What These Commands Do

1. **`rm -rf node_modules package-lock.json`** - Removes corrupted dependencies
2. **`npm cache clean --force`** - Clears npm cache
3. **`npm install`** - Reinstalls all dependencies (fixes tsx error)
4. **`npx prisma generate`** - Regenerates Prisma Client from schema (fixes profilePictureUrl error)
5. **`pm2 restart guard-tracking-api`** - Restarts your API with the fixes

---

## Why This Works

- **Prisma Error**: The `profilePictureUrl` field EXISTS in your schema (line 20 of schema.prisma), but the Prisma Client was outdated. Running `npx prisma generate` syncs the client with the schema.

- **TSX Error**: The tsx package was corrupted in node_modules. Reinstalling dependencies gets a fresh copy.

---

## Notes

- **PM2 is only on Linux/Ubuntu**, not Windows. That's why it doesn't work in PowerShell.
- Run these commands via SSH on your Ubuntu server.
- The server IP should be in your SSH config or you can find it in your hosting provider's dashboard.



