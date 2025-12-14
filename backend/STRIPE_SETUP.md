# Stripe Configuration Guide

## 🔑 Your Stripe Test Keys

### Secret Key (Backend):
```
⚠️ Get your key from: https://dashboard.stripe.com/test/apikeys
sk_test_YOUR_STRIPE_SECRET_KEY_HERE
```

### Publishable Key (Frontend):
```
⚠️ Get your key from: https://dashboard.stripe.com/test/apikeys
pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
```

---

## 📋 Your Stripe Products

Based on your Stripe dashboard:

1. **Basic Plan**
   - Monthly: $49.00
   - Yearly: $490.00

2. **Professional Plan**
   - Monthly: $149.00
   - Yearly: $1,490.00

3. **Enterprise Plan**
   - Monthly: $399.00
   - Yearly: $3,990.00

---

## 🔧 Setup Steps

### Step 1: Get Price IDs from Stripe

You need to get the Price IDs for each product. In your Stripe dashboard:

1. Go to **Product catalogue**
2. Click on each product
3. Copy the **Price ID** (starts with `price_`) for each:
   - Basic Plan Monthly Price ID
   - Basic Plan Yearly Price ID
   - Professional Plan Monthly Price ID
   - Professional Plan Yearly Price ID
   - Enterprise Plan Monthly Price ID
   - Enterprise Plan Yearly Price ID

### Step 2: Update Backend .env File

Add these to your `backend/.env` file:

```env
# Stripe Configuration
# ⚠️ IMPORTANT: Replace with your actual Stripe keys from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE

# Stripe Price IDs (get these from your Stripe dashboard)
STRIPE_PRICE_BASIC_MONTHLY=price_xxxxx
STRIPE_PRICE_BASIC_YEARLY=price_xxxxx
STRIPE_PRICE_PROF_MONTHLY=price_xxxxx
STRIPE_PRICE_PROF_YEARLY=price_xxxxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxx
STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxxxx

# Stripe URLs (update with your frontend URL)
STRIPE_SUCCESS_URL=http://localhost:3000/admin/subscription?success=true
STRIPE_CANCEL_URL=http://localhost:3000/admin/subscription?canceled=true
BILLING_PORTAL_RETURN_URL=http://localhost:3000/admin/subscription

# Billing
BILLING_CURRENCY=USD
```

### Step 3: Update Frontend Configuration

Update `GuardTrackingApp/src/config/apiConfig.ts` or create a Stripe config file with:

```typescript
// ⚠️ IMPORTANT: Replace with your actual Stripe publishable key from https://dashboard.stripe.com/test/apikeys
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE';
```

---

## 📝 How to Get Price IDs

1. **In Stripe Dashboard:**
   - Go to **Product catalogue**
   - Click on a product (e.g., "Basic Plan")
   - You'll see the prices listed
   - Click on a price to see its details
   - Copy the **Price ID** (format: `price_xxxxxxxxxxxxx`)

2. **Or via Stripe API:**
   ```bash
   # List all products and prices
   # Replace YOUR_STRIPE_SECRET_KEY with your actual key from https://dashboard.stripe.com/test/apikeys
   curl https://api.stripe.com/v1/products \
     -u sk_test_YOUR_STRIPE_SECRET_KEY_HERE:
   ```

---

## ✅ Verification

After setup, test:
1. Backend can create checkout sessions
2. Frontend can display subscription plans
3. Payment flow works end-to-end

---

## 🔒 Security Notes

- ⚠️ These are **TEST** keys (safe to commit in development)
- ⚠️ Never commit **LIVE** keys to version control
- ⚠️ Use environment variables for all keys
- ⚠️ Rotate keys if accidentally exposed



