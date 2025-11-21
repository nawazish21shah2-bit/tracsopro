# Get Price IDs and Complete Setup

## ✅ Products Created!

You've successfully created all 6 products. Now you need to get the Price IDs.

## Step 1: Get Price IDs from Each Product

For each product in your Stripe Dashboard:

1. **Click on the product name** (e.g., "Basic Plan")
2. **Scroll down to the "Pricing" section**
3. **You'll see a Price ID** that looks like: `price_1SVpTpLEsN8TIkgKxxxxxxxxxx`
4. **Copy that Price ID**

Do this for all 6 products:
- Basic Plan → Copy Monthly Price ID
- Basic Plan (Yearly) → Copy Yearly Price ID
- Professional Plan → Copy Monthly Price ID
- Professional Plan (Yearly) → Copy Yearly Price ID
- Enterprise Plan → Copy Monthly Price ID
- Enterprise Plan (Yearly) → Copy Yearly Price ID

## Step 2: Update Your .env File

Open `backend/.env` and add all 6 Price IDs:

```env
# Stripe Price IDs (from Stripe Dashboard → Products)
STRIPE_PRICE_BASIC_MONTHLY=price_YOUR_BASIC_MONTHLY_PRICE_ID_HERE
STRIPE_PRICE_BASIC_YEARLY=price_YOUR_BASIC_YEARLY_PRICE_ID_HERE
STRIPE_PRICE_PROF_MONTHLY=price_YOUR_PROFESSIONAL_MONTHLY_PRICE_ID_HERE
STRIPE_PRICE_PROF_YEARLY=price_YOUR_PROFESSIONAL_YEARLY_PRICE_ID_HERE
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_YOUR_ENTERPRISE_MONTHLY_PRICE_ID_HERE
STRIPE_PRICE_ENTERPRISE_YEARLY=price_YOUR_ENTERPRISE_YEARLY_PRICE_ID_HERE
```

**Replace** `YOUR_*_PRICE_ID_HERE` with the actual Price IDs you copied.

## Step 3: Verify Your Setup

1. **Check webhook is running** (in a separate terminal):
   ```powershell
   C:\stripe-cli\stripe.exe listen --forward-to localhost:3000/api/payments/webhook
   ```
   Make sure you see: `Ready! Your webhook signing secret is whsec_...`

2. **Start your backend**:
   ```powershell
   cd backend
   npm run dev
   ```

3. **Test the plans endpoint** (optional):
   ```powershell
   # First login as admin to get JWT token, then:
   curl -X GET http://localhost:3000/api/payments/plans -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## Step 4: Test in Your App

1. **Start your React Native app**
2. **Login as Admin**
3. **Navigate to**: Settings → Subscription & Billing
4. **You should see**:
   - Basic Plan: $49/month or $490/year
   - Professional Plan: $149/month or $1,490/year
   - Enterprise Plan: $399/month or $3,990/year

5. **Test subscription**:
   - Click "Subscribe" on any plan
   - Should redirect to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`
     - Expiry: `12/25`
     - CVC: `123`
     - ZIP: `12345`

6. **Check webhook terminal** - you should see events!

## 🎉 You're Done!

Your Stripe payment integration is now complete!

## Quick Checklist

- [ ] All 6 Price IDs copied from Stripe Dashboard
- [ ] All 6 Price IDs added to `backend/.env`
- [ ] Webhook forwarding running (separate terminal)
- [ ] Webhook secret in `.env`
- [ ] Backend starts without errors
- [ ] Plans show correctly in app
- [ ] Test payment completes successfully

