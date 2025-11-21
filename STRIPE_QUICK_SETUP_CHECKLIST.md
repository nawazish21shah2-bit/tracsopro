# Stripe Sandbox Quick Setup Checklist

Use this checklist to quickly set up Stripe payment sandbox for your app.

## ✅ Pre-Setup

- [ ] Have a Stripe account (create at https://stripe.com)
- [ ] Backend server can run locally
- [ ] Have access to terminal/command line

## ✅ Step 1: Get Stripe Test Keys (5 minutes)

1. [ ] Login to Stripe Dashboard: https://dashboard.stripe.com
2. [ ] Ensure you're in **Test Mode** (toggle in top right)
3. [ ] Go to **Developers** → **API keys**
4. [ ] Copy **Publishable key** (`pk_test_...`)
5. [ ] Copy **Secret key** (`sk_test_...`) - click "Reveal test key"

## ✅ Step 2: Configure Backend (2 minutes)

1. [ ] Navigate to `backend` directory
2. [ ] Open `.env` file (create if doesn't exist)
3. [ ] Add these lines:
   ```env
   STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
   STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   STRIPE_WEBHOOK_SECRET=whsec_PLACEHOLDER
   STRIPE_SUCCESS_URL=http://localhost:3000/api/payments/success
   STRIPE_CANCEL_URL=http://localhost:3000/api/payments/cancel
   BILLING_PORTAL_RETURN_URL=http://localhost:3000/api/admin/subscription
   ```
4. [ ] Replace `YOUR_KEY_HERE` with actual keys from Step 1
5. [ ] Save the file

## ✅ Step 3: Install Stripe Package (1 minute)

```bash
cd backend
npm install stripe
```

- [ ] Verify installation: `npm list stripe`

## ✅ Step 4: Set Up Webhooks (5 minutes)

### Option A: Stripe CLI (Recommended)

1. [ ] Install Stripe CLI:
   - Windows: Download from https://github.com/stripe/stripe-cli/releases
   - Mac: `brew install stripe/stripe-cli/stripe`
   - Linux: See https://stripe.com/docs/stripe-cli

2. [ ] Login: `stripe login`

3. [ ] Start webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

4. [ ] Copy the webhook secret (starts with `whsec_...`)

5. [ ] Update `.env` file with the webhook secret:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

6. [ ] Keep this terminal open (webhook forwarding must stay running)

### Option B: ngrok (Alternative)

1. [ ] Install ngrok: https://ngrok.com/download
2. [ ] Start backend: `npm run dev`
3. [ ] Start ngrok: `ngrok http 3000`
4. [ ] Copy HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. [ ] In Stripe Dashboard → Webhooks → Add endpoint
6. [ ] URL: `https://abc123.ngrok.io/api/payments/webhook`
7. [ ] Select events: `checkout.session.completed`, `customer.subscription.*`
8. [ ] Copy signing secret to `.env`

## ✅ Step 5: Create Test Products (10 minutes)

1. [ ] Go to Stripe Dashboard → **Products**
2. [ ] Create **Basic Plan - Monthly**:
   - Name: `Basic Plan`
   - Price: `$29.00` / month
   - Copy Price ID (`price_...`)
3. [ ] Create **Basic Plan - Yearly**:
   - Name: `Basic Plan (Yearly)`
   - Price: `$290.00` / year
   - Copy Price ID
4. [ ] Create **Professional Plan - Monthly**:
   - Price: `$99.00` / month
   - Copy Price ID
5. [ ] Create **Professional Plan - Yearly**:
   - Price: `$990.00` / year
   - Copy Price ID
6. [ ] Create **Enterprise Plan - Monthly**:
   - Price: `$299.00` / month
   - Copy Price ID
7. [ ] Create **Enterprise Plan - Yearly**:
   - Price: `$2990.00` / year
   - Copy Price ID

## ✅ Step 6: Configure Plans in Backend (2 minutes)

1. [ ] Open `backend/.env` file
2. [ ] Add Price IDs from Step 5:
   ```env
   STRIPE_PRICE_BASIC_MONTHLY=price_YOUR_BASIC_MONTHLY_PRICE_ID
   STRIPE_PRICE_BASIC_YEARLY=price_YOUR_BASIC_YEARLY_PRICE_ID
   STRIPE_PRICE_PROF_MONTHLY=price_YOUR_PROFESSIONAL_MONTHLY_PRICE_ID
   STRIPE_PRICE_PROF_YEARLY=price_YOUR_PROFESSIONAL_YEARLY_PRICE_ID
   STRIPE_PRICE_ENTERPRISE_MONTHLY=price_YOUR_ENTERPRISE_MONTHLY_PRICE_ID
   STRIPE_PRICE_ENTERPRISE_YEARLY=price_YOUR_ENTERPRISE_YEARLY_PRICE_ID
   ```
3. [ ] Replace `YOUR_*_PRICE_ID` with actual Price IDs from Stripe
4. [ ] Save the file
5. [ ] Note: Prices are already set in code (Basic: $30/$300, Pro: $100/$1000, Enterprise: $300/$3000)

## ✅ Step 7: Test the Integration (10 minutes)

1. [ ] Start backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. [ ] Verify no errors in console

3. [ ] Test API endpoint (replace `YOUR_TOKEN` with admin JWT):
   ```bash
   curl -X GET http://localhost:3000/api/payments/plans \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. [ ] Should return plans JSON

5. [ ] In React Native app:
   - [ ] Login as Admin
   - [ ] Navigate to Settings → Subscription & Billing
   - [ ] Should see plans listed

6. [ ] Click "Subscribe" on a plan
   - [ ] Should redirect to Stripe Checkout

7. [ ] Use test card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - ZIP: `12345`

8. [ ] Complete payment

9. [ ] Check Stripe CLI/ngrok terminal for webhook events

10. [ ] Check backend logs for webhook processing

## ✅ Step 8: Verify Everything Works

- [ ] Plans are displayed correctly in app
- [ ] Checkout redirects to Stripe
- [ ] Test payment completes successfully
- [ ] Webhook events are received
- [ ] Database subscription status updates
- [ ] Billing Portal link works

## 🎉 You're Done!

Your Stripe sandbox is now set up and ready for testing.

## 📝 Test Cards Reference

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Declined |
| `4000 0025 0000 3155` | 🔐 3D Secure |

All cards: Expiry `12/25`, CVC `123`, ZIP `12345`

## 🆘 Need Help?

- Check `STRIPE_SANDBOX_SETUP_GUIDE.md` for detailed instructions
- Stripe Docs: https://stripe.com/docs/testing
- Stripe Support: https://support.stripe.com

