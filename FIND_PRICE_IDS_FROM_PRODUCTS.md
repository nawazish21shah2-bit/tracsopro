# How to Find Price IDs (Not Product IDs)

## ⚠️ Important: Price IDs vs Product IDs

- **Product ID** (what you're seeing): `prod_TSIgsNnu9aUVnd` - This is the product itself
- **Price ID** (what you need): `price_xxxxx` - This is the specific pricing for that product

## How to Get Price IDs

In each product page, look at the **"Pricing" section**:

1. **In the Pricing table**, you'll see a row with the price
2. **Click on the three dots (...)** on the right side of that pricing row
3. **OR click directly on the price** (e.g., "US$49.00")
4. This will show you the **Price ID** (starts with `price_...`)

## Alternative Method

1. In the **Pricing section**, look for a link or button that says **"View"** or **"Edit"** next to the price
2. Click on it
3. The Price ID will be displayed there (usually at the top or in a "Details" section)

## Quick Method (If Available)

Some Stripe interfaces show the Price ID directly in the Pricing table. Look for:
- A column that might say "Price ID" or "ID"
- Or hover over the price to see a tooltip
- Or check if there's an "API" or "Code" view option

## What You Need

For each of your 6 products, get the **Price ID** from the Pricing section:

1. ✅ Basic Plan → Get Monthly Price ID (`price_...`)
2. ✅ Basic Plan (Yearly) → Get Yearly Price ID (`price_...`)
3. ✅ Professional Plan → Get Monthly Price ID (`price_...`)
4. ✅ Professional Plan (Yearly) → Get Yearly Price ID (`price_...`)
5. ✅ Enterprise Plan → Get Monthly Price ID (`price_...`)
6. ✅ Enterprise Plan (Yearly) → Get Yearly Price ID (`price_...`)

## If You Can't Find Price IDs

If the Price IDs aren't visible in the UI:

1. **Click the three dots (...)** next to the price in the Pricing table
2. Select **"View price"** or **"Edit price"**
3. The Price ID will be shown in the price detail page
4. It's usually at the top, labeled "Price ID" or just shown as an ID starting with `price_`

## Once You Have All 6 Price IDs

Add them to `backend/.env`:

```env
STRIPE_PRICE_BASIC_MONTHLY=price_YOUR_ACTUAL_PRICE_ID
STRIPE_PRICE_BASIC_YEARLY=price_YOUR_ACTUAL_PRICE_ID
STRIPE_PRICE_PROF_MONTHLY=price_YOUR_ACTUAL_PRICE_ID
STRIPE_PRICE_PROF_YEARLY=price_YOUR_ACTUAL_PRICE_ID
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_YOUR_ACTUAL_PRICE_ID
STRIPE_PRICE_ENTERPRISE_YEARLY=price_YOUR_ACTUAL_PRICE_ID
```

