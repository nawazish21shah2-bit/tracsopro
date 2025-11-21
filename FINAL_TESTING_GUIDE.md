# Final Testing Guide - Stripe Integration Complete!

## ✅ Setup Complete Checklist

- [x] Stripe API keys added to `.env`
- [x] Webhook secret added to `.env`
- [x] All 6 products created in Stripe
- [x] All 6 Price IDs added to `.env`
- [ ] Webhook forwarding running
- [ ] Backend tested
- [ ] App tested

## Step 1: Verify Your .env File

Make sure `backend/.env` has all these:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_BASIC_YEARLY=price_...
STRIPE_PRICE_PROF_MONTHLY=price_...
STRIPE_PRICE_PROF_YEARLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_YEARLY=price_...
```

## Step 2: Start Webhook Forwarding

**Open a NEW terminal** and run:

```powershell
C:\stripe-cli\stripe.exe listen --forward-to localhost:3000/api/payments/webhook
```

**Keep this terminal open!** You should see:
```
> Ready! Your webhook signing secret is whsec_...
```

## Step 3: Start Your Backend

**Open another terminal** and run:

```powershell
cd backend
npm run dev
```

**Check for errors:**
- Should see: `🚀 Server running on http://localhost:3000`
- No Stripe-related errors
- If you see "STRIPE_SECRET_KEY is not set", check your `.env` file

## Step 4: Test the Plans Endpoint

**Get an admin JWT token first** (login as admin), then:

```powershell
curl -X GET http://localhost:3000/api/payments/plans -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "currency": "USD",
    "plans": [
      {
        "key": "BASIC",
        "name": "Basic Plan",
        "monthly": {
          "priceId": "price_...",
          "amount": 4900
        },
        "yearly": {
          "priceId": "price_...",
          "amount": 49000
        }
      },
      ...
    ]
  }
}
```

## Step 5: Test in Your React Native App

1. **Start your React Native app**

2. **Login as Admin**:
   - Use an admin account
   - Navigate to: **Settings** → **Subscription & Billing**

3. **You should see**:
   - Current subscription status (if any)
   - Three plans: Basic ($49/$490), Professional ($149/$1,490), Enterprise ($399/$3,990)
   - Monthly/Yearly toggle
   - "Subscribe" buttons

4. **Test subscription flow**:
   - Click **"Subscribe"** on any plan
   - Should redirect to Stripe Checkout (in browser)
   - Use test card: `4242 4242 4242 4242`
     - Expiry: `12/25`
     - CVC: `123`
     - ZIP: `12345`
   - Complete the payment

5. **Check webhook terminal**:
   - Should see events like:
     ```
     --> checkout.session.completed [evt_xxxxx]
     --> customer.subscription.created [evt_xxxxx]
     ```

6. **Test Billing Portal**:
   - Click **"Manage Billing"** button
   - Should redirect to Stripe Billing Portal
   - You can update payment methods, view invoices, etc.

## Step 6: Verify Database Updates

After a successful payment, check your database:

```sql
-- Check subscription status
SELECT id, name, subscriptionPlan, subscriptionStatus 
FROM "SecurityCompany" 
WHERE id = 'YOUR_COMPANY_ID';

-- Check subscription record
SELECT * FROM "Subscription" 
WHERE "securityCompanyId" = 'YOUR_COMPANY_ID' 
ORDER BY "createdAt" DESC;
```

## 🎉 Success Indicators

✅ Backend starts without errors
✅ Plans endpoint returns all 3 plans
✅ App shows subscription screen correctly
✅ Stripe Checkout opens when clicking "Subscribe"
✅ Test payment completes successfully
✅ Webhook events are received
✅ Database subscription status updates

## 🆘 Troubleshooting

### "Plans not showing in app"
- Check backend logs for errors
- Verify Price IDs are correct in `.env`
- Test the `/api/payments/plans` endpoint directly

### "Stripe Checkout not opening"
- Check browser console for errors
- Verify `STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL` in `.env`
- Check backend logs for checkout session creation errors

### "Webhook events not received"
- Make sure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/payments/webhook`
- Verify `STRIPE_WEBHOOK_SECRET` matches the CLI output
- Check backend logs for webhook processing errors

### "Payment succeeds but subscription not updating"
- Check webhook handler in backend logs
- Verify webhook events are being received
- Check database for subscription records

## 📝 Next Steps

1. **Test all subscription flows**:
   - New subscription
   - Plan upgrade
   - Plan downgrade
   - Subscription cancellation

2. **Test error scenarios**:
   - Declined card: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`

3. **Monitor webhook events**:
   - Keep Stripe CLI running during testing
   - Watch for any errors in webhook processing

4. **Prepare for production**:
   - Switch to Live Mode in Stripe
   - Get Live API keys
   - Set up production webhook endpoint
   - Test with real payment methods (small amounts)

## 🎊 Congratulations!

Your Stripe payment integration is now complete and ready for testing!

