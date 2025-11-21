# Webhook Setup - What to Do Now

## ✅ Stripe CLI is Authenticated!

## Next: Get Your Webhook Secret

**IMPORTANT**: You need to run the webhook forwarding command in a **separate terminal window** so you can see the webhook secret.

### Steps:

1. **Open a NEW PowerShell terminal** (keep it open)

2. **Run this command**:
   ```powershell
   C:\stripe-cli\stripe.exe listen --forward-to localhost:3000/api/payments/webhook
   ```

3. **You'll see output like**:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
   ```

4. **Copy the `whsec_...` secret**

5. **Add it to `backend/.env`**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

6. **Keep this terminal open** - webhook forwarding must stay running!

---

## After Webhooks Are Set Up:

### Create Products in Stripe Dashboard

1. **Go to**: https://dashboard.stripe.com/test/products
2. **Make sure you're in Test Mode** (toggle in top right)

3. **Create 6 products**:

   **Basic Plan - Monthly:**
   - Click "+ Add product"
   - Name: `Basic Plan`
   - Description: `Basic subscription plan`
   - Pricing: `Recurring`
   - Price: `$30.00`
   - Billing: `Monthly`
   - Click "Save product"
   - **Copy the Price ID** (starts with `price_...`)

   **Basic Plan - Yearly:**
   - Name: `Basic Plan (Yearly)`
   - Price: `$300.00`
   - Billing: `Yearly`
   - Copy Price ID

   **Professional Plan - Monthly:**
   - Name: `Professional Plan`
   - Price: `$100.00` / month
   - Copy Price ID

   **Professional Plan - Yearly:**
   - Name: `Professional Plan (Yearly)`
   - Price: `$1000.00` / year
   - Copy Price ID

   **Enterprise Plan - Monthly:**
   - Name: `Enterprise Plan`
   - Price: `$300.00` / month
   - Copy Price ID

   **Enterprise Plan - Yearly:**
   - Name: `Enterprise Plan (Yearly)`
   - Price: `$3000.00` / year
   - Copy Price ID

4. **Update `backend/.env`** with all 6 Price IDs:
   ```env
   STRIPE_PRICE_BASIC_MONTHLY=price_YOUR_PRICE_ID_HERE
   STRIPE_PRICE_BASIC_YEARLY=price_YOUR_PRICE_ID_HERE
   STRIPE_PRICE_PROF_MONTHLY=price_YOUR_PRICE_ID_HERE
   STRIPE_PRICE_PROF_YEARLY=price_YOUR_PRICE_ID_HERE
   STRIPE_PRICE_ENTERPRISE_MONTHLY=price_YOUR_PRICE_ID_HERE
   STRIPE_PRICE_ENTERPRISE_YEARLY=price_YOUR_PRICE_ID_HERE
   ```

---

## Then Test It!

1. **Start your backend** (in another terminal):
   ```powershell
   cd backend
   npm run dev
   ```

2. **In your React Native app**:
   - Login as Admin
   - Go to Settings → Subscription & Billing
   - Click "Subscribe" on a plan
   - Use test card: `4242 4242 4242 4242`

3. **Check webhook terminal** - you should see events!

---

## Quick Checklist

- [ ] Webhook forwarding running (separate terminal)
- [ ] Webhook secret copied to `.env`
- [ ] 6 products created in Stripe Dashboard
- [ ] All 6 Price IDs added to `.env`
- [ ] Backend started
- [ ] Test payment completed

