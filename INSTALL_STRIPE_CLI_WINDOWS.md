# Installing Stripe CLI on Windows

## Quick Installation (Recommended)

### Option 1: Using Scoop (Easiest)

If you have Scoop package manager:
```powershell
scoop install stripe
```

### Option 2: Manual Installation

1. **Download Stripe CLI**:
   - Go to: https://github.com/stripe/stripe-cli/releases/latest
   - Download: `stripe_X.X.X_windows_x86_64.zip` (or the latest version)

2. **Extract the ZIP file**:
   - Extract to a folder like `C:\stripe-cli\`

3. **Add to PATH**:
   - Right-click "This PC" → Properties
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find "Path" and click "Edit"
   - Click "New" and add: `C:\stripe-cli\` (or wherever you extracted it)
   - Click "OK" on all dialogs

4. **Restart your terminal** (close and reopen PowerShell)

5. **Verify installation**:
   ```powershell
   stripe --version
   ```

## Alternative: Use ngrok Instead

If you prefer not to install Stripe CLI, you can use ngrok:

1. **Download ngrok**: https://ngrok.com/download
2. **Extract and add to PATH** (same process as above)
3. **Start your backend**: `npm run dev`
4. **In another terminal, start ngrok**:
   ```powershell
   ngrok http 3000
   ```
5. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)
6. **In Stripe Dashboard**:
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - URL: `https://abc123.ngrok.io/api/payments/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.*`
   - Copy the "Signing secret" (starts with `whsec_...`)
   - Add to `.env` as `STRIPE_WEBHOOK_SECRET`

## Quick Test After Installation

Once Stripe CLI is installed:

```powershell
stripe login
stripe listen --forward-to localhost:3000/api/payments/webhook
```

