# Stripe Payment Sandbox Setup Guide - Step by Step

This guide will walk you through setting up Stripe's test/sandbox environment with your Guard Tracking App for admin subscription payments.

## Prerequisites

- Stripe account (free to create)
- Access to your backend `.env` file
- Access to your Stripe Dashboard
- Backend server running locally or accessible via ngrok/tunneling service

---

## Step 1: Create/Login to Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click **"Sign up"** (or **"Sign in"** if you already have an account)
3. Complete the registration process
4. Verify your email address

---

## Step 2: Get Your Test API Keys

1. After logging in, you'll be in **Test Mode** by default (toggle in top right)
2. Navigate to **Developers** → **API keys** (or go to: https://dashboard.stripe.com/test/apikeys)
3. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key" to see it

4. **Copy both keys** - you'll need them in the next step

---

## Step 3: Configure Backend Environment Variables

1. Navigate to your backend directory:
   ```bash
   cd backend
   ```

2. Open or create `.env` file:
   ```bash
   # Windows
   notepad .env
   
   # Mac/Linux
   nano .env
   ```

3. Add the following Stripe configuration:
   ```env
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
   STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
   
   # Stripe URLs (for redirects after payment)
   STRIPE_SUCCESS_URL=http://localhost:3000/api/payments/success
   STRIPE_CANCEL_URL=http://localhost:3000/api/payments/cancel
   BILLING_PORTAL_RETURN_URL=http://localhost:3000/api/admin/subscription
   ```

4. **Replace** `YOUR_SECRET_KEY_HERE` and `YOUR_PUBLISHABLE_KEY_HERE` with your actual keys from Step 2
5. **Leave** `STRIPE_WEBHOOK_SECRET` empty for now - we'll get it in Step 6

---

## Step 4: Install Stripe Package (if not already installed)

1. Check if Stripe is installed:
   ```bash
   cd backend
   npm list stripe
   ```

2. If not installed, install it:
   ```bash
   npm install stripe
   ```

3. Verify installation:
   ```bash
   npm list stripe
   ```

---

## Step 5: Verify Backend Stripe Integration

1. Check that your `PaymentService` is using the environment variable:
   ```bash
   # Check the payment service file
   cat src/services/paymentService.ts | grep STRIPE_SECRET_KEY
   ```

2. The service should have something like:
   ```typescript
   private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
   ```

3. If it's not configured, update `backend/src/services/paymentService.ts`:
   ```typescript
   import Stripe from 'stripe';
   
   export class PaymentService {
     private stripe: Stripe;
     
     constructor() {
       if (!process.env.STRIPE_SECRET_KEY) {
         throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
       }
       this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
         apiVersion: '2024-11-20.acacia', // Use latest API version
       });
     }
     // ... rest of the service
   }
   ```

---

## Step 6: Set Up Stripe Webhooks (for Local Development)

Webhooks allow Stripe to notify your backend when payment events occur.

### Option A: Using Stripe CLI (Recommended for Local Development)

1. **Install Stripe CLI**:
   - Windows: Download from https://github.com/stripe/stripe-cli/releases
   - Mac: `brew install stripe/stripe-cli/stripe`
   - Linux: Follow instructions at https://stripe.com/docs/stripe-cli

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```
   This will open your browser to authorize the CLI.

3. **Forward webhooks to your local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```
   
4. **Copy the webhook signing secret** that appears (starts with `whsec_...`)
   - It will look like: `Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx`
   
5. **Add it to your `.env` file**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

6. **Keep the terminal open** - it needs to stay running to forward webhooks

### Option B: Using ngrok (Alternative for Local Development)

1. **Install ngrok**:
   - Download from https://ngrok.com/download
   - Extract and add to PATH

2. **Start your backend server**:
   ```bash
   cd backend
   npm run dev
   ```

3. **In a new terminal, start ngrok**:
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **In Stripe Dashboard**:
   - Go to **Developers** → **Webhooks**
   - Click **"Add endpoint"**
   - Enter: `https://abc123.ngrok.io/api/payments/webhook`
   - Select events to listen to:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click **"Add endpoint"**
   - **Copy the "Signing secret"** (starts with `whsec_...`)
   - Add it to your `.env` file

---

## Step 7: Create Test Products and Prices in Stripe

You need to create subscription plans that match your app's plan structure.

1. **Go to Stripe Dashboard** → **Products** (https://dashboard.stripe.com/test/products)

2. **Create Basic Plan**:
   - Click **"+ Add product"**
   - Name: `Basic Plan`
   - Description: `Basic subscription plan for security companies`
   - Pricing model: **Recurring**
   - Price: `$29.00` per month
   - Billing period: **Monthly**
   - Click **"Save product"**
   - **Copy the Price ID** (starts with `price_...`) - you'll need this

3. **Create Yearly Basic Plan**:
   - Click **"+ Add product"** again
   - Name: `Basic Plan (Yearly)`
   - Description: `Basic subscription plan - yearly billing`
   - Pricing model: **Recurring**
   - Price: `$290.00` per year (or calculate: $29 * 12 * 0.83 = ~$290 for 17% discount)
   - Billing period: **Yearly**
   - Click **"Save product"**
   - **Copy the Price ID**

4. **Repeat for Professional and Enterprise plans**:
   - Professional Monthly: `$99/month` → Price ID: `price_professional_monthly`
   - Professional Yearly: `$990/year` → Price ID: `price_professional_yearly`
   - Enterprise Monthly: `$299/month` → Price ID: `price_enterprise_monthly`
   - Enterprise Yearly: `$2990/year` → Price ID: `price_enterprise_yearly`

5. **Note all Price IDs** - you'll configure them in the next step

---

## Step 8: Configure Plan Prices in Backend

Your backend already uses environment variables for Price IDs! Just add them to your `.env` file.

1. **Open your `.env` file** in the `backend` directory

2. **Add the Price IDs** you copied from Step 7:
   ```env
   # Stripe Price IDs (from Stripe Dashboard → Products)
   STRIPE_PRICE_BASIC_MONTHLY=price_YOUR_BASIC_MONTHLY_PRICE_ID
   STRIPE_PRICE_BASIC_YEARLY=price_YOUR_BASIC_YEARLY_PRICE_ID
   STRIPE_PRICE_PROF_MONTHLY=price_YOUR_PROFESSIONAL_MONTHLY_PRICE_ID
   STRIPE_PRICE_PROF_YEARLY=price_YOUR_PROFESSIONAL_YEARLY_PRICE_ID
   STRIPE_PRICE_ENTERPRISE_MONTHLY=price_YOUR_ENTERPRISE_MONTHLY_PRICE_ID
   STRIPE_PRICE_ENTERPRISE_YEARLY=price_YOUR_ENTERPRISE_YEARLY_PRICE_ID
   ```

3. **Replace** `YOUR_*_PRICE_ID` with the actual Price IDs from Stripe Dashboard

4. **Note**: The amounts are already configured in the code (in cents):
   - Basic: $30/month, $300/year
   - Professional: $100/month, $1000/year
   - Enterprise: $300/month, $3000/year

5. **If you want different prices**, you can modify `backend/src/services/paymentService.ts` in the `getPlanCatalog()` method

---

## Step 9: Test the Integration

### 9.1 Start Your Backend Server

```bash
cd backend
npm run dev
```

Verify it starts without errors and shows:
```
Server running on port 3000
Stripe initialized successfully
```

### 9.2 Test API Endpoints

1. **Test Plans Endpoint** (using curl or Postman):
   ```bash
   curl -X GET http://localhost:3000/api/payments/plans \
     -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
   ```

   Expected response:
   ```json
   {
     "success": true,
     "data": {
       "currency": "usd",
       "plans": [...]
     }
   }
   ```

2. **Test Subscription Checkout** (from your React Native app):
   - Login as an Admin user
   - Navigate to Settings → Subscription & Billing
   - Select a plan and click "Subscribe"
   - You should be redirected to Stripe Checkout

### 9.3 Test Stripe Checkout with Test Cards

When redirected to Stripe Checkout, use these **test card numbers**:

| Card Number | Description |
|------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |

**For all test cards**:
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

### 9.4 Verify Webhook Events

1. **Keep Stripe CLI running** (from Step 6)
2. **Complete a test payment**
3. **Check the CLI output** - you should see webhook events:
   ```
   --> checkout.session.completed [evt_xxxxx]
   --> customer.subscription.created [evt_xxxxx]
   ```

4. **Check your backend logs** - webhook handler should process the events

---

## Step 10: Verify Database Updates

After a successful test payment:

1. **Check your database**:
   ```sql
   -- Check SecurityCompany subscription status
   SELECT id, name, subscriptionPlan, subscriptionStatus, subscriptionStartDate
   FROM "SecurityCompany"
   WHERE id = 'YOUR_COMPANY_ID';
   ```

2. **Verify subscription was created**:
   ```sql
   SELECT * FROM "Subscription"
   WHERE "securityCompanyId" = 'YOUR_COMPANY_ID'
   ORDER BY "createdAt" DESC;
   ```

---

## Step 11: Test Billing Portal

1. **In your React Native app**:
   - Login as Admin
   - Go to Subscription & Billing
   - Click "Manage Billing"
   - Should redirect to Stripe Billing Portal

2. **In Stripe Billing Portal**:
   - You can update payment methods
   - View invoices
   - Cancel subscription (test mode)

---

## Troubleshooting

### Issue: "STRIPE_SECRET_KEY is not set"

**Solution**:
1. Check your `.env` file exists in the `backend` directory
2. Verify the key is set: `STRIPE_SECRET_KEY=sk_test_...`
3. Restart your backend server after changing `.env`

### Issue: Webhook events not received

**Solution**:
1. Ensure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/payments/webhook`
2. Check webhook endpoint is correct in your code
3. Verify `STRIPE_WEBHOOK_SECRET` matches the CLI output
4. Check backend logs for webhook processing errors

### Issue: "Invalid API Key"

**Solution**:
1. Verify you're using **test keys** (start with `sk_test_` and `pk_test_`)
2. Check for extra spaces in `.env` file
3. Ensure you're in **Test Mode** in Stripe Dashboard

### Issue: "Price ID not found"

**Solution**:
1. Verify Price IDs in Stripe Dashboard → Products
2. Check Price IDs match in your backend code
3. Ensure Price IDs are for **test mode** (not live mode)

### Issue: Checkout redirect not working

**Solution**:
1. Update `STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL` in `.env`
2. For mobile apps, you may need to use deep links or custom URL schemes
3. Check that URLs are accessible

---

## Next Steps

1. **Test all subscription flows**:
   - New subscription
   - Plan upgrade
   - Plan downgrade
   - Subscription cancellation

2. **Test webhook events**:
   - Payment success
   - Payment failure
   - Subscription renewal
   - Subscription cancellation

3. **Prepare for Production**:
   - Switch to **Live Mode** in Stripe Dashboard
   - Get **Live API keys** (start with `sk_live_` and `pk_live_`)
   - Update `.env` with live keys
   - Set up production webhook endpoint
   - Test with real payment methods (small amounts)

---

## Security Checklist

- [ ] Never commit `.env` file to git (should be in `.gitignore`)
- [ ] Use environment variables for all Stripe keys
- [ ] Verify webhook signatures in production
- [ ] Use HTTPS for all webhook endpoints
- [ ] Implement rate limiting on webhook endpoint
- [ ] Log all payment events for audit trail
- [ ] Test error handling for failed payments

---

## Additional Resources

- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

---

## Quick Reference Commands

```bash
# Start backend
cd backend && npm run dev

# Start Stripe webhook forwarding (in separate terminal)
stripe listen --forward-to localhost:3000/api/payments/webhook

# Test API endpoint
curl -X GET http://localhost:3000/api/payments/plans \
  -H "Authorization: Bearer YOUR_TOKEN"

# View Stripe events
stripe events list
```

---

**You're all set!** Your Stripe sandbox is now configured and ready for testing subscription payments.

