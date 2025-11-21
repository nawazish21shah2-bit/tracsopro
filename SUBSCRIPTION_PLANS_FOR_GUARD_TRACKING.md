# Subscription Plans for Guard Tracking App

## Recommended Plans for Your App

Based on your guard tracking app features, here are suggested subscription plans:

---

## 🟢 Basic Plan - $49/month or $490/year (Save 17%)

**Target**: Small security companies (1-10 guards)

**Features**:
- ✅ Up to 10 guards
- ✅ Up to 5 client sites
- ✅ Real-time GPS tracking
- ✅ Basic incident reporting
- ✅ Shift scheduling
- ✅ Mobile app access
- ✅ Basic analytics dashboard
- ✅ Email support
- ✅ 1 admin user

**Best for**: Individual security professionals or small startups

---

## 🔵 Professional Plan - $149/month or $1,490/year (Save 17%)

**Target**: Medium security companies (11-50 guards)

**Features**:
- ✅ Everything in Basic
- ✅ Up to 50 guards
- ✅ Up to 20 client sites
- ✅ Advanced analytics & reporting
- ✅ Geofencing & route monitoring
- ✅ Incident management with evidence upload
- ✅ Automated shift scheduling
- ✅ Performance metrics & KPIs
- ✅ In-app messaging system
- ✅ Emergency alert system
- ✅ Priority email support
- ✅ Up to 5 admin users
- ✅ Custom reports & exports
- ✅ API access

**Best for**: Growing security companies with multiple clients

---

## 🟣 Enterprise Plan - $399/month or $3,990/year (Save 17%)

**Target**: Large security companies (50+ guards)

**Features**:
- ✅ Everything in Professional
- ✅ Unlimited guards
- ✅ Unlimited client sites
- ✅ White-label branding
- ✅ Custom integrations
- ✅ Advanced security features
- ✅ Dedicated account manager
- ✅ 24/7 priority support
- ✅ Unlimited admin users
- ✅ Custom training & onboarding
- ✅ SLA guarantees
- ✅ Advanced API access
- ✅ Multi-company management
- ✅ Custom feature development

**Best for**: Large security firms with multiple locations and enterprise clients

---

## 📋 Product Details for Stripe Dashboard

### Product 1: Basic Plan - Monthly
- **Name**: `Basic Plan`
- **Description**: `Perfect for small security companies. Track up to 10 guards across 5 sites with real-time GPS, shift scheduling, and basic reporting.`
- **Price**: `$49.00` USD
- **Billing**: `Monthly`

### Product 2: Basic Plan - Yearly
- **Name**: `Basic Plan (Yearly)`
- **Description**: `Save 17% with annual billing. Perfect for small security companies.`
- **Price**: `$490.00` USD
- **Billing**: `Yearly`

### Product 3: Professional Plan - Monthly
- **Name**: `Professional Plan`
- **Description**: `For growing security companies. Track up to 50 guards across 20 sites with advanced analytics, geofencing, incident management, and priority support.`
- **Price**: `$149.00` USD
- **Billing**: `Monthly`

### Product 4: Professional Plan - Yearly
- **Name**: `Professional Plan (Yearly)`
- **Description**: `Save 17% with annual billing. For growing security companies.`
- **Price**: `$1,490.00` USD
- **Billing**: `Yearly`

### Product 5: Enterprise Plan - Monthly
- **Name**: `Enterprise Plan`
- **Description**: `For large security firms. Unlimited guards and sites, white-label branding, custom integrations, dedicated support, and custom features.`
- **Price**: `$399.00` USD
- **Billing**: `Monthly`

### Product 6: Enterprise Plan - Yearly
- **Name**: `Enterprise Plan (Yearly)`
- **Description**: `Save 17% with annual billing. For large security firms.`
- **Price**: `$3,990.00` USD
- **Billing**: `Yearly`

---

## 💡 Alternative Pricing (If You Want Lower Entry Point)

If you want a more affordable entry point:

### Starter Plan - $29/month or $290/year
- Up to 5 guards
- Up to 3 sites
- Basic tracking only

### Basic Plan - $79/month or $790/year
- Up to 15 guards
- Up to 10 sites
- All basic features

### Professional Plan - $199/month or $1,990/year
- Up to 50 guards
- Up to 25 sites
- Advanced features

### Enterprise Plan - $499/month or $4,990/year
- Unlimited everything
- All features

---

## 🎯 Recommended Pricing Strategy

**I recommend the first set** ($49/$149/$399) because:

1. **Better value perception**: Higher prices suggest premium quality
2. **Room for discounts**: Can offer promotions without going too low
3. **Sustainable revenue**: Ensures you can maintain and improve the platform
4. **Clear differentiation**: Bigger gaps between tiers show clear value progression

---

## 📝 How to Create in Stripe

1. Go to: https://dashboard.stripe.com/test/products
2. Click "+ Add product"
3. Fill in the details from above
4. Make sure to:
   - Select "Recurring" pricing
   - Set correct amount
   - Choose Monthly or Yearly billing
   - Copy the Price ID after saving

5. Repeat for all 6 products

6. Update your `backend/.env` with all Price IDs

---

## 🔄 Update Your Backend Code

After creating products, you may want to update the plan amounts in `backend/src/services/paymentService.ts`:

```typescript
getPlanCatalog() {
  return {
    currency: (process.env.BILLING_CURRENCY || 'USD').toUpperCase(),
    plans: [
      {
        key: 'BASIC',
        name: 'Basic Plan',
        monthly: { 
          priceId: process.env.STRIPE_PRICE_BASIC_MONTHLY || '', 
          amount: 4900 // $49.00 in cents
        },
        yearly: { 
          priceId: process.env.STRIPE_PRICE_BASIC_YEARLY || '', 
          amount: 49000 // $490.00 in cents
        },
      },
      {
        key: 'PROFESSIONAL',
        name: 'Professional Plan',
        monthly: { 
          priceId: process.env.STRIPE_PRICE_PROF_MONTHLY || '', 
          amount: 14900 // $149.00 in cents
        },
        yearly: { 
          priceId: process.env.STRIPE_PRICE_PROF_YEARLY || '', 
          amount: 149000 // $1,490.00 in cents
        },
      },
      {
        key: 'ENTERPRISE',
        name: 'Enterprise Plan',
        monthly: { 
          priceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '', 
          amount: 39900 // $399.00 in cents
        },
        yearly: { 
          priceId: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || '', 
          amount: 399000 // $3,990.00 in cents
        },
      },
    ],
  };
}
```

---

## ✅ Next Steps

1. Create all 6 products in Stripe Dashboard
2. Copy all Price IDs
3. Add Price IDs to `backend/.env`
4. Update amounts in `paymentService.ts` if needed
5. Test the subscription flow!

