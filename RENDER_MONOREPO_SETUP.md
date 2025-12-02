# Render Deployment for Monorepo Structure

Your folder structure is **perfectly fine** for Render! Here's how to configure it:

```
Root/
├── backend/          ← Backend code here
└── GuardTrackingApp/ ← Mobile app (not deployed to Render)
```

---

## ✅ Render Configuration for Your Structure

### Step 1: Basic Settings

**Name:** `guard-tracking-backend` (or any name you like)

**Branch:** `main` (or your default branch)

**Region:** Choose closest to you (e.g., "Oregon (US West)")

---

### Step 2: Root Directory (IMPORTANT!)

**Root Directory:** `backend`

This tells Render to:
- Run all commands from the `backend` folder
- Only watch `backend` folder for changes (triggers auto-deploy)
- Ignore `GuardTrackingApp` folder

**Why this matters:**
- Without this, Render will look for `package.json` in root (won't find it)
- With this, Render looks in `backend/` folder ✅

---

### Step 3: Build Command

**Build Command:** `npm install && npm run build`

**What this does:**
1. Installs all dependencies from `backend/package.json`
2. Builds TypeScript to JavaScript (`npm run build`)

**Alternative if build fails:**
```
cd backend && npm install && npm run build
```
(But with Root Directory set, you don't need `cd backend`)

---

### Step 4: Start Command (REQUIRED)

**Start Command:** `npm start`

**What this does:**
- Runs `npm start` from `backend/package.json`
- Which runs: `node dist/server.js`

**Make sure your `backend/package.json` has:**
```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc -p tsconfig.json"
  }
}
```

---

### Step 5: Instance Type

**Select:** `Free` (for testing)

**Note:** Free instances:
- ✅ Work perfectly for testing
- ⚠️ Spin down after 15 min inactivity (wakes on request)
- ⚠️ First request after idle takes ~30 seconds

---

### Step 6: Environment Variables

Click **"+ Add Environment Variable"** and add:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<will-add-after-creating-database>
JWT_SECRET=<generate-below>
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=*
LOG_LEVEL=info
SOCKET_IO_ENABLED=true

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# OTP
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RATE_LIMIT_WINDOW=300000
OTP_RATE_LIMIT_MAX=3
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Note:** Add `DATABASE_URL` after creating PostgreSQL database (next step)

---

### Step 7: Create PostgreSQL Database

**Before clicking "Deploy":**

1. Go back to Render dashboard
2. Click **"New"** → **"PostgreSQL"**
3. Configure:
   - **Name:** `guard-tracking-db`
   - **Database:** `guardtracking`
   - **Region:** Same as web service
   - **Plan:** Free
4. Click **"Create Database"**
5. Wait for database to be created (~2 minutes)
6. Go to database → **"Connections"** tab
7. Copy **"Internal Database URL"** (starts with `postgresql://`)
8. Go back to your Web Service
9. Add environment variable:
   - **Name:** `DATABASE_URL`
   - **Value:** `<paste-internal-database-url>`

---

### Step 8: Deploy

1. Click **"Deploy Web Service"**
2. Wait for build (~5-10 minutes)
3. Check **"Logs"** tab for progress
4. Once deployed, you'll get a URL: `https://your-service.onrender.com`

---

## ✅ Complete Configuration Summary

| Setting | Value |
|---------|-------|
| **Name** | `guard-tracking-backend` |
| **Branch** | `main` |
| **Region** | `Oregon (US West)` (or closest) |
| **Root Directory** | `backend` ⭐ **IMPORTANT** |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` ⭐ **REQUIRED** |
| **Instance Type** | `Free` |

---

## 🔍 Verify Your Backend Structure

Make sure your `backend/package.json` has these scripts:

```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc -p tsconfig.json",
    "dev": "tsx watch src/server.ts",
    "dev:db": "tsx watch src/server-db.ts"
  }
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find package.json"

**Problem:** Root Directory not set correctly

**Solution:**
- Set **Root Directory** to: `backend`
- Make sure there's a `backend/package.json` file

### Issue 2: "Build failed"

**Problem:** Build command incorrect

**Solution:**
- Use: `npm install && npm run build`
- Check `backend/package.json` has `build` script
- Check TypeScript config exists: `backend/tsconfig.json`

### Issue 3: "Service won't start"

**Problem:** Start command incorrect

**Solution:**
- Use: `npm start`
- Verify `backend/package.json` has `start` script
- Check `dist/server.js` exists after build

### Issue 4: "Database connection error"

**Problem:** DATABASE_URL not set or incorrect

**Solution:**
- Use **Internal Database URL** (not external)
- Make sure database is created and running
- Verify DATABASE_URL is in environment variables

---

## 📋 Pre-Deployment Checklist

Before clicking "Deploy Web Service":

- [ ] Root Directory set to: `backend`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Instance Type: `Free` selected
- [ ] PostgreSQL database created
- [ ] DATABASE_URL added to environment variables
- [ ] JWT_SECRET generated and added
- [ ] All other environment variables added
- [ ] `backend/package.json` has `start` and `build` scripts
- [ ] `backend/tsconfig.json` exists

---

## 🚀 After Deployment

### 1. Test Health Endpoint

```bash
curl https://your-service.onrender.com/api/health
```

Should return: `{"status":"ok"}`

### 2. Run Database Migrations

**Option A: Via Render Shell**
1. Go to your Web Service
2. Click **"Shell"** tab
3. Run:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

**Option B: Add to Build Command**
Update Build Command to:
```
npm install && npm run build && npm run db:generate && npm run db:push
```

### 3. Update Mobile App

**File:** `GuardTrackingApp/src/config/apiConfig.ts`

```typescript
const PRODUCTION_API_URL = 'https://your-service.onrender.com/api';
const PRODUCTION_WS_URL = 'https://your-service.onrender.com';
```

### 4. Build APK

```bash
cd GuardTrackingApp/android
./gradlew assembleRelease
```

---

## 💡 Pro Tips

1. **Root Directory is Key:**
   - Always set to `backend` for your structure
   - This tells Render where your backend code is

2. **Watch Logs:**
   - Check **"Logs"** tab during deployment
   - Look for errors in build or start phase

3. **Database URL:**
   - Always use **Internal Database URL** for Render services
   - External URL is for connecting from outside Render

4. **Auto-Deploy:**
   - Render auto-deploys on git push to `main` branch
   - Only changes in `backend/` folder trigger deploy (because of Root Directory)

5. **Cold Starts:**
   - Free tier spins down after 15 min
   - First request takes ~30 seconds
   - Use [UptimeRobot](https://uptimerobot.com) (free) to ping every 5 min

---

## ✅ Your Structure is Perfect!

Your monorepo structure is **completely fine** for Render:

```
Root/
├── backend/          ← Render deploys this
│   ├── package.json  ← Render uses this
│   ├── src/
│   └── ...
└── GuardTrackingApp/ ← Ignored by Render (mobile app)
```

**Just remember:**
- Set **Root Directory** to `backend`
- Render will only deploy the backend
- Mobile app stays on your local machine (for building APK)

---

## 🎉 You're Ready!

With these settings, Render will:
1. ✅ Find your backend code in `backend/` folder
2. ✅ Install dependencies from `backend/package.json`
3. ✅ Build TypeScript to JavaScript
4. ✅ Start your server with `npm start`
5. ✅ Deploy successfully!

**Click "Deploy Web Service" and you're good to go!** 🚀



