# Set Up Webhooks - Next Steps

## Step 1: Login to Stripe (One-time)

Run this command:
```powershell
stripe login
```

This will open your browser to authorize the CLI. Click "Allow access".

## Step 2: Start Webhook Forwarding

**IMPORTANT**: Keep this terminal open while testing!

```powershell
stripe listen --forward-to localhost:3000/api/payments/webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

## Step 3: Copy the Webhook Secret

Copy the `whsec_...` secret and add it to your `backend/.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Step 4: Keep It Running

**Keep this terminal window open** - webhook forwarding must stay running!

Open a **NEW terminal** for other commands.

---

## Next: Create Products in Stripe

After webhooks are set up, you need to create subscription products:

1. Go to: https://dashboard.stripe.com/test/products
2. Create 6 products (Basic/Pro/Enterprise × Monthly/Yearly)
3. Copy Price IDs and add to `.env`

See `NEXT_STEPS_AFTER_ENV_SETUP.md` for detailed product creation steps.

