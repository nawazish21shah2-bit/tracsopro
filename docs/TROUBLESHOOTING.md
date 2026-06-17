# Troubleshooting

**Product:** TracSOpro  
**Last updated:** June 2026

Common issues and fixes for local development, backend, and mobile app.

## Quick diagnostics

| Symptom | First check |
|---------|-------------|
| App cannot reach API | `curl http://<IP>:3000/api/health` from the device network |
| Login fails | Backend logs, JWT_SECRET set, user `isEmailVerified` |
| No push notifications | Firebase service account path, device token registration |
| WebSocket disconnects | Token expiry, CORS, same host for REST and WS |
| Check-in rejected | GPS accuracy, site `radiusMeters`, location permissions |

---

## Local development

### Mobile app cannot connect to backend

**Symptoms:** Network error, timeout, or "Network request failed" on login.

**Causes and fixes:**

1. **Wrong LAN IP** — Update `DEV_LOCAL_IP` in `GuardTrackingApp/src/config/apiConfig.ts` to your machine's current IP (`ipconfig` on Windows, `ifconfig` on Mac/Linux).
2. **Firewall blocking port 3000** — Allow inbound TCP 3000 on your dev machine.
3. **Phone and laptop on different networks** — Both must be on the same WiFi.
4. **Android emulator** — Set `USE_ANDROID_EMULATOR = true` to use `10.0.2.2` instead of LAN IP.
5. **Backend not running** — Start with `cd backend && npm run dev:db`.

### Metro bundler issues

```bash
cd GuardTrackingApp
npm start -- --reset-cache
```

On Windows, stop Metro and rerun `npm start -- --reset-cache` from `GuardTrackingApp`.

### PersistGate stuck on "Loading app..."

The app has a 5-second timeout in `App.tsx`. If loading persists:

```bash
# Clear AsyncStorage (Android)
adb shell pm clear com.tracsopro
```

Then reinstall the app.

---

## Backend

### Database connection failed

**Error:** `Can't reach database server` or Prisma P1001.

**Fixes:**

1. Verify PostgreSQL is running: `pg_isready -h localhost -p 5432`
2. Check `DATABASE_URL` in `backend/.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/tracsopro
   ```
3. Create the database if missing: `createdb tracsopro`
4. Apply schema: `npx prisma migrate dev` or `npx prisma db push`

### Prisma migration errors

**Error:** Migration failed or drift detected.

```bash
cd backend
npx prisma migrate status        # Check pending migrations
npx prisma migrate deploy        # Apply in production
npx prisma migrate reset         # DEV ONLY — wipes data
```

Never run `migrate reset` on production.

### JWT / auth errors

| Error | Fix |
|-------|-----|
| 401 Unauthorized | Token expired — app should auto-refresh; check `REFRESH_TOKEN_EXPIRES_IN` |
| 403 Forbidden | User role lacks permission for the endpoint |
| 503 Maintenance | Super admin enabled maintenance mode — use super admin account or disable |

Verify `JWT_SECRET` is set and identical across restarts (changing it invalidates all tokens).

### OTP emails not sending

1. Check SMTP variables in `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
2. In development, `SMTP_DEV_BYPASS=true` logs OTP to console instead of sending email.
3. In production, set `SMTP_DEV_BYPASS=false`.

### Firebase / push notifications disabled

**Log:** `Firebase Admin NOT configured — push notifications disabled`

1. Place service account JSON at `backend/keys/firebase-service-account.json`.
2. Set `FIREBASE_SERVICE_ACCOUNT_PATH=./keys/firebase-service-account.json` in `.env`.
3. Restart the server.

### Stripe webhook failures

1. Verify `STRIPE_WEBHOOK_SECRET` matches the Stripe dashboard signing secret.
2. Webhook endpoint must be `POST /api/payments/webhook` with raw body (configured in `app.ts`).
3. Check `StripeWebhookEvent` table for duplicate event processing.

### WebSocket not connecting

1. Confirm the client uses `getWebSocketUrl()` from `apiConfig.ts` (same host as API).
2. Client must emit `authenticate` with a valid JWT after connecting.
3. Check server logs for `authentication_error` events.
4. In production, both REST and WS must use HTTPS/WSS.

### Rate limiting (429)

Auth endpoints have stricter rate limits. Wait and retry, or adjust `AUTH_RATE_LIMIT_MAX` in development.

---

## Mobile app

### Release APK points to local LAN

**Symptom:** Release build works on WiFi but fails elsewhere.

**Fix:** Set `USE_LOCAL_LAN_RELEASE = false` in `apiConfig.ts` and rebuild. See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

### Check-in fails — "Not within site radius"

1. Ensure location permissions are granted (foreground + background on Android).
2. Verify site has correct `latitude`, `longitude`, and `radiusMeters` in the database.
3. GPS accuracy must be within acceptable range (typically < 50m).
4. Test outdoors or near a window for better GPS signal.

### Location tracking stops in background

Android requires:
- `ACCESS_FINE_LOCATION` and `ACCESS_BACKGROUND_LOCATION` permissions.
- Battery optimization disabled for the app (device settings).
- Foreground service notification (configured in `AndroidManifest.xml`).

### Maps not loading

1. Verify Google Maps API key is configured for Android/iOS.
2. Check `react-native-maps` is linked correctly after native dependency changes.
3. Rebuild native project: `cd android && ./gradlew clean` then `npm run android`.

### Stripe payment errors

1. Confirm backend Stripe keys match the environment (test vs live).
2. Mobile Stripe publishable key must match the backend account.
3. Check backend logs for Stripe API errors on `/api/payments/*`.

### Chat messages not appearing in realtime

1. Verify WebSocket is connected and authenticated.
2. Ensure both users have joined the conversation room (`join_room`).
3. Fall back to REST: pull messages via `GET /api/chat/:chatId/messages`.

### Impersonation banner stuck

Super admin impersonation sets a flag in `authSlice`. Log out or call the impersonation exit endpoint to clear it.

---

## Android build issues

### Gradle build fails

```bash
cd GuardTrackingApp/android
./gradlew clean
cd ..
npm run android
```

### Release signing errors

1. Ensure `keystore.properties` exists (copy from `keystore.properties.example`).
2. Keystore file path must be correct relative to `android/app/`.
3. Do not use debug keystore for production releases.

### Cleartext traffic blocked

If HTTP dev URLs fail on Android 9+:
- Debug builds: `android:usesCleartextTraffic="true"` in `AndroidManifest.xml` (dev only).
- Release builds: use HTTPS only; remove cleartext config.

---

## Production deployment

### PM2 process crashed

```bash
pm2 logs guard-tracking-api --lines 100
pm2 restart guard-tracking-api
```

Common crash causes: missing env vars, database unreachable, port already in use.

### Migration deploy failed on server

1. SSH to the droplet.
2. Run `npx prisma migrate status` to see pending/failed migrations.
3. Fix the migration SQL if needed, or restore from backup before retrying.
4. Never use `db push` on production.

### CI deploy succeeded but API returns old behavior

1. Confirm PM2 restarted: `pm2 status`.
2. Check deploy logs for `prisma migrate deploy` output.
3. Verify the correct branch was deployed.

---

## Getting help

1. Check backend logs: `pm2 logs` or console output from `npm run dev:db`.
2. Check mobile logs: React Native debugger or `adb logcat` (Android).
3. Verify API with Swagger UI: `http://localhost:3000/api-docs`.
4. Run tenant isolation tests: `cd backend && npm run test:tenant`.

## Related documents

- [CLIENT_HANDOFF.md](../CLIENT_HANDOFF.md) — quick start and go-live checklist
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — production deploy
- [ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md) — env configuration
