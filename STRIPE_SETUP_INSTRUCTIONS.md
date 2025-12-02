# 💳 STRIPE SETUP INSTRUCTIONS

## ✅ **IMPLEMENTATION COMPLETE**

Stripe integration has been implemented in the codebase. Follow these steps to complete the setup:

---

## 📦 **STEP 1: Install Dependencies**

```bash
cd GuardTrackingApp
npm install @stripe/stripe-react-native
```

### **For iOS** (if applicable):
```bash
cd ios
pod install
cd ..
```

---

## 🔑 **STEP 2: Configure Stripe Keys**

### **Option A: Environment Variables** (Recommended)

Create or update `.env` file in `GuardTrackingApp/`:

```env
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### **Option B: Update stripeService.ts**

Edit `GuardTrackingApp/src/services/stripeService.ts`:

```typescript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_actual_publishable_key';
```

**⚠️ Important**: 
- Use `pk_test_...` for development/testing
- Use `pk_live_...` for production
- Never commit secret keys to version control

---

## 🚀 **STEP 3: Initialize Stripe in App**

The Stripe service will auto-initialize when first used. However, for better control, you can initialize it in `App.tsx`:

```typescript
import stripeService from './services/stripeService';

// In your App component or initialization code:
useEffect(() => {
  stripeService.initialize().catch(console.error);
}, []);
```

---

## ✅ **WHAT'S BEEN IMPLEMENTED**

### **1. Stripe Service** (`stripeService.ts`)
- ✅ Stripe initialization wrapper
- ✅ Publishable key configuration
- ✅ Initialization state management

### **2. Payment Screen** (`PaymentScreen.tsx`)
- ✅ PaymentSheet integration
- ✅ Payment intent processing
- ✅ Success/error handling
- ✅ Invoice refresh after payment

### **3. Payment Methods Screen** (`PaymentMethodsScreen.tsx`)
- ✅ Setup intent integration
- ✅ Payment method collection
- ✅ Success/error handling
- ✅ Payment methods refresh after addition

---

## 🧪 **TESTING**

### **Test Payment Flow**:
1. Navigate to Payment screen
2. Select an invoice
3. Tap "Pay Now"
4. Complete payment in Stripe PaymentSheet
5. Verify invoice status updates

### **Test Payment Method Addition**:
1. Navigate to Payment Methods screen
2. Tap "Add Payment Method"
3. Enter card details in Stripe PaymentSheet
4. Verify payment method appears in list

---

## 🔍 **TROUBLESHOOTING**

### **Error: "Stripe not initialized"**
- Ensure `stripeService.initialize()` is called
- Check that publishable key is set correctly

### **Error: "Payment failed"**
- Verify backend is returning valid `clientSecret`
- Check Stripe dashboard for payment intent status
- Ensure publishable key matches your Stripe account

### **iOS Build Issues**:
- Run `pod install` in `ios/` directory
- Clean build: `cd ios && xcodebuild clean`

### **Android Build Issues**:
- Clean build: `cd android && ./gradlew clean`
- Rebuild: `npm run android`

---

## 📝 **NEXT STEPS**

1. ✅ Install Stripe SDK: `npm install @stripe/stripe-react-native`
2. ✅ Configure publishable key
3. ✅ Test payment flow
4. ✅ Test payment method addition
5. ⚠️ Set up webhook handling (backend)
6. ⚠️ Configure production keys

---

## 🎯 **STATUS**

- ✅ Code implementation: **COMPLETE**
- ⚠️ Dependency installation: **PENDING** (run `npm install`)
- ⚠️ Key configuration: **PENDING** (set publishable key)
- ⚠️ Testing: **PENDING** (after installation)

---

**Ready to test once dependencies are installed and keys are configured!**


