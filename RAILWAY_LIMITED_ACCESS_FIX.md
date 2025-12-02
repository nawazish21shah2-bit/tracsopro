# Railway Limited Access - Solutions

You're seeing "Limited Access" because Railway's free trial sometimes restricts new accounts to only databases. Here are solutions:

---

## 🚀 Solution 1: Use Render (100% Free - Recommended)

Render is **100% free forever** and doesn't have these restrictions. Let's use Render instead!

### Step-by-Step Render Deployment

#### 1. Create Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (free, no credit card needed)
3. Verify your email

#### 2. Create Web Service
1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your repository
4. Configure:
   - **Name:** `guard-tracking-backend` (or any name)
   - **Environment:** `Node`
   - **Region:** Choose closest to you
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `backend` (if backend is in a subfolder)
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

#### 3. Add PostgreSQL Database
1. Click **"New"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `guard-tracking-db`
   - **Database:** `guardtracking` (or any name)
   - **User:** (auto-generated)
   - **Region:** Same as web service
   - **Plan:** Free (750 hours/month)
3. Click **"Create Database"**
4. Wait for database to be created (~2 minutes)
5. Copy the **Internal Database URL** (starts with `postgresql://`)

#### 4. Configure Environment Variables

In your **Web Service**, go to **"Environment"** tab and add:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<paste-internal-database-url-from-step-3>
JWT_SECRET=<generate-below>
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=*
LOG_LEVEL=info
SOCKET_IO_ENABLED=true

# Email Configuration
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

#### 5. Link Database to Web Service

1. In your **Web Service**, go to **"Environment"** tab
2. Click **"Link Resource"** or **"Add Environment Variable"**
3. Select your PostgreSQL database
4. Render will automatically add `DATABASE_URL`

#### 6. Deploy

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Wait for build to complete (~5-10 minutes)
3. Check logs for any errors

#### 7. Get Your URL

1. Once deployed, Render assigns a URL automatically
2. Your URL will be: `https://your-service-name.onrender.com`
3. Test it: `https://your-service-name.onrender.com/api/health`

#### 8. Run Database Migrations

**Option A: Via Render Shell**
1. Go to your Web Service
2. Click **"Shell"** tab
3. Run:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

**Option B: Via Render Dashboard**
1. Go to your Web Service → **"Events"** tab
2. Look for build logs
3. Or add to build command:
   ```
   npm install && npm run build && npm run db:generate && npm run db:push
   ```

---

## 🔧 Solution 2: Fix Railway Limited Access

If you want to stick with Railway, try these:

### Option A: Verify Account
1. Go to Railway dashboard
2. Check if account needs verification
3. Complete any required steps

### Option B: Contact Railway Support
1. Click on your profile → **"Support"**
2. Explain you have $5 credit but seeing limited access
3. Ask to enable full deployment access

### Option C: Create New Account
Sometimes new accounts have restrictions. Try:
1. Create new Railway account with different email
2. Or wait 24-48 hours (restrictions sometimes auto-lift)

### Option D: Upgrade Temporarily
1. Add payment method (you won't be charged if you stay within free tier)
2. This usually removes restrictions
3. You can remove payment method later

---

## 📊 Render vs Railway Comparison

| Feature | Render (Free) | Railway (Free) |
|---------|---------------|----------------|
| **Cost** | 100% Free Forever | $5 credit/month |
| **Restrictions** | None | Limited access on new accounts |
| **Setup Time** | 10-15 min | 5 min (if no restrictions) |
| **Cold Starts** | ~30s after 15min idle | None |
| **WebSocket** | ✅ Yes | ✅ Yes |
| **Database** | ✅ Free PostgreSQL | ✅ Free PostgreSQL |
| **Best For** | Free forever | Quick setup (if working) |

---

## 🎯 My Recommendation

**Use Render** because:
1. ✅ 100% free forever
2. ✅ No restrictions
3. ✅ Works immediately
4. ✅ Same features as Railway
5. ✅ Just accept ~30s cold start (first request after idle)

---

## 📱 After Deployment (Render)

### 1. Update Mobile App

**File:** `GuardTrackingApp/src/config/apiConfig.ts`

```typescript
const PRODUCTION_API_URL = 'https://your-service-name.onrender.com/api';
const PRODUCTION_WS_URL = 'https://your-service-name.onrender.com';
```

### 2. Build APK

```bash
cd GuardTrackingApp/android
./gradlew assembleRelease
```

### 3. Install on Phones

APK location: `GuardTrackingApp/android/app/build/outputs/apk/release/app-release.apk`

---

## ✅ Render Deployment Checklist

- [ ] Render account created
- [ ] Web Service created
- [ ] PostgreSQL database created
- [ ] Environment variables added
- [ ] Database linked to service
- [ ] Service deployed successfully
- [ ] Health endpoint works: `/api/health`
- [ ] Database migrations run
- [ ] Mobile app updated with Render URL
- [ ] APK built and tested

---

## 🐛 Render Troubleshooting

### Problem: Build Fails

**Solution:**
- Check build logs in Render dashboard
- Verify `package.json` has correct scripts
- Ensure `backend` folder structure is correct

### Problem: Service Won't Start

**Solution:**
- Check start command: `npm start`
- Verify `dist/server.js` exists after build
- Check environment variables are set

### Problem: Database Connection Error

**Solution:**
- Use **Internal Database URL** (not external)
- Verify `DATABASE_URL` is set correctly
- Check database is running (green status)

### Problem: Cold Start Delay

**Solution:**
- Normal for free tier
- First request takes ~30 seconds
- Subsequent requests are fast
- Keep service alive with ping service (optional)

---

## 🚀 Quick Start (Render)

```bash
# 1. Go to render.com and sign up
# 2. Create Web Service (connect GitHub)
# 3. Create PostgreSQL database
# 4. Add environment variables
# 5. Deploy
# 6. Get URL: https://your-service.onrender.com
# 7. Update apiConfig.ts
# 8. Build APK
# 9. Test!
```

**Total time: 15-20 minutes**

---

## 💡 Pro Tips for Render

1. **Keep Service Alive (Optional):**
   - Use a ping service like [UptimeRobot](https://uptimerobot.com) (free)
   - Ping your service every 5 minutes
   - Prevents cold starts

2. **Monitor Logs:**
   - Check Render dashboard → Logs tab
   - Monitor for errors
   - Check database connections

3. **Database Backups:**
   - Render free tier includes backups
   - Check database → Backups tab

4. **Custom Domain (Optional):**
   - Render allows custom domains on free tier
   - Add in Settings → Custom Domains

---

## 🎉 You're All Set!

With Render, you get:
- ✅ 100% free forever
- ✅ No restrictions
- ✅ Full backend deployment
- ✅ PostgreSQL database
- ✅ WebSocket support
- ✅ Works from any network

**Start here:** [render.com](https://render.com)

---

## 📞 Need Help?

If you encounter issues:
1. Check Render logs in dashboard
2. Verify environment variables
3. Test health endpoint: `/api/health`
4. Check database connection
5. Review this guide

Good luck! 🚀



