# Render Deployment - Quick Start Guide

Complete guide to deploy your Guard Tracking App backend to Render.

## 🚀 Quick Setup Steps

### 1. Sign Up for Render
1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with GitHub (no credit card required!)

### 2. Create PostgreSQL Database
1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Name: `guard-tracking-db`
3. Plan: **Free**
4. Region: Choose closest to you
5. Click **"Create Database"**
6. **Copy the Internal Database URL** (you'll need this)

### 3. Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:

**Basic Settings:**
- **Name:** `guard-tracking-backend`
- **Region:** Choose closest to you
- **Branch:** `main` (or your default branch)
- **Root Directory:** `backend` ⭐ **IMPORTANT!**

**Build & Deploy:**
- **Build Command:** `npm install && npx prisma generate`
- **Start Command:** `npm start`
- **Instance Type:** `Free`

**Note:** We're using `tsx` for production (no TypeScript compilation needed), so the build command just installs dependencies and generates Prisma client.

### 4. Add Environment Variables

In your Web Service → **"Environment"** tab, add:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<paste-internal-database-url-from-step-2>
JWT_SECRET=<generate-below>
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=*
LOG_LEVEL=info
SOCKET_IO_ENABLED=true

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# OTP Configuration
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

### 5. Link Database to Service
1. In your Web Service → **"Environment"** tab
2. Click **"Link Resource"**
3. Select your PostgreSQL database
4. `DATABASE_URL` will be auto-added! ✅

### 6. Deploy
1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Wait 5-10 minutes for first deployment
3. Check **"Logs"** tab for progress

### 7. Run Database Migrations
1. Go to Web Service → **"Shell"** tab
2. Run:
```bash
npx prisma generate
npx prisma db push
```

### 8. Get Your URL
Your app will be at: `https://your-app-name.onrender.com`

Test it: `https://your-app-name.onrender.com/api/health`

## 📱 Update Mobile App

After deployment, update `GuardTrackingApp/src/config/apiConfig.ts`:

```typescript
const PRODUCTION_API_URL = 'https://your-app-name.onrender.com/api';
const PRODUCTION_WS_URL = 'https://your-app-name.onrender.com';
```

Replace `your-app-name` with your actual Render service name.

## ✅ Checklist

- [ ] Render account created
- [ ] PostgreSQL database created
- [ ] Web Service created
- [ ] Root Directory set to: `backend`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Database linked to service
- [ ] Environment variables added
- [ ] Service deployed
- [ ] Health endpoint works: `/api/health`
- [ ] Database migrations run
- [ ] Mobile app updated with Render URL

## 🎉 Done!

Your backend is now live on Render!

**Next:** Build your Android APK and test it!

---

**See:** `RENDER_MONOREPO_SETUP.md` for more detailed instructions.

