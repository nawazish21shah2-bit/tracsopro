# Stripe Products & Price IDs Reference

## 📦 Complete Product Catalog

### Basic Plan

#### Monthly
- **Product ID:** `prod_TSlgsNnu9aUVnd`
- **Price ID:** `price_1SVq8hLEsN8TIkgKqWajK9Jr`
- **Price:** $49.00 USD per month
- **Status:** Active

#### Yearly
- **Product ID:** `prod_TSIgE0m2K3IfKO` (or `prod_TSlgE0m2K3IfKO`)
- **Price ID:** `price_1SVq9HLEsN8TIkgKYDO0dcQi`
- **Price:** $490.00 USD per year
- **Description:** "Save 17% with annual billing. Perfect for small security companies."
- **Status:** Active

---

### Professional Plan

#### Monthly
- **Product ID:** `prod_TSlhj2lcoKM8MB`
- **Price ID:** `price_1SVqAWLEsN8TIkgKB2WfqrdU`
- **Price:** $149.00 USD per month
- **Description:** "For growing security companies. Track up to 50 guards across 20 sites with advanced"
- **Status:** Active

#### Yearly
- **Product ID:** `prod_TSliadFgfYDYXL`
- **Price ID:** `price_1SVqBGLEsN8TIkgKAOvvkvwf`
- **Price:** $1,490.00 USD per year
- **Description:** "Save 17% with annual billing. For growing security companies."
- **Status:** Active

---

### Enterprise Plan

#### Monthly
- **Product ID:** `prod_TSIjHbMg4r3rv5` (or `prod_TSljHbMg4r3rv5`)
- **Price ID:** `price_1SVqBeLEsN8TIkgKSCns2WNC`
- **Price:** $399.00 USD per month
- **Status:** Active

#### Yearly
- **Product ID:** `prod_TSljpfwlJVf0vL`
- **Price ID:** `price_1SVqBqLEsN8TIkgKyIapap0b`
- **Price:** $3,990.00 USD per year
- **Status:** Active

---

## 🔑 Environment Variables

Add these to your `backend/.env` file:

```env
# Stripe Configuration
# ⚠️ IMPORTANT: Replace with your actual Stripe keys from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE

# Stripe Price IDs (for subscription checkout)
STRIPE_PRICE_BASIC_MONTHLY=price_1SVq8hLEsN8TIkgKqWajK9Jr
STRIPE_PRICE_BASIC_YEARLY=price_1SVq9HLEsN8TIkgKYDO0dcQi
STRIPE_PRICE_PROF_MONTHLY=price_1SVqAWLEsN8TIkgKB2WfqrdU
STRIPE_PRICE_PROF_YEARLY=price_1SVqBGLEsN8TIkgKAOvvkvwf
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1SVqBeLEsN8TIkgKSCns2WNC
STRIPE_PRICE_ENTERPRISE_YEARLY=price_1SVqBqLEsN8TIkgKyIapap0b

# Stripe URLs
STRIPE_SUCCESS_URL=http://localhost:3000/admin/subscription?success=true
STRIPE_CANCEL_URL=http://localhost:3000/admin/subscription?canceled=true
BILLING_PORTAL_RETURN_URL=http://localhost:3000/admin/subscription

# Billing
BILLING_CURRENCY=USD
```

---

## 📊 Pricing Summary

| Plan | Monthly | Yearly | Savings |
|------|---------|--------|---------|
| **Basic** | $49.00 | $490.00 | 17% (2 months free) |
| **Professional** | $149.00 | $1,490.00 | 17% (2 months free) |
| **Enterprise** | $399.00 | $3,990.00 | 17% (2 months free) |

---

## ✅ Verification

All products are:
- ✅ Active in Stripe
- ✅ Price IDs retrieved
- ✅ Product IDs documented
- ✅ Ready for integration

---

## 🔗 Stripe Dashboard Links

- **Products:** https://dashboard.stripe.com/test/products
- **Prices:** https://dashboard.stripe.com/test/prices
- **Subscriptions:** https://dashboard.stripe.com/test/subscriptions

---

## 📝 Notes

- All prices are in **USD**
- All products are in **Test Mode**
- Yearly plans offer **17% savings** (2 months free)
- Product IDs can be used for webhook verification
- Price IDs are used for creating checkout sessions



