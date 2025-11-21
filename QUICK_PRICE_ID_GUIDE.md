# Quick Guide: How to Get Price IDs

## Method 1: From Product Page (Easiest)

1. In Stripe Dashboard, click on a product name (e.g., "Basic Plan")
2. Scroll down to the **"Pricing"** section
3. You'll see the Price ID displayed (starts with `price_...`)
4. Click the copy icon next to it or manually copy it

## Method 2: From Products List

1. In the products list, click the **three dots (...)** next to a product
2. Select **"View product"** or **"Edit"**
3. Find the Price ID in the pricing section

## Method 3: From API/Code View

1. Click on a product
2. Look for a **"API"** or **"Code"** tab
3. The Price ID will be shown there

## What Price IDs Look Like

Price IDs always start with `price_` followed by a long string:
- Example: `price_1SVpTpLEsN8TIkgKxxxxxxxxxx`

## Important Notes

- **Monthly and Yearly are different Price IDs** - you need both!
- **Test mode Price IDs** start with `price_` (you're in test mode)
- **Each product has its own Price ID** - don't mix them up!

## Your 6 Price IDs Needed

1. ✅ Basic Plan - Monthly → `price_xxxxx`
2. ✅ Basic Plan - Yearly → `price_xxxxx`
3. ✅ Professional Plan - Monthly → `price_xxxxx`
4. ✅ Professional Plan - Yearly → `price_xxxxx`
5. ✅ Enterprise Plan - Monthly → `price_xxxxx`
6. ✅ Enterprise Plan - Yearly → `price_xxxxx`

Copy all 6 and add them to `backend/.env`!

