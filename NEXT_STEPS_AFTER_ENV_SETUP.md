# Next Steps After Adding Stripe Keys to .env

You've added your Stripe keys! Here's what to do next:

## ✅ Step 1: Verify Stripe Package is Installed (1 minute)

```bash
cd backend
npm list stripe
```

If not installed:
```bash
npm install stripe
```

## ✅ Step 2: Set Up Webhooks (5 minutes)

Webhooks allow Stripe to notify your backend when payments happen.

### Option A: Using Stripe CLI (Recommended)

1. **Install Stripe CLI** (if not installed):
   - **Windows**: Download from https://github.com/stripe/stripe-cli/releases
   - **Mac**: `brew install stripe/stripe-cli/stripe`
   - **Linux**: See https://stripe.com/docs/stripe-cli

2. **Login to Stripe**:
   ```bash
   stripe login
   ```
   This opens your browser to authorize.

3. **Start webhook forwarding** (in a separate terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

4. **Copy the webhook secret** that appears:
   ```
   Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
   ```

5. **Update your `.env` file**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

6. **Keep this terminal open** - webhook forwarding must stay running!

### Option B: Using ngrok (Alternative)

If you prefer ngrok:
```bash
# Install ngrok from https://ngrok.com/download
ngrok http 3000
# Copy the HTTPS URL and add it in Stripe Dashboard → Webhooks
```

## ✅ Step 3: Create Test Products in Stripe (10 minutes)

You need to create subscription plans that your app will use.

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/test/products
   - Make sure you're in **Test Mode** (toggle in top right)

2. **Click "+ Add product"** and create these 6 products:

   **Product 1: Basic Plan - Monthly**
   - Name: `Basic Plan`
   - Description: `Basic subscription plan for security companies`
   - Pricing: `Recurring`
   - Price: `$30.00`
   - Billing period: `Monthly`
   - Click **"Save product"**
   - **Copy the Price ID** (starts with `price_...`)

   **Product 2: Basic Plan - Yearly**
   - Name: `Basic Plan (Yearly)`
   - Description: `Basic subscription plan - yearly billing`
   - Pricing: `Recurring`
   - Price: `$300.00`
   - Billing period: `Yearly`
   - Click **"Save product"**
   - **Copy the Price ID**

   **Product 3: Professional Plan - Monthly**
   - Name: `Professional Plan`
   - Price: `$100.00` / month
   - Copy Price ID

   **Product 4: Professional Plan - Yearly**
   - Name: `Professional Plan (Yearly)`
   - Price: `$1000.00` / year
   - Copy Price ID

   **Product 5: Enterprise Plan - Monthly**
   - Name: `Enterprise Plan`
   - Price: `$300.00` / month
   - Copy Price ID

   **Product 6: Enterprise Plan - Yearly**
   - Name: `Enterprise Plan (Yearly)`
   - Price: `$3000.00` / year
   - Copy Price ID

3. **Update your `.env` file** with all 6 Price IDs:
   ```env
   STRIPE_PRICE_BASIC_MONTHLY=price_YOUR_ACTUAL_PRICE_ID_HERE
   STRIPE_PRICE_BASIC_YEARLY=price_YOUR_ACTUAL_PRICE_ID_HERE
   STRIPE_PRICE_PROF_MONTHLY=price_YOUR_ACTUAL_PRICE_ID_HERE
   STRIPE_PRICE_PROF_YEARLY=price_YOUR_ACTUAL_PRICE_ID_HERE
   STRIPE_PRICE_ENTERPRISE_MONTHLY=price_YOUR_ACTUAL_PRICE_ID_HERE
   STRIPE_PRICE_ENTERPRISE_YEARLY=price_YOUR_ACTUAL_PRICE_ID_HERE
   ```

## ✅ Step 4: Test Your Backend (2 minutes)

1. **Start your backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Check for errors**:
   - Should see: `🚀 Server running on http://localhost:3000`
   - No Stripe-related errors

3. **Test the plans endpoint** (optional):
   ```bash
   # First, get an admin JWT token by logging in, then:
   curl -X GET http://localhost:3000/api/payments/plans \
     -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
   ```
   
   Should return your subscription plans!

## ✅ Step 5: Test in Your App (5 minutes)

1. **Start your React Native app**

2. **Login as Admin**:
   - Use an admin account
   - Navigate to **Settings** → **Subscription & Billing**

3. **You should see**:
   - Current subscription status
   - Available plans (Basic, Professional, Enterprise)
   - Monthly/Yearly toggle

4. **Test subscription flow**:
   - Click **"Subscribe"** on any plan
   - Should redirect to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`
     - Expiry: `12/25`
     - CVC: `123`
     - ZIP: `12345`
   - Complete the payment

5. **Verify webhook**:
   - Check your Stripe CLI terminal
   - Should see webhook events like:
     ```
     --> checkout.session.completed [evt_xxxxx]
     --> customer.subscription.created [evt_xxxxx]
     ```

## ✅ Step 6: Test Billing Portal (2 minutes)

1. **In your app**, click **"Manage Billing"**
2. **Should redirect** to Stripe Billing Portal
3. **You can**:
   - Update payment methods
   - View invoices
   - Cancel subscription (test mode)

## 🎉 You're Done!

Your Stripe sandbox is now fully configured and working!

## 📋 Quick Checklist

- [ ] Stripe package installed
- [ ] Webhooks set up (Stripe CLI running)
- [ ] Webhook secret added to `.env`
- [ ] 6 products created in Stripe Dashboard
- [ ] All 6 Price IDs added to `.env`
- [ ] Backend starts without errors
- [ ] Plans endpoint returns data
- [ ] App shows subscription screen
- [ ] Test payment completes successfully
- [ ] Webhook events received

## 🆘 Troubleshooting

### "STRIPE_SECRET_KEY is not set"
- Check `.env` file exists in `backend/` directory
- Verify keys are on single lines (no line breaks)
- Restart backend after changing `.env`

### "Price ID not found"
- Verify Price IDs in Stripe Dashboard
- Check you're using **test mode** Price IDs
- Ensure Price IDs match in `.env`

### Webhooks not working
- Keep Stripe CLI running: `stripe listen --forward-to localhost:3000/api/payments/webhook`
- Check webhook secret matches in `.env`
- Verify backend is running on port 3000

### Plans not showing in app
- Check backend logs for errors
- Verify Price IDs are correct
- Test API endpoint directly with curl

## 📚 Test Cards Reference

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Declined |
| `4000 0025 0000 3155` | 🔐 3D Secure |

All cards: Expiry `12/25`, CVC `123`, ZIP `12345`

## 🚀 Next: Production Setup

When ready for production:
1. Switch to **Live Mode** in Stripe Dashboard
2. Get **Live API keys** (start with `sk_live_...` and `pk_live_...`)
3. Update `.env` with live keys
4. Set up production webhook endpoint
5. Test with real payment methods

