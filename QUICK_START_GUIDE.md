# Quick Start Guide

## Local development (15 minutes)

### Backend
```bash
cd backend
npm install
npm run dev:db
```

### Mobile app
```bash
cd GuardTrackingApp
npm install
npm start
```

### Run on device/emulator
```bash
npm run android
# or
npm run ios
```

## Smoke test checklist

1. Login works for each role (Guard, Client, Admin, Super Admin).
2. Guard sees shift list and can check in/out.
3. Client can view sites, guards, and reports.
4. Admin can manage users/shifts/sites.
5. Notifications and chat load without crashes.

For deeper validation, use `TESTING_PLAN.md`.

## Pre-release quick checks

1. `GuardTrackingApp/src/config/apiConfig.ts` is set for production host.
2. Android release signing uses release keystore (not debug).
3. Backend WebSocket auth requires valid JWT.
4. Production env vars are set (see `ENVIRONMENT_VARIABLES.md`).
5. Release gate checklist is completed (`RELEASE_READINESS_CHECKLIST.md`).

