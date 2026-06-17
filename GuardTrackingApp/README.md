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

- `CLIENT_HANDOFF.md` — delivery overview and go-live checklist
- `docs/MOBILE_APP_ARCHITECTURE.md` — navigation, Redux, services
- `docs/API_REFERENCE.md` — backend endpoints
- `docs/DEPLOYMENT_GUIDE.md` — release builds
- `docs/TROUBLESHOOTING.md` — common issues
- `docs/USER_GUIDE.md` — role-based workflows
