# Stripe Payment Sandbox Setup - Summary

## Quick Start (5 Minutes)

1. **Get Stripe Test Keys**
   - Login to https://dashboard.stripe.com
   - Go to Developers → API keys
   - Copy `sk_test_...` and `pk_test_...`

2. **Add to `.env`**
   ```env
   STRIPE_SECRET_KEY=sk_test_YOUR_KEY
   STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
   ```

3. **Install Stripe CLI & Forward Webhooks**
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```
   Copy the `whsec_...` secret to `.env` as `STRIPE_WEBHOOK_SECRET`

4. **Create Products in Stripe**
   - Dashboard → Products → Add product
   - Create 6 products (Basic/Pro/Enterprise × Monthly/Yearly)
   - Copy Price IDs

5. **Add Price IDs to `.env`**
   ```env
   STRIPE_PRICE_BASIC_MONTHLY=price_xxxxx
   STRIPE_PRICE_BASIC_YEARLY=price_xxxxx
   # ... etc
   ```

6. **Test It!**
   - Start backend: `npm run dev`
   - Use test card: `4242 4242 4242 4242`

## Files to Update

- `backend/.env` - Add all Stripe keys and Price IDs
- Keep Stripe CLI running for webhooks

## Test Cards

- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

All: Expiry `12/25`, CVC `123`, ZIP `12345`

## Full Guides

- **Detailed**: See `STRIPE_SANDBOX_SETUP_GUIDE.md`
- **Checklist**: See `STRIPE_QUICK_SETUP_CHECKLIST.md`

