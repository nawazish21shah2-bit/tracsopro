# Stripe Subscription Testing Guide 🧪

## 🚀 Quick Start

### Step 1: Start Backend Server

```bash
cd backend
npm run dev:db
```

**Expected Output:**
- Server should start on `http://localhost:3000`
- Database connection successful
- No errors related to Stripe configuration

---

### Step 2: Start Frontend App

```bash
cd GuardTrackingApp
npm start
# Then press 'a' for Android or 'i' for iOS
```

**Or if using Expo:**
```bash
npx expo start
```

---

## 📱 Testing Subscription Flow

### Prerequisites:
1. ✅ Backend server running on port 3000
2. ✅ Frontend app running
3. ✅ Admin account logged in

---

### Test Steps:

#### 1. **Navigate to Subscription Screen**
   - Login as **Admin** user
   - Go to **Admin Dashboard**
   - Tap on **Subscription** or **Upgrade** button
   - You should see 3 plans: Basic, Professional, Enterprise

#### 2. **Select a Plan**
   - Choose **Basic Plan** (easiest to test)
   - Select **Monthly** billing cycle
   - You should see:
     - Plan name: "Basic Plan"
     - Price: "$49.00/month"
     - Features list

#### 3. **Click Subscribe Button**
   - Tap **"Subscribe"** or **"Upgrade"** button
   - This should:
     - Create a Stripe checkout session
     - Open Stripe Checkout (web browser or in-app browser)

#### 4. **Complete Stripe Checkout**

   **Use Test Card:**
   ```
   Card Number: 4242 4242 4242 4242
   Expiry Date: 12/34 (any future date)
   CVC: 123 (any 3 digits)
   ZIP: 12345 (any 5 digits)
   ```

   **Steps:**
   - Enter card details
   - Click **"Pay"** or **"Subscribe"**
   - Should redirect to success page

#### 5. **Verify Success**
   - Should redirect back to app
   - Subscription status should update to "Active"
   - Plan should show as "Basic Plan"
   - Billing cycle should show "Monthly"

---

## 🧪 Test Scenarios

### Test 1: Basic Plan - Monthly Subscription
1. Select **Basic Plan**
2. Choose **Monthly**
3. Subscribe with test card
4. ✅ Should successfully subscribe

### Test 2: Professional Plan - Yearly Subscription
1. Select **Professional Plan**
2. Choose **Yearly**
3. Subscribe with test card
4. ✅ Should show $1,490.00/year
5. ✅ Should successfully subscribe

### Test 3: Enterprise Plan - Monthly Subscription
1. Select **Enterprise Plan**
2. Choose **Monthly**
3. Subscribe with test card
4. ✅ Should show $399.00/month
5. ✅ Should successfully subscribe

---

## 💳 Stripe Test Cards

### Success Cards:
```
✅ Standard Success:
   4242 4242 4242 4242

✅ 3D Secure Required:
   4000 0025 0000 3155
   (Will require authentication)

✅ Requires Authentication:
   4000 0027 6000 3184
```

### Failure Cards:
```
❌ Card Declined:
   4000 0000 0000 0002

❌ Insufficient Funds:
   4000 0000 0000 9995

❌ Expired Card:
   4000 0000 0000 0069
```

---

## 🔍 What to Check

### Backend Logs:
Watch for:
- ✅ "Creating Stripe checkout session"
- ✅ "Checkout session created successfully"
- ✅ No Stripe API errors

### Frontend:
- ✅ Plans load correctly
- ✅ Prices display correctly
- ✅ Checkout opens successfully
- ✅ Redirects work after payment

### Stripe Dashboard:
1. Go to: https://dashboard.stripe.com/test/subscriptions
2. Check for:
   - ✅ New subscription created
   - ✅ Payment successful
   - ✅ Customer created

---

## 🐛 Troubleshooting

### Issue: "Stripe price ID not configured"
**Solution:**
- Check `.env` file has all price IDs
- Restart backend server
- Verify price IDs match your Stripe dashboard

### Issue: Checkout doesn't open
**Solution:**
- Check backend logs for errors
- Verify `STRIPE_SECRET_KEY` is correct
- Check network connectivity

### Issue: Payment fails
**Solution:**
- Use correct test card: `4242 4242 4242 4242`
- Check card expiry is future date
- Verify CVC is 3 digits

### Issue: Redirect doesn't work
**Solution:**
- Check `STRIPE_SUCCESS_URL` in `.env`
- Verify URL matches your app's deep link setup
- Check backend logs for redirect URL

---

## 📊 Expected Results

### After Successful Subscription:
1. ✅ Subscription status: **Active**
2. ✅ Plan name: **Selected plan** (Basic/Professional/Enterprise)
3. ✅ Billing cycle: **Monthly/Yearly**
4. ✅ Next billing date: **Shown**
5. ✅ Subscription ID: **Created in database**

### In Stripe Dashboard:
1. ✅ New customer created
2. ✅ Subscription active
3. ✅ Payment successful
4. ✅ Invoice generated

---

## 🎯 Quick Test Checklist

- [ ] Backend server running
- [ ] Frontend app running
- [ ] Admin logged in
- [ ] Subscription screen loads
- [ ] Plans display correctly
- [ ] Prices show correctly
- [ ] Subscribe button works
- [ ] Stripe checkout opens
- [ ] Test card payment succeeds
- [ ] Redirects back to app
- [ ] Subscription status updates
- [ ] Subscription visible in Stripe dashboard

---

## 📝 Test Results Template

```
Test Date: ___________
Tester: ___________

Test 1: Basic Monthly
- [ ] Pass / [ ] Fail
- Notes: ___________

Test 2: Professional Yearly
- [ ] Pass / [ ] Fail
- Notes: ___________

Test 3: Enterprise Monthly
- [ ] Pass / [ ] Fail
- Notes: ___________

Issues Found:
1. ___________
2. ___________
```

---

## ✅ Success Criteria

Your Stripe integration is working if:
1. ✅ Plans load from backend
2. ✅ Checkout session creates successfully
3. ✅ Stripe checkout page opens
4. ✅ Test payment completes
5. ✅ Redirects back to app
6. ✅ Subscription status updates
7. ✅ Subscription appears in Stripe dashboard

---

## 🚨 Important Notes

- ⚠️ All tests use **TEST MODE** keys
- ⚠️ No real money is charged
- ⚠️ Test cards only work in test mode
- ⚠️ Subscriptions are in test mode
- ⚠️ Switch to live keys for production

---

## 📚 Additional Resources

- **Stripe Dashboard:** https://dashboard.stripe.com/test
- **Test Cards:** https://stripe.com/docs/testing
- **Webhooks:** https://stripe.com/docs/webhooks
- **API Docs:** https://stripe.com/docs/api

---

**Ready to test!** 🎉



