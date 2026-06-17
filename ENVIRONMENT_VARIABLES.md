# Environment Variables Reference

This file lists the minimum variables required for safe deployment.

## Backend (`backend/.env`)

### Core
- `NODE_ENV` (`development` | `production`)
- `PORT` (example: `3000`)
- `DATABASE_URL` (PostgreSQL connection string in production)
- `JWT_SECRET` (strong secret, minimum 32 chars)
- `JWT_EXPIRES_IN` (example: `30m`)
- `REFRESH_TOKEN_EXPIRES_IN` (example: `7d`)

### Security and CORS
- `CORS_ORIGIN` (production frontend/app host)
- `RATE_LIMIT_MAX`
- `AUTH_RATE_LIMIT_MAX`

### SMTP / OTP
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_DEV_BYPASS` (`false` in production)

### Stripe
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`
- `BILLING_PORTAL_RETURN_URL`

### Firebase (push notifications)
- `FIREBASE_SERVICE_ACCOUNT_PATH`
  - or inline service account env set supported by your deployment strategy

### Google Maps (Android)
- Restrict the Maps API key in Google Cloud Console (Android app restriction + API restriction).
- Key is referenced in `GuardTrackingApp/android/app/src/main/AndroidManifest.xml`.

## Mobile app (`GuardTrackingApp`)

### API endpoint safety
- Ensure `src/config/apiConfig.ts` does not point release builds to local LAN.
- Verify production host URLs are correct for both REST and WebSocket.

## Production validation

- Run backend with production env and confirm `/api/health`.
- Validate auth login, refresh token, and WebSocket authentication.
- Validate Stripe webhooks before production cutover.
- See [CLIENT_HANDOFF.md](CLIENT_HANDOFF.md) for the full go-live checklist.
