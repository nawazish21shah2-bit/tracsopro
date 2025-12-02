# Free Deployment Options for Guard Tracking Backend

This guide covers **100% FREE** options to deploy your backend and test with phones on different networks.

---

## 🎯 Best Free Options (Recommended)

### Option 1: Railway (BEST - Easiest Setup) ⭐

**Free Tier:**
- $5 free credit monthly (enough for small apps)
- PostgreSQL database included
- Automatic deployments
- WebSocket support ✅
- No credit card required initially

**Setup Time:** 5-10 minutes

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (free)
3. Click "New Project" → "Deploy from GitHub repo"
4. Railway auto-detects Node.js
5. Click "New" → "Database" → "PostgreSQL" (free tier)
6. Add environment variables
7. Deploy!

**Your URL:** `https://your-app.up.railway.app`

**Why it's best:**
- ✅ Easiest setup
- ✅ WebSocket works perfectly
- ✅ Database included
- ✅ Auto-deploys on git push
- ✅ Free tier is generous

---

### Option 2: Render (100% Free Forever)

**Free Tier:**
- 750 hours/month free (enough for 24/7)
- PostgreSQL database (free tier)
- WebSocket support ✅
- Spins down after 15 min inactivity (wakes on request)

**Setup Time:** 10-15 minutes

**Steps:**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (free)
3. "New" → "Web Service"
4. Connect GitHub repo
5. Configure:
   - Build: `cd backend && npm install && npm run build`
   - Start: `cd backend && npm start`
6. "New" → "PostgreSQL" (free tier)
7. Add environment variables
8. Deploy!

**Your URL:** `https://your-app.onrender.com`

**Note:** First request after inactivity takes ~30 seconds (cold start)

**Why it's good:**
- ✅ 100% free forever
- ✅ WebSocket support
- ✅ Database included
- ⚠️ Cold starts (but free!)

---

### Option 3: Fly.io (Free Tier)

**Free Tier:**
- 3 shared VMs free
- 3GB storage
- 160GB outbound data/month
- PostgreSQL available
- WebSocket support ✅

**Setup Time:** 15-20 minutes

**Steps:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Sign up: `fly auth signup`
3. In backend folder: `fly launch`
4. Follow prompts
5. Add PostgreSQL: `fly postgres create`
6. Deploy: `fly deploy`

**Why it's good:**
- ✅ Good free tier
- ✅ Fast (no cold starts)
- ✅ WebSocket support
- ⚠️ More setup required

---

## ❌ Why Vercel is NOT Recommended

**Vercel Limitations:**
- ❌ Designed for serverless functions, not long-running servers
- ❌ WebSocket support is limited/complex
- ❌ Database connections can timeout
- ❌ 10-second function timeout on free tier
- ❌ Not ideal for real-time features

**Vercel CAN work IF:**
- You convert to serverless functions
- You use external WebSocket service (Pusher, Ably)
- You use external database (Supabase, PlanetScale)
- You accept limitations

**Verdict:** Not worth it for this app. Use Railway or Render instead.

---

## 🚀 Recommended: Railway (Free Setup)

### Step-by-Step Railway Deployment

#### 1. Create Account
```
1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (free, no credit card needed)
```

#### 2. Deploy Backend
```
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Node.js
5. Click on the service to configure
```

#### 3. Add PostgreSQL Database
```
1. In your project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway creates database automatically
4. Click on database service
5. Copy the "DATABASE_URL" (you'll need this)
```

#### 4. Configure Environment Variables

In your backend service, go to "Variables" tab and add:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<paste-from-database-service>
JWT_SECRET=<generate-below>
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=*
LOG_LEVEL=info
SOCKET_IO_ENABLED=true

# Email (use your Gmail)
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

#### 5. Configure Build Settings

Railway auto-detects, but verify:
- **Root Directory:** `backend` (if your backend is in a subfolder)
- **Build Command:** (auto-detected)
- **Start Command:** `npm start`

#### 6. Deploy

Railway automatically deploys when you:
- Push to GitHub
- Or click "Deploy" button

#### 7. Get Your URL

1. Click on your service
2. Go to "Settings" → "Networking"
3. Click "Generate Domain"
4. Copy the URL: `https://your-app-name.up.railway.app`

#### 8. Run Database Migrations

In Railway dashboard:
1. Go to your backend service
2. Click "Deployments" → "Latest"
3. Click "View Logs"
4. Or use Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migrations
railway run npm run db:migrate

# Seed database (optional)
railway run npm run db:seed
```

---

## 📱 Configure Mobile App

### Update Production URLs

**File:** `GuardTrackingApp/src/config/apiConfig.ts`

```typescript
// Replace with your Railway URL
const PRODUCTION_API_URL = 'https://your-app-name.up.railway.app/api';
const PRODUCTION_WS_URL = 'https://your-app-name.up.railway.app';
```

**That's it!** All services use this automatically.

---

## 🔨 Build & Install APK

### 1. Build APK

```bash
cd GuardTrackingApp/android
./gradlew assembleRelease
```

### 2. Install on Phones

**Method 1: USB**
```bash
adb install app/build/outputs/apk/release/app-release.apk
```

**Method 2: Cloud Storage**
1. Upload APK to Google Drive
2. Share link
3. Download on phone
4. Install

---

## ✅ Test Your Deployment

### 1. Test Backend Health

```bash
curl https://your-app-name.up.railway.app/api/health
```

Should return: `{"status":"ok"}`

### 2. Test from Phone Browser

Open on phone:
```
https://your-app-name.up.railway.app/api/health
```

### 3. Test from App

1. Install APK on phone
2. Open app
3. Register/Login
4. Start shift
5. Walk around
6. Check Railway logs for location updates

---

## 💰 Free Tier Limits

### Railway Free Tier
- $5 credit/month
- Enough for:
  - Small backend (runs 24/7)
  - PostgreSQL database
  - ~1000 requests/day
- **No credit card required** (initially)

### Render Free Tier
- 750 hours/month (enough for 24/7)
- PostgreSQL (free tier)
- **100% free forever**
- Spins down after 15 min (wakes on request)

### Fly.io Free Tier
- 3 shared VMs
- 3GB storage
- 160GB data/month
- **100% free**

---

## 🎯 Quick Comparison

| Feature | Railway | Render | Fly.io |
|---------|---------|--------|--------|
| **Free Tier** | $5/month credit | 750 hrs/month | 3 VMs |
| **Setup Time** | 5 min | 10 min | 15 min |
| **WebSocket** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Database** | ✅ Included | ✅ Included | ✅ Available |
| **Cold Starts** | ❌ No | ⚠️ Yes (15min) | ❌ No |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Best For** | Quick setup | Free forever | Performance |

---

## 🏆 My Recommendation

**Use Railway** because:
1. ✅ Easiest setup (5 minutes)
2. ✅ $5 free credit is generous
3. ✅ No cold starts
4. ✅ WebSocket works perfectly
5. ✅ Database included
6. ✅ Auto-deploys on git push

**If you want 100% free forever:** Use Render (just accept cold starts)

---

## 🚀 Quick Start (Railway)

```bash
# 1. Go to railway.app and sign up
# 2. Deploy from GitHub
# 3. Add PostgreSQL database
# 4. Add environment variables
# 5. Get your URL
# 6. Update apiConfig.ts with your URL
# 7. Build APK
# 8. Install on phones
# 9. Test!
```

**Total time: 10-15 minutes**

---

## 🐛 Troubleshooting

### Railway Issues

**Problem:** Service won't start
- Check logs in Railway dashboard
- Verify DATABASE_URL is correct
- Check environment variables

**Problem:** Can't connect from phone
- Verify URL uses `https://`
- Check CORS_ORIGIN is set to `*`
- Test health endpoint from phone browser

### Render Issues

**Problem:** Cold start delay
- Normal for free tier
- First request takes ~30 seconds
- Subsequent requests are fast

**Problem:** Service stops
- Free tier spins down after 15 min
- Wakes automatically on next request

---

## 📝 Next Steps

1. ✅ Choose Railway (recommended) or Render
2. ✅ Deploy backend (follow steps above)
3. ✅ Update `apiConfig.ts` with your URL
4. ✅ Build APK
5. ✅ Install on phones
6. ✅ Test from different networks

---

## 🎉 You're All Set!

With Railway's free tier, you can:
- ✅ Deploy backend for free
- ✅ Get PostgreSQL database
- ✅ Test with phones on any network
- ✅ No credit card needed (initially)

**Start here:** [railway.app](https://railway.app)

---

**Note:** If you exceed Railway's free tier, you'll get a notification. You can:
- Optimize your app
- Switch to Render (100% free)
- Or pay $5/month (very affordable)

But for testing, the free tier is more than enough! 🚀



