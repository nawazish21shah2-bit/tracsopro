# Release Readiness Checklist

Use this checklist before handing the app to client or publishing a production build.

## P0 - Must pass

- [ ] Backend WebSocket auth verifies JWT and rejects mismatched user/role.
- [ ] Mobile release is not using local LAN config (`USE_LOCAL_LAN_RELEASE` off).
- [ ] Android release signing uses release keystore (not debug signing).
- [ ] Cleartext traffic is disabled for production release path.
- [ ] Production `DATABASE_URL` and `JWT_SECRET` are configured.
- [ ] Stripe production keys and webhook secret are configured.
- [ ] OTP/email provider config is valid in production.

## P1 - High priority

- [ ] Deployment workflow uses deterministic installs (`npm ci`) and fail-fast migration step.
- [ ] Lockfiles are up to date with current `package.json` files.
- [ ] Core docs (`START_HERE`, `PROJECT_STATUS`, `QUICK_START_GUIDE`) have no dead links.
- [ ] Critical user flows tested manually for all roles.

## Functional smoke tests

- [ ] Guard: login, shifts, check-in/out, reports, notifications.
- [ ] Client: dashboard, guards, sites, reports, billing views.
- [ ] Admin: user/site/shift management and operations center.
- [ ] Super Admin: company management, billing, analytics.
- [ ] Chat and notification deep links navigate correctly.

## Security checks

- [ ] No default passwords, test credentials, or secrets in repo.
- [ ] No plaintext password storage in app.
- [ ] Production CORS origin is restricted.
- [ ] Logs do not expose OTP or sensitive tokens.

## Sign-off

- [ ] Engineering sign-off
- [ ] QA sign-off
- [ ] Product sign-off
- [ ] Client handoff package prepared
