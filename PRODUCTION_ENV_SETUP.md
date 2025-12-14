# 🔧 Production Environment Setup Guide
## Step-by-Step Configuration for Live Deployment

---

## 📋 **BACKEND PRODUCTION ENVIRONMENT**

### Step 1: Create Production .env File

Create `backend/.env.production` (DO NOT commit to Git):

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=production
PORT=3000

# ============================================
# DATABASE CONFIGURATION
# ============================================
# PostgreSQL (Recommended for Production)
DATABASE_URL=postgresql://username:password@host:5432/database_name?sslmode=require

# Example for Render:
# DATABASE_URL=postgresql://user:pass@dpg-xxxxx-a.oregon-postgres.render.com/dbname

# Example for Railway:
# DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway

# ============================================
# JWT AUTHENTICATION
# ============================================
# Generate a strong secret: openssl rand -base64 32
JWT_SECRET=your-super-secret-production-key-minimum-32-characters-long
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_EXPIRES_IN=7d

# ============================================
# SECURITY
# ============================================
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# CORS CONFIGURATION
# ============================================
# Replace with your actual domain
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# ============================================
# EMAIL CONFIGURATION (SMTP)
# ============================================
# SendGrid Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key-here
SMTP_FROM=noreply@yourdomain.com

# Alternative: Mailgun
# SMTP_HOST=smtp.mailgun.org
# SMTP_PORT=587
# SMTP_USER=your-mailgun-username
# SMTP_PASS=your-mailgun-password
# SMTP_FROM=noreply@yourdomain.com

# Alternative: AWS SES
# SMTP_HOST=email-smtp.us-east-1.amazonaws.com
# SMTP_PORT=587
# SMTP_USER=your-ses-access-key
# SMTP_PASS=your-ses-secret-key
# SMTP_FROM=noreply@yourdomain.com

# ============================================
# OTP CONFIGURATION
# ============================================
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RATE_LIMIT_WINDOW=300000
OTP_RATE_LIMIT_MAX=3

# ============================================
# STRIPE PAYMENT CONFIGURATION
# ============================================
# LIVE KEYS (Production)
# ⚠️ IMPORTANT: Get your live keys from https://dashboard.stripe.com/apikeys
# Never commit actual keys to version control!
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_STRIPE_WEBHOOK_SECRET_HERE

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
LOG_FILE=logs/app.log
LOG_ERROR_FILE=logs/error.log

# ============================================
# REAL-TIME (WebSocket)
# ============================================
SOCKET_IO_ENABLED=true
SOCKET_IO_CORS_ORIGIN=https://yourdomain.com

# ============================================
# APP CONFIGURATION
# ============================================
APP_NAME=Guard Tracking App
APP_URL=https://yourdomain.com
API_BASE_URL=https://yourdomain.com/api
```

---

## 📱 **FRONTEND PRODUCTION CONFIGURATION**

### Step 1: Update API Configuration

Edit `GuardTrackingApp/src/config/apiConfig.ts`:

```typescript
// ============================================
// PRODUCTION CONFIGURATION
// ============================================
const PRODUCTION_API_URL = 'https://your-production-api.com/api';
const PRODUCTION_WS_URL = 'https://your-production-api.com';
```

### Step 2: Update Stripe Publishable Key

If using Stripe in the app, update the publishable key:

```typescript
// In your Stripe service file
const STRIPE_PUBLISHABLE_KEY = 'pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

### Step 3: Update App Configuration

Edit `GuardTrackingApp/app.json`:

```json
{
  "name": "GuardTrackingApp",
  "displayName": "Your App Name",
  "version": "1.0.0"
}
```

---

## 🗄️ **DATABASE SETUP**

### Step 1: Create Production Database

**Option A: Render PostgreSQL**
1. Go to Render Dashboard
2. Create New → PostgreSQL
3. Copy connection string
4. Update `DATABASE_URL` in `.env`

**Option B: Railway PostgreSQL**
1. Go to Railway Dashboard
2. Create New Project → Add PostgreSQL
3. Copy connection string
4. Update `DATABASE_URL` in `.env`

**Option C: Supabase (Free Tier Available)**
1. Sign up at https://supabase.com
2. Create project
3. Get connection string from Settings → Database
4. Update `DATABASE_URL` in `.env`

### Step 2: Run Migrations

```bash
cd backend
npm run db:migrate
```

### Step 3: Seed Initial Data (Optional)

```bash
npm run db:seed
```

---

## 📧 **EMAIL SETUP - DETAILED**

### SendGrid Setup (Recommended)

1. **Sign Up**
   - Go to https://sendgrid.com
   - Create free account (100 emails/day free)

2. **Verify Domain**
   - Settings → Sender Authentication → Domain Authentication
   - Add your domain
   - Add DNS records to your domain:
     ```
     Type: CNAME
     Host: em1234.yourdomain.com
     Value: u1234567.wl123.sendgrid.net
     ```

3. **Get API Key**
   - Settings → API Keys → Create API Key
   - Name: "Production API Key"
   - Permissions: Full Access
   - Copy the key (shown only once!)

4. **Test Email**
   ```bash
   # Test from backend
   curl -X POST https://your-api.com/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

### Mailgun Setup (Alternative)

1. Sign up at https://mailgun.com
2. Verify domain
3. Add DNS records
4. Get SMTP credentials
5. Update `.env` with Mailgun settings

---

## 🔐 **SECURITY CHECKLIST**

### Secrets Management
- [ ] All secrets in environment variables
- [ ] `.env` file in `.gitignore`
- [ ] No secrets in code
- [ ] Different secrets for dev/staging/production

### JWT Secret Generation
```bash
# Generate strong JWT secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### SSL/TLS
- [ ] SSL certificate installed
- [ ] HTTPS enforced
- [ ] Certificate auto-renewal configured

### CORS Configuration
- [ ] Only allow your domain(s)
- [ ] No wildcard `*` in production
- [ ] Credentials properly configured

---

## 🚀 **DEPLOYMENT PLATFORMS**

### Render (Current Setup)

1. **Backend Deployment**
   ```bash
   # Connect GitHub repo to Render
   # Set build command: npm install && npm run build
   # Set start command: npm start
   # Add environment variables from .env
   ```

2. **Database**
   - Create PostgreSQL service
   - Copy connection string to `DATABASE_URL`

3. **Environment Variables**
   - Add all variables from `.env.production`
   - Mark sensitive ones as "Secret"

### Railway

1. **Deploy Backend**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # Link project
   railway link
   
   # Deploy
   railway up
   ```

2. **Add PostgreSQL**
   - Railway Dashboard → Add Service → PostgreSQL
   - Copy connection string

3. **Set Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set DATABASE_URL=postgresql://...
   # etc.
   ```

### AWS (Advanced)

1. **EC2 Instance**
   - Launch EC2 instance
   - Install Node.js, PostgreSQL
   - Clone repository
   - Set up PM2 or systemd

2. **RDS Database**
   - Create RDS PostgreSQL instance
   - Configure security groups
   - Update `DATABASE_URL`

3. **Load Balancer**
   - Set up Application Load Balancer
   - Configure SSL certificate
   - Point domain to load balancer

---

## ✅ **VERIFICATION CHECKLIST**

### Backend Verification
```bash
# Test API health
curl https://your-api.com/api/health

# Test authentication
curl -X POST https://your-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test email
curl -X POST https://your-api.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Frontend Verification
- [ ] App connects to production API
- [ ] Authentication works
- [ ] All API calls successful
- [ ] WebSocket connects
- [ ] No console errors

### Email Verification
- [ ] OTP emails received
- [ ] Invitation emails received
- [ ] Password reset emails received
- [ ] Emails not in spam folder

### Payment Verification
- [ ] Stripe test mode works
- [ ] Switch to live mode
- [ ] Test payment with real card (small amount)
- [ ] Verify webhook receives events

---

## 🔄 **POST-DEPLOYMENT**

### Monitoring Setup

1. **Error Tracking**
   - Set up Sentry or similar
   - Add to backend and frontend

2. **Uptime Monitoring**
   - UptimeRobot (free)
   - Pingdom
   - StatusCake

3. **Logging**
   - Set up log aggregation
   - Configure log rotation
   - Set up alerts

### Backup Strategy

1. **Database Backups**
   - Daily automated backups
   - Test restore procedure
   - Store backups securely

2. **Code Backups**
   - Git repository (GitHub/GitLab)
   - Tag releases
   - Document versions

---

## 📝 **ENVIRONMENT VARIABLES TEMPLATE**

Save this as `backend/.env.production.template` (commit this, not the actual .env):

```env
# Copy this file to .env.production and fill in values
# DO NOT commit .env.production to Git!

NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=generate-with-openssl-rand-base64-32
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://yourdomain.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RATE_LIMIT_WINDOW=300000
OTP_RATE_LIMIT_MAX=3
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
LOG_LEVEL=info
SOCKET_IO_ENABLED=true
SOCKET_IO_CORS_ORIGIN=https://yourdomain.com
```

---

## 🆘 **TROUBLESHOOTING**

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL

# Check if database exists
# Verify credentials
# Check firewall rules
```

### Email Not Sending
```bash
# Test SMTP connection
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify()
  .then(() => console.log('SMTP OK'))
  .catch(err => console.error('SMTP Error:', err));
"
```

### API Not Responding
- Check server logs
- Verify environment variables
- Check database connection
- Verify CORS settings
- Check firewall/security groups

---

**Last Updated**: [Date]  
**Version**: 1.0



