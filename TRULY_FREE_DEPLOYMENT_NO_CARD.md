# Truly Free Deployment Options (No Credit Card Required)

Here are **100% FREE** options that don't require payment details:

---

## 🏆 Option 1: Render (BEST - No Credit Card Needed) ⭐

**Why it's best:**
- ✅ **100% free forever**
- ✅ **No credit card required**
- ✅ **PostgreSQL database included**
- ✅ **WebSocket support**
- ✅ **Easy setup**

**Limitations:**
- ⚠️ Spins down after 15 min inactivity (wakes on request)
- ⚠️ First request after idle takes ~30 seconds

**Setup:**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (no credit card)
3. Create Web Service
4. Create PostgreSQL database (free)
5. Deploy!

**Your URL:** `https://your-app.onrender.com`

**See:** `RENDER_MONOREPO_SETUP.md` for detailed steps

---

## 🚀 Option 2: Cyclic (No Credit Card)

**Why it's good:**
- ✅ **Free tier available**
- ✅ **No credit card required**
- ✅ **Auto-deploys from GitHub**
- ✅ **PostgreSQL available**

**Limitations:**
- ⚠️ Limited resources on free tier
- ⚠️ May have cold starts

**Setup:**
1. Go to [cyclic.sh](https://cyclic.sh)
2. Sign up with GitHub
3. Connect repository
4. Auto-detects and deploys
5. Add PostgreSQL addon (free tier)

**Your URL:** `https://your-app.cyclic.app`

---

## ☁️ Option 3: Koyeb (No Credit Card)

**Why it's good:**
- ✅ **Free tier available**
- ✅ **No credit card required**
- ✅ **Fast deployments**
- ✅ **PostgreSQL available**

**Limitations:**
- ⚠️ Limited resources
- ⚠️ May require verification

**Setup:**
1. Go to [koyeb.com](https://koyeb.com)
2. Sign up (no credit card)
3. Create app from GitHub
4. Add PostgreSQL service
5. Deploy!

**Your URL:** `https://your-app.koyeb.app`

---

## 🗄️ Option 4: Supabase (Database Only) + Free Hosting

**Why it's good:**
- ✅ **Free PostgreSQL database**
- ✅ **No credit card required**
- ✅ **Generous free tier**
- ✅ **Real-time features**

**Setup:**
1. Go to [supabase.com](https://supabase.com)
2. Sign up (no credit card)
3. Create project
4. Get database URL
5. Deploy backend to Render/Cyclic/Koyeb
6. Connect to Supabase database

**Database URL:** `postgresql://...@db.supabase.co:5432/postgres`

**Combine with:**
- Render (for backend hosting)
- Cyclic (for backend hosting)
- Koyeb (for backend hosting)

---

## 🎯 Option 5: MongoDB Atlas (Database) + Free Hosting

**Why it's good:**
- ✅ **Free MongoDB database**
- ✅ **No credit card required**
- ✅ **512MB free storage**

**Note:** Your app uses PostgreSQL, but you could:
1. Use MongoDB Atlas for free database
2. Deploy backend to Render/Cyclic
3. Connect backend to MongoDB

**Setup:**
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up (no credit card)
3. Create free cluster
4. Get connection string
5. Update backend to use MongoDB (or keep PostgreSQL)

---

## 📊 Comparison Table

| Platform | Free Tier | Credit Card | Database | WebSocket | Best For |
|----------|-----------|-------------|----------|-----------|----------|
| **Render** | ✅ Yes | ❌ No | ✅ PostgreSQL | ✅ Yes | **Best overall** |
| **Cyclic** | ✅ Yes | ❌ No | ✅ PostgreSQL | ✅ Yes | Quick setup |
| **Koyeb** | ✅ Yes | ❌ No | ✅ PostgreSQL | ✅ Yes | Fast performance |
| **Supabase** | ✅ Yes | ❌ No | ✅ PostgreSQL | ✅ Yes | Database only |
| **MongoDB Atlas** | ✅ Yes | ❌ No | ✅ MongoDB | N/A | Alternative DB |

---

## 🎯 My Recommendation: Render

**Why Render:**
1. ✅ **100% free forever**
2. ✅ **No credit card needed**
3. ✅ **PostgreSQL included**
4. ✅ **WebSocket works**
5. ✅ **Easy setup**
6. ✅ **Most reliable**

**Only downside:** Cold starts (~30s after 15 min idle)

**Solution:** Use [UptimeRobot](https://uptimerobot.com) (free) to ping every 5 minutes

---

## 🚀 Quick Setup: Render (Recommended)

### Step 1: Sign Up
1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with GitHub
4. **No credit card required!**

### Step 2: Create Web Service
1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `guard-tracking-backend`
   - **Root Directory:** `backend` ⭐
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

### Step 3: Create PostgreSQL
1. Click **"New"** → **"PostgreSQL"**
2. Name: `guard-tracking-db`
3. Plan: `Free`
4. Create!

### Step 4: Link Database
1. Go to your Web Service
2. **"Environment"** tab
3. Click **"Link Resource"**
4. Select your PostgreSQL database
5. `DATABASE_URL` is auto-added!

### Step 5: Add Environment Variables
In Web Service → **"Environment"** tab:

```env
NODE_ENV=production
PORT=3000
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

### Step 6: Deploy
1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Wait ~5-10 minutes
3. Check **"Logs"** tab

### Step 7: Run Migrations
1. Go to Web Service → **"Shell"** tab
2. Run:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

### Step 8: Get Your URL
Your app will be at: `https://your-service.onrender.com`

---

## 🔧 Prevent Cold Starts (Optional)

**Use UptimeRobot (Free):**
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up (free)
3. Add monitor:
   - URL: `https://your-service.onrender.com/api/health`
   - Interval: 5 minutes
4. This keeps your app awake!

---

## 📱 Update Mobile App

**File:** `GuardTrackingApp/src/config/apiConfig.ts`

```typescript
const PRODUCTION_API_URL = 'https://your-service.onrender.com/api';
const PRODUCTION_WS_URL = 'https://your-service.onrender.com';
```

---

## ✅ Render Deployment Checklist

- [ ] Render account created (no credit card)
- [ ] Web Service created
- [ ] Root Directory set to: `backend`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] PostgreSQL database created
- [ ] Database linked to service
- [ ] Environment variables added
- [ ] Service deployed
- [ ] Health endpoint works: `/api/health`
- [ ] Database migrations run
- [ ] Mobile app updated with Render URL

---

## 🎯 Alternative: Cyclic Setup

### Step 1: Sign Up
1. Go to [cyclic.sh](https://cyclic.sh)
2. Sign up with GitHub
3. **No credit card required!**

### Step 2: Deploy
1. Click **"Deploy Now"**
2. Connect GitHub repository
3. Cyclic auto-detects Node.js
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

### Step 3: Add Database
1. Go to **"Addons"**
2. Add **PostgreSQL** (free tier)
3. Database URL auto-added!

### Step 4: Set Environment Variables
Same as Render (see above)

---

## 🎯 Alternative: Koyeb Setup

### Step 1: Sign Up
1. Go to [koyeb.com](https://koyeb.com)
2. Sign up (no credit card)
3. Verify email

### Step 2: Deploy
1. Click **"Create App"**
2. Connect GitHub
3. Select repository
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

### Step 3: Add Database
1. Go to **"Services"**
2. Add **PostgreSQL** service
3. Link to your app

---

## 💡 Pro Tips

1. **Render is Best:**
   - Most reliable free option
   - No credit card needed
   - PostgreSQL included
   - Just accept cold starts

2. **Prevent Cold Starts:**
   - Use UptimeRobot to ping every 5 min
   - Keeps app awake
   - Free forever

3. **Database Options:**
   - Use Render's PostgreSQL (easiest)
   - Or Supabase PostgreSQL (more features)
   - Both are free, no credit card

4. **Testing:**
   - Cold start is only first request after idle
   - Subsequent requests are fast
   - Good enough for testing!

---

## 🎉 Summary

**Best Option: Render**
- ✅ 100% free
- ✅ No credit card
- ✅ PostgreSQL included
- ✅ WebSocket works
- ✅ Easy setup

**Setup Time:** 15-20 minutes

**Your URL:** `https://your-app.onrender.com`

**Next Steps:**
1. Sign up at [render.com](https://render.com)
2. Follow setup steps above
3. Deploy!
4. Update mobile app
5. Test from phones!

---

## 🆘 Need Help?

If you encounter issues:
1. Check Render logs
2. Verify environment variables
3. Test health endpoint
4. Check database connection
5. Review `RENDER_MONOREPO_SETUP.md`

**You can deploy for FREE without any credit card!** 🚀



