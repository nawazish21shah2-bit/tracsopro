# ✅ Stripe Keys Configured!

Your Stripe test API keys have been added to `backend/.env`.

## What's Been Done

✅ **Publishable Key** added: `pk_test_...` (your actual key)
✅ **Secret Key** added: `sk_test_...` (your actual key)

## Next Steps

### 1. Set Up Webhooks (Required - 5 minutes)

Install Stripe CLI and forward webhooks:

```bash
# Install Stripe CLI (if not installed)
# Windows: Download from https://github.com/stripe/stripe-cli/releases
# Mac: brew install stripe/stripe-cli/stripe
# Linux: See https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/payments/webhook
```

**Important**: Copy the `whsec_...` secret that appears and update `STRIPE_WEBHOOK_SECRET` in `backend/.env`

### 2. Create Test Products in Stripe (Required - 10 minutes)

1. Go to: https://dashboard.stripe.com/test/products
2. Click **"+ Add product"**
3. Create these 6 products:

   **Basic Plan - Monthly:**
   - Name: `Basic Plan`
   - Price: `$30.00`
   - Billing: `Monthly`
   - Copy the Price ID (starts with `price_...`)

   **Basic Plan - Yearly:**
   - Name: `Basic Plan (Yearly)`
   - Price: `$300.00`
   - Billing: `Yearly`
   - Copy the Price ID

   **Professional Plan - Monthly:**
   - Name: `Professional Plan`
   - Price: `$100.00`
   - Billing: `Monthly`
   - Copy the Price ID

   **Professional Plan - Yearly:**
   - Name: `Professional Plan (Yearly)`
   - Price: `$1000.00`
   - Billing: `Yearly`
   - Copy the Price ID

   **Enterprise Plan - Monthly:**
   - Name: `Enterprise Plan`
   - Price: `$300.00`
   - Billing: `Monthly`
   - Copy the Price ID

   **Enterprise Plan - Yearly:**
   - Name: `Enterprise Plan (Yearly)`
   - Price: `$3000.00`
   - Billing: `Yearly`
   - Copy the Price ID

4. **Update `backend/.env`** with all 6 Price IDs:
   ```env
   STRIPE_PRICE_BASIC_MONTHLY=price_YOUR_ACTUAL_PRICE_ID
   STRIPE_PRICE_BASIC_YEARLY=price_YOUR_ACTUAL_PRICE_ID
   STRIPE_PRICE_PROF_MONTHLY=price_YOUR_ACTUAL_PRICE_ID
   STRIPE_PRICE_PROF_YEARLY=price_YOUR_ACTUAL_PRICE_ID
   STRIPE_PRICE_ENTERPRISE_MONTHLY=price_YOUR_ACTUAL_PRICE_ID
   STRIPE_PRICE_ENTERPRISE_YEARLY=price_YOUR_ACTUAL_PRICE_ID
   ```

### 3. Update Other Environment Variables (If Needed)

Check `backend/.env` and update:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` and `JWT_REFRESH_SECRET` - Generate strong random strings
- Email settings (if using email features)

### 4. Test the Integration

1. **Start your backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Verify Stripe is initialized:**
   - Check console for any Stripe-related errors
   - Should see server starting successfully

3. **Test in your app:**
   - Login as Admin
   - Navigate to Settings → Subscription & Billing
   - You should see subscription plans
   - Click "Subscribe" on a plan
   - Use test card: `4242 4242 4242 4242`
     - Expiry: `12/25`
     - CVC: `123`
     - ZIP: `12345`

## Security Reminder

⚠️ **Important**: 
- These are **TEST keys** - safe to use in development
- Never commit `.env` file to git (should be in `.gitignore`)
- For production, use **Live keys** from Stripe Dashboard (switch to Live mode)

## Quick Test

After completing steps 1-2, test the API:

```bash
# Get your admin JWT token first, then:
curl -X GET http://localhost:3000/api/payments/plans \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

Should return your subscription plans!

## Need Help?

- Full setup guide: `STRIPE_SANDBOX_SETUP_GUIDE.md`
- Quick checklist: `STRIPE_QUICK_SETUP_CHECKLIST.md`
- Stripe test cards: https://stripe.com/docs/testing

