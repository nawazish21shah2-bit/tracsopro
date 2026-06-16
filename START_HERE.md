# START HERE

Use this file as the single entry point for new developers and release prep.

## 1) Local Run

1. Start backend:
   ```bash
   cd backend
   npm install
   npm run dev:db
   ```
2. Start mobile app:
   ```bash
   cd GuardTrackingApp
   npm install
   npm start
   ```
3. Launch app:
   ```bash
   npm run android
   # or
   npm run ios
   ```

## 2) Must-read docs

- `QUICK_START_GUIDE.md` - day-to-day setup and smoke test
- `LOCAL_DEV_SETUP.md` - local networking and environment notes
- `TESTING_PLAN.md` - test scenarios and flow checks
- `RELEASE_READINESS_CHECKLIST.md` - pre-client release gate
- `ENVIRONMENT_VARIABLES.md` - required backend/frontend environment values

## 3) Release-critical notes

- Do not ship with local LAN backend settings in `GuardTrackingApp/src/config/apiConfig.ts`.
- Do not ship with debug release signing in Android Gradle config.
- Run DB migrations using deploy-safe workflow before production rollout.

## 4) Current focus

- Security hardening
- Release configuration cleanup
- Client handoff readiness

