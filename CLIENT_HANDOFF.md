# TracSOpro — Client Delivery Package

**Product:** TracSOpro (Guard Tracking Platform)  
**Package date:** June 2026  
**Delivery type:** Source code + documentation (backend API + React Native mobile app)

---

## What you receive

| Item | Description |
|------|-------------|
| Backend API | Node.js + Express + Prisma + PostgreSQL (`backend/`) |
| Mobile app | React Native app for Guard, Client, Admin, Super Admin (`GuardTrackingApp/`) |
| Documentation | Setup, deployment, architecture, API, and user guides (`docs/` + root guides) |
| Production server | **You configure** — see [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) |
| Android release keystore | **You generate** — see Deployment Guide → Android section |
| Signed production APK | **You build** after keystore setup |

**Stack:** Node.js 20+, PostgreSQL 16+, React Native 0.82  
**Production API:** `https://api.tracsopro.com/api`  
**PM2 process name:** `guard-tracking-api`

---

## Quick start (after unzip)

### 1. Install dependencies

```bash
cd backend && npm install
cd ../GuardTrackingApp && npm install
```

### 2. Backend (local)

```bash
cd backend
cp .env.example .env    # edit with your values
npx prisma generate
npx prisma migrate deploy   # production
npm run dev:db              # local development
```

Health check: `http://localhost:3000/api/health`

### 3. Mobile app (local)

```bash
cd GuardTrackingApp
npm start
# separate terminal:
npm run android
```

### 4. Production API URLs

Confirm in `GuardTrackingApp/src/config/apiConfig.ts`:

```typescript
const USE_LOCAL_LAN_RELEASE = false;
const PRODUCTION_API_URL = 'https://api.tracsopro.com/api';
const PRODUCTION_WS_URL = 'https://api.tracsopro.com';
```

---

## Go-live checklist

Complete these before production rollout:

1. Set production `.env` on server (`DATABASE_URL`, `JWT_SECRET`, SMTP, Stripe, Firebase) — see [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)
2. Run database migrations: `npx prisma migrate deploy`
3. Deploy backend and verify `/api/health`
4. Create Android release keystore → `GuardTrackingApp/android/keystore.properties`
5. Restrict Google Maps API key in Google Cloud Console
6. Configure Stripe webhook: `https://api.tracsopro.com/api/payments/webhook`
7. Build signed release APK — see [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
8. Smoke test all four roles (Guard, Client, Admin, Super Admin) against production API

---

## Documentation for delivery (convert to PDF)

These are the documents to share with your team. Convert each `.md` file to PDF before distribution.

| # | File | Audience | Purpose |
|---|------|----------|---------|
| 1 | `CLIENT_HANDOFF.md` | Project owner / IT lead | This package — overview, quick start, go-live checklist |
| 2 | `ENVIRONMENT_VARIABLES.md` | DevOps / backend engineer | Required server and app environment variables |
| 3 | `docs/DEPLOYMENT_GUIDE.md` | DevOps / release engineer | Production backend deploy, Android/iOS builds, migrations |
| 4 | `docs/USER_GUIDE.md` | End users / trainers | Role-based app workflows (Guard, Client, Admin, Super Admin) |
| 5 | `docs/TROUBLESHOOTING.md` | Support / IT | Common issues and fixes |
| 6 | `docs/SYSTEM_ARCHITECTURE.md` | Technical lead | End-to-end system design and data flow |
| 7 | `docs/API_REFERENCE.md` | Backend / integration developer | REST and WebSocket API endpoints |
| 8 | `docs/DATABASE_SCHEMA.md` | Backend / DBA | PostgreSQL models and relationships |
| 9 | `docs/MOBILE_APP_ARCHITECTURE.md` | Mobile developer | React Native structure, navigation, state |

**Optional reference** (include in source zip, PDF optional):

| File | Purpose |
|------|---------|
| `docs/README.md` | Documentation index |
| `backend/README.md` | Backend scripts and stack summary |
| `GuardTrackingApp/README.md` | Mobile app scripts and config notes |

---

## Source zip contents

When packaging for delivery, include:

```
tracsopro-client-delivery/
├── CLIENT_HANDOFF.md
├── ENVIRONMENT_VARIABLES.md
├── docs/
├── backend/
└── GuardTrackingApp/
```

**Exclude:** `.env`, `keystore.properties`, `node_modules/`, build artifacts, `.git/`

To clean build caches before zipping:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/clean-before-zip.ps1
```

To generate the zip automatically:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/create-client-delivery-zip.ps1
```

---

## Version info

- **Mobile app version:** 1.0.1 (see `GuardTrackingApp/android/app/build.gradle`)
- **Backend:** Prisma + PostgreSQL, Node.js 20+
- **Mobile stack:** React Native 0.82, React 19
