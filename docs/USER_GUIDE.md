# User Guide

**Product:** TracSOpro  
**Last updated:** June 2026

Role-based guide for Guards, Clients, Admins, and Super Admins using the TracSOpro mobile app.

## Getting started

1. Download and install the TracSOpro app (APK or App Store).
2. Open the app and complete onboarding.
3. Select your role and sign up or log in.
4. Guards and Clients need an **invitation code** from their security company.
5. Verify your email with the OTP sent to your inbox.
6. Complete your profile setup.

---

## Guard

Guards are field security officers who work assigned shifts, report incidents, and share their location while on duty.

### Home dashboard

The Home tab shows your current shift status, upcoming shifts, and quick actions. If you have an active shift, you will see check-in time and site details.

### Checking in and out

1. Go to the **Check In/Out** tab or tap Check In from Home.
2. Select your scheduled shift.
3. The app validates your GPS location against the site geofence.
4. Tap **Check In** when within the site radius.
5. At end of shift, tap **Check Out**.

**Tips:**
- Enable location permissions (including background location on Android).
- Stand near the site entrance for best GPS accuracy.
- If check-in fails, move closer to the site or wait for GPS to stabilize.

### Breaks

During an active shift:
1. Open the shift detail screen.
2. Tap **Start Break** and select break type.
3. Tap **End Break** when returning to duty.

### My Shifts

View upcoming, today's, and past shifts. Tap a shift for details including site address, schedule, and status.

### Incident reports

1. Go to the **Reports** tab.
2. Tap **Add Report**.
3. Select report type and enter a description.
4. Attach photos or videos as evidence.
5. Submit — admins and clients are notified.

You can also report incidents directly from an active shift.

### Emergency alert

If you are in immediate danger:
1. Use the emergency button on the Home or Check In/Out screen.
2. Your location is sent to admins and clients instantly.
3. Push notifications and in-app alerts are triggered.

Stay on the line with your supervisor after triggering an alert.

### Chat

Message supervisors, admins, or support through the **Chat** tab. Conversations are organized by contact or group.

### Settings

- Update profile and profile picture.
- Configure notification preferences.
- View attendance history and past jobs.
- Change password.
- Contact support or submit a ticket.

---

## Client

Clients manage sites, schedule shifts, monitor guards, and handle billing.

### Dashboard

The Dashboard tab shows active guards, site status, recent reports, and key metrics for your account.

### Sites and shifts

**Add a site:**
1. Go to **Sites & Shifts**.
2. Tap **Add Site**.
3. Enter site name, address, and location on the map.
4. Set the geofence radius (how close a guard must be to check in).
5. Save.

**Create a shift:**
1. Select a site.
2. Tap **Create Shift**.
3. Set date, start time, end time, and optional guard assignment.
4. Save — the security company admin can assign a guard if not specified.

**Bulk scheduling:** Use bulk create for recurring shift patterns.

### Monitoring guards

The **Guards** tab lists guards assigned to your sites. Tap a guard to view profile, current status, and location (when on duty).

Live guard positions appear on the map when guards are checked in.

### Reports

View incident and shift reports submitted by guards. Tap a report to read details and respond.

### Billing and payments

1. Go to **Settings** → Payment.
2. Add a payment method via Stripe.
3. View invoices and subscription status.
4. Enable auto-pay if available.

### Notifications

Receive alerts for incidents, emergency events, shift updates, and report responses.

---

## Admin

Admins operate a security company — managing users, sites, shifts, and day-to-day operations.

### Dashboard

Overview of active guards, today's shifts, open incidents, and recent activity.

### Operations center

Real-time view of guards on duty:
- Live map with guard positions.
- Active shifts and status.
- Emergency alerts requiring acknowledgment.
- Activity feed.

### User management

**Invite guards and clients:**
1. Go to **Management** → Invitations.
2. Create an invitation code (optionally tied to an email).
3. Share the code with the new user.
4. They register in the app using the code.

**Manage users:**
- View, edit, activate, or deactivate guards and clients.
- Assign guards to shifts.

### Site and shift management

- Create and edit sites for clients.
- Schedule shifts individually or in bulk.
- Assign guards to unassigned shifts.
- View 30-day shift schedule.

### Reports and analytics

- Review incident reports from guards.
- Respond to or escalate reports.
- View analytics: shift completion, incident trends, guard performance.

### Company settings

- Update company profile and logo.
- Manage subscription and billing (Stripe).
- Configure notification defaults.
- System settings for the company.

### Emergency response

When a guard triggers an emergency alert:
1. You receive a push notification and in-app alert.
2. Open the alert to see guard location and details.
3. Tap **Acknowledge** to confirm you are responding.
4. Tap **Resolve** when the situation is handled.

---

## Super Admin

Super Admins manage the TracSOpro platform — onboarding security companies, billing, and platform configuration.

### Dashboard

Platform-wide metrics: total companies, active subscriptions, revenue, and system health.

### Company management

**Create a company:**
1. Go to **Companies**.
2. Tap **Create Company**.
3. Enter company details, plan limits, and admin email.
4. The admin receives access to set up their tenant.

**Manage companies:**
- View and edit company details.
- Change subscription plan and status.
- Suspend or reactivate companies.
- Open Stripe billing portal for a company.

### Analytics and audit

- Platform analytics: growth, engagement, revenue.
- Audit logs: track super-admin actions, impersonation, and config changes.

### Billing

View all platform payments, invoices, and subscription analytics. Manage payment status and resolve billing issues.

### Impersonation

To troubleshoot a user issue:
1. Go to **Settings** → Impersonate User.
2. Search for the user and tap **Impersonate**.
3. The app reloads as that user (banner shown at top).
4. Exit impersonation from the banner or Settings.

### System settings

- Platform-wide configuration (maintenance mode, feature flags).
- Export platform data.
- Global notification and security settings.

---

## Common tasks (all roles)

| Task | Where |
|------|-------|
| Change password | Settings → Change Password |
| Update notification prefs | Settings → Notifications |
| Contact support | Settings → Support → New Ticket |
| View notifications | Notifications tab or bell icon |
| Log out | Settings → Log Out |

## Support

Submit a support ticket from Settings → Support. Choose a category (Technical, Billing, General, Urgent) and describe your issue. You will receive replies in the ticket thread and via chat if linked.

Platform-level issues (super admin only) use audience **PLATFORM**. Company issues use audience **COMPANY**.

## Related documents

- [MOBILE_APP_ARCHITECTURE.md](./MOBILE_APP_ARCHITECTURE.md) — technical app structure
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — common issues
