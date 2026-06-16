# GuardTrackingApp (TracsoPro Mobile)

React Native mobile app for Guard, Client, Admin, and Super Admin workflows.

## Run locally

```bash
cd GuardTrackingApp
npm install
npm start
```

In another terminal:

```bash
npm run android
# or
npm run ios
```

## Key scripts

- `npm start` - Metro bundler
- `npm run android` - run Android build
- `npm run ios` - run iOS build
- `npm run lint` - lint project
- `npm test` - run Jest tests
- `npm run android:release:local` - local release APK build helper

## Configuration

- API/WebSocket config: `src/config/apiConfig.ts`
- Ensure release builds use production API host (no local LAN override)

## Release reminders

- Use release keystore for Android production build.
- Do not ship with cleartext traffic enabled for production.
- Confirm push notification and deep-link routes per role before release.

## Related docs

- Root `START_HERE.md`
- Root `QUICK_START_GUIDE.md`
- Root `TESTING_PLAN.md`
- Root `RELEASE_READINESS_CHECKLIST.md`
