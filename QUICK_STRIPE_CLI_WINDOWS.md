# Quick Stripe CLI Installation for Windows

## Step 1: Download Stripe CLI

1. Go to: https://github.com/stripe/stripe-cli/releases/latest
2. Download: `stripe_X.X.X_windows_x86_64.zip` (the latest version)
3. Extract the ZIP file to: `C:\stripe-cli\`

## Step 2: Add to PATH

1. Press `Win + X` and select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", find "Path" and click "Edit"
5. Click "New" and add: `C:\stripe-cli\`
6. Click "OK" on all dialogs

## Step 3: Restart Terminal

Close and reopen PowerShell, then test:
```powershell
stripe --version
```

## Step 4: Use It

```powershell
stripe login
stripe listen --forward-to localhost:3000/api/payments/webhook
```

---

## Alternative: Use ngrok (Easier, No Installation Needed)

If you don't want to install Stripe CLI, use ngrok instead:

### 1. Download ngrok
- Go to: https://ngrok.com/download
- Download Windows version
- Extract to a folder

### 2. Start your backend
```powershell
cd backend
npm run dev
```

### 3. Start ngrok (in another terminal)
```powershell
ngrok http 3000
```

### 4. Copy the HTTPS URL
You'll see something like: `https://abc123.ngrok.io`

### 5. Add Webhook in Stripe Dashboard
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `https://abc123.ngrok.io/api/payments/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_...`)
7. Add to `backend/.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### 6. Keep ngrok running
Keep the ngrok terminal open while testing!

