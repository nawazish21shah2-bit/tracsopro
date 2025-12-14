# 📧 Update SMTP Settings for Production

## Update .env File on DigitalOcean Droplet

Run these commands in your DigitalOcean console:

### Step 1: Navigate to backend directory

```bash
cd /root/backend
```

### Step 2: Edit .env file

```bash
nano .env
```

### Step 3: Add/Update SMTP Settings

Add or update these lines in your `.env` file:

```env
# SMTP Configuration (Gmail for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=nawazish21shah2@gmail.com
SMTP_PASS=yaeawbcvibbwpsnk
SMTP_FROM=nawazish21shah2@gmail.com
SMTP_SECURE=false
```

### Step 4: Save the file

- Press `Ctrl+X` to exit
- Press `Y` to confirm
- Press `Enter` to save

### Step 5: Restart the server

```bash
# Restart PM2 to load new environment variables
pm2 restart guard-tracking-api

# Check logs to verify
pm2 logs guard-tracking-api
```

---

## ✅ Verify SMTP is Working

### Test Email Sending

You can test by triggering an email (like password reset or OTP):

```bash
# Check server logs for email sending
pm2 logs guard-tracking-api | grep -i smtp
```

Or test via API:

```bash
# Test OTP email (if OTP is enabled)
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

## 🔒 Security Note

**For Production (Later):**
- Use a dedicated email service (SendGrid, Mailgun, AWS SES)
- Store SMTP credentials securely (environment variables, secrets manager)
- Use app-specific passwords, not your main Gmail password
- Consider using OAuth2 for Gmail instead of passwords

**For Now (Testing):**
- Gmail SMTP is fine for testing
- Make sure to update before going live with real users

---

## 📝 Complete .env Example

Your complete `.env` file should look like:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://guard_user:postgres123@localhost:5432/tracsopro?schema=public
JWT_SECRET=gsS1l30WeQWOUjDW5vT/5QWMErgxnYlbaQMTF0vCflQ=
LOG_LEVEL=info
CORS_ORIGIN=*

# SMTP Configuration (Gmail for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=nawazish21shah2@gmail.com
SMTP_PASS=yaeawbcvibbwpsnk
SMTP_FROM=nawazish21shah2@gmail.com
SMTP_SECURE=false

# OTP Configuration
OTP_ENABLED=true
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10

# Password Hashing
BCRYPT_ROUNDS=10
```

---

## 🚀 Quick Update Command

If you want to quickly add SMTP settings without editing:

```bash
cd /root/backend

# Append SMTP settings to .env
cat >> .env << 'EOF'

# SMTP Configuration (Gmail for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=nawazish21shah2@gmail.com
SMTP_PASS=yaeawbcvibbwpsnk
SMTP_FROM=nawazish21shah2@gmail.com
SMTP_SECURE=false
EOF

# Restart server
pm2 restart guard-tracking-api
```

---

**After updating, your app will use Gmail SMTP for sending emails (OTP, password reset, notifications, etc.)**

