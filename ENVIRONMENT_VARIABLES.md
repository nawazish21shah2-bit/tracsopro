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

### Redis (optional — multi-instance / scale)
- `REDIS_URL` (example: `redis://localhost:6379`)
  - Enables shared OTP rate limits, BullMQ push retry queue, and Socket.IO cross-node broadcast
  - Local dev: `docker compose up -d redis` from repo root, then set `REDIS_URL=redis://localhost:6379`

### PostgreSQL / PgBouncer (optional — connection pooling)
- `DATABASE_URL` — app runtime connection (use PgBouncer port when pooling)
  - Direct Postgres (local dev): `postgresql://tracsopro:tracsopro@localhost:5432/tracsopro`
  - Via PgBouncer: `postgresql://tracsopro:tracsopro@localhost:6432/tracsopro?pgbouncer=true`
- `DIRECT_DATABASE_URL` — direct Postgres URL for Prisma migrations (required when using PgBouncer)
  - Example: `postgresql://tracsopro:tracsopro@localhost:5432/tracsopro`
  - When not using PgBouncer, set the same value as `DATABASE_URL`

### S3 object storage (optional — profile pictures)
- `S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (default: `us-east-1`)
  - When set, profile pictures upload to S3; the API serves them via authenticated `/api/uploads/profile-pictures/:filename` redirects to signed URLs
  - When unset, files remain on local disk under `uploads/profile-pictures/`

### Google Maps (Android)
- Restrict the Maps API key in Google Cloud Console (Android app restriction + API restriction).
- Key is referenced in `GuardTrackingApp/android/app/src/main/AndroidManifest.xml`.

## Mobile app (`GuardTrackingApp`)

### Android SDK (local development — Windows)

Set these **user** environment variables (System Properties → Environment Variables, or run `GuardTrackingApp/scripts/move-android-sdk-to-d.ps1`):

| Variable | Example value |
|---|---|
| `ANDROID_HOME` | `D:\Android\Sdk` |
| `ANDROID_SDK_ROOT` | `D:\Android\Sdk` |
| `GRADLE_USER_HOME` | `D:\gradle-cache` |

Add to **user** `Path`:

- `%ANDROID_HOME%\platform-tools`
- `%ANDROID_HOME%\emulator`
- `%ANDROID_HOME%\cmdline-tools\latest\bin`

Project file `GuardTrackingApp/android/local.properties` (gitignored, machine-specific):

```properties
sdk.dir=D:/Android/Sdk
```

After changing SDK location, restart terminals and Android Studio. In Android Studio: **Settings → Languages & Frameworks → Android SDK** → set SDK location to `D:\Android\Sdk`.

### API endpoint safety
- Ensure `src/config/apiConfig.ts` does not point release builds to local LAN.
- Verify production host URLs are correct for both REST and WebSocket.

## Production validation

- Run backend with production env and confirm `/api/health`.
- Validate auth login, refresh token, and WebSocket authentication.
- Validate Stripe webhooks before production cutover.
- See [CLIENT_HANDOFF.md](CLIENT_HANDOFF.md) for the full go-live checklist.
