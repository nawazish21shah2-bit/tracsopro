# API Reference

**Product:** TracSOpro  
**Base URL:** `https://api.tracsopro.com/api` (production) or `http://localhost:3000/api` (local)  
**Last updated:** June 2026

## Overview

The TracSOpro backend is a REST API built with Express and TypeScript. All routes are prefixed with `/api` unless noted otherwise.

| Item | Value |
|------|-------|
| Interactive docs | Swagger UI at `/api-docs` when the server is running |
| Auth scheme | `Authorization: Bearer <access_token>` |
| Response shape | `{ success: boolean, data?: any, message?: string, error?: string }` |
| WebSocket | Socket.io on the same host as the API (see [WebSocket events](#websocket-socketio)) |

## Authentication

### Public endpoints (`/api/auth`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/maintenance-status` | Platform maintenance flag |
| POST | `/register` | Register guard, client, or admin |
| POST | `/login` | Returns access + refresh tokens |
| POST | `/refresh` | Rotate access token |
| POST | `/logout` | Revoke refresh token |
| POST | `/verify-otp` | Verify email OTP |
| POST | `/resend-otp` | Resend OTP email |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password with token |

### Authenticated endpoints (`/api/auth`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Current user profile |
| PUT | `/profile` | Update profile |
| POST | `/change-password` | Change password |

**Registration notes:**
- **GUARD** and **CLIENT** require a valid `invitationCode` from their security company.
- **ADMIN** registration creates a new `SecurityCompany` and links the user as owner.

## Users (`/api/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/profile-picture` | JWT | Upload profile picture (multipart) |
| PATCH | `/profile-picture` | JWT | Update profile picture |
| DELETE | `/profile-picture` | JWT | Remove profile picture |

## Guards (`/api/guards`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | ADMIN | List guards |
| GET | `/:id` | ADMIN | Guard details |
| PUT | `/profile` | GUARD | Update own profile |
| PUT | `/:id` | ADMIN | Update guard |
| DELETE | `/:id` | ADMIN | Deactivate/remove guard |
| POST | `/:id/emergency-contacts` | ADMIN, GUARD | Add emergency contact |
| POST | `/:id/qualifications` | ADMIN, GUARD | Add qualification |
| GET | `/:id/performance` | ADMIN, GUARD | Performance metrics |

## Clients (`/api/clients`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | ADMIN | List clients |
| GET | `/stats` | ADMIN | Client statistics |
| GET | `/:id` | ADMIN | Client details |
| GET | `/my-profile` | CLIENT | Own profile |
| PUT | `/profile` | CLIENT | Update own profile |
| GET | `/dashboard/stats` | CLIENT | Dashboard metrics |
| GET | `/my-guards` | CLIENT | Guards assigned to client sites |
| GET | `/guards/:guardId` | CLIENT | Guard detail |
| GET | `/my-reports` | CLIENT | Incident/shift reports |
| GET | `/my-sites` | CLIENT | Client sites |
| GET | `/my-shifts` | CLIENT | Client shifts |
| GET | `/my-notifications` | CLIENT | Notifications |
| PUT | `/reports/:reportId/respond` | CLIENT | Respond to a report |
| POST | `/shifts` | CLIENT | Create shift |
| POST | `/shifts/bulk` | CLIENT | Bulk create shifts |
| PUT | `/shifts/:shiftId` | CLIENT | Update shift |
| DELETE | `/shifts/:shiftId` | CLIENT | Cancel shift |
| PUT | `/:id` | ADMIN | Update client |
| DELETE | `/:id` | ADMIN | Remove client |

## Sites (`/api/sites`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/` | CLIENT | Create site |
| GET | `/my-sites` | CLIENT | List own sites |
| GET | `/active` | GUARD, ADMIN | Active sites |
| GET | `/:id` | JWT | Site details |
| PUT | `/:id` | CLIENT | Update site |
| DELETE | `/:id` | CLIENT | Delete site |

## Shifts — guard (`/api/shifts`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/active` | Current active shift |
| GET | `/upcoming` | Upcoming shifts |
| GET | `/today` | Today's shifts |
| GET | `/past` | Past shifts |
| GET | `/weekly-summary` | Weekly summary |
| GET | `/schedule/30-days` | 30-day schedule |
| GET | `/statistics` | Guard shift stats |
| GET | `/:id` | Shift details |
| GET | `/:id/active-break` | Active break on shift |
| POST | `/:id/check-in` | Check in (GPS validated) |
| POST | `/:id/check-out` | Check out |
| POST | `/:id/start-break` | Start break |
| POST | `/:shiftId/end-break/:breakId` | End break |
| POST | `/:id/report-incident` | Report shift incident |

## Shifts — admin (`/api/admin/shifts`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | ADMIN | List shifts |
| GET | `/schedule/30-days` | ADMIN | 30-day schedule |
| GET | `/unassigned` | ADMIN | Unassigned shifts |
| POST | `/` | ADMIN | Create shift |
| POST | `/bulk` | ADMIN | Bulk create |
| PATCH | `/:shiftId/assign-guard` | ADMIN | Assign guard |
| PUT | `/:shiftId` | ADMIN | Update shift |
| DELETE | `/:shiftId` | ADMIN | Delete shift |

## Shift reports (`/api/shift-reports`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/company` | ADMIN | Company shift reports |
| POST | `/` | GUARD | Submit report |
| GET | `/` | GUARD | List own reports |
| GET | `/:id` | GUARD | Report detail |
| PUT | `/:id` | GUARD | Update report |
| DELETE | `/:id` | GUARD | Delete report |
| GET | `/shift/:shiftId` | JWT | Reports for a shift |

## Tracking (`/api/tracking`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/location` | GUARD | Upload GPS point |
| POST | `/geofence-event` | GUARD | Record geofence enter/exit |
| POST | `/check-geofences/:guardId` | GUARD | Evaluate geofences |
| GET | `/history/:guardId` | ADMIN, CLIENT | Location history |
| GET | `/:guardId/latest` | ADMIN, CLIENT | Latest location |
| GET | `/live-locations` | ADMIN, CLIENT | All live guard locations |
| GET | `/geofence-events/:guardId` | ADMIN, CLIENT | Geofence events |
| GET | `/real-time-data` | ADMIN, CLIENT | Real-time tracking bundle |
| GET | `/analytics` | ADMIN | Tracking analytics |

## Incidents (`/api/incidents`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | ADMIN, SUPER_ADMIN | List incidents |
| GET | `/stats` | ADMIN, SUPER_ADMIN | Incident statistics |
| GET | `/:id` | JWT | Incident detail |
| POST | `/` | JWT | Create incident |
| PUT | `/:id` | ADMIN, SUPER_ADMIN | Update incident |
| POST | `/:id/evidence` | JWT | Upload evidence |

## Incident reports (`/api/incident-reports`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/` | GUARD | Submit incident report |
| GET | `/` | GUARD | List own reports |
| GET | `/:id` | JWT | Report detail |
| PUT | `/:id` | GUARD | Update report |
| DELETE | `/:id` | GUARD | Delete report |
| PUT | `/:id/respond` | ADMIN, CLIENT | Respond to report |
| GET | `/admin/all` | ADMIN | All company reports |
| GET | `/admin/stats` | ADMIN | Report statistics |

## Emergency (`/api/emergency`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/alert` | GUARD | Trigger emergency alert |
| GET | `/my-active` | GUARD | Active alert for guard |
| POST | `/alert/:alertId/acknowledge` | ADMIN, CLIENT | Acknowledge alert |
| POST | `/alert/:alertId/resolve` | ADMIN | Resolve alert |
| GET | `/alerts/active` | ADMIN, CLIENT | Active alerts |
| GET | `/guard/:guardId/history` | Mixed | Alert history |
| GET | `/statistics` | Mixed | Emergency statistics |

## Notifications (`/api/notifications`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List notifications |
| GET | `/stats` | Unread counts |
| GET | `/push-status` | FCM registration status |
| POST | `/test-push` | Send test push |
| POST | `/register-device` | Register FCM device token |
| POST | `/record-event` | Record notification event |
| PUT | `/:id/read` | Mark as read |
| PUT | `/read-all` | Mark all as read |
| DELETE | `/` | Clear all |
| DELETE | `/:id` | Delete notification |

## Chat (`/api/chat`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List conversations |
| GET | `/search` | Search conversations |
| GET | `/support` | Support conversation |
| POST | `/` | Create conversation |
| POST | `/support` | Open support chat |
| POST | `/support/company` | Company support chat |
| GET | `/:chatId` | Conversation detail |
| GET | `/:chatId/messages` | Message history |
| POST | `/:chatId/messages` | Send message |
| POST | `/:chatId/read` | Mark messages read |

## Settings (`/api/settings`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/notifications` | JWT | Notification preferences |
| PUT | `/notifications` | JWT | Update preferences |
| GET | `/profile` | JWT | Settings profile |
| PUT | `/profile` | JWT | Update settings profile |
| POST | `/support/contact` | JWT | Contact support |
| GET | `/support/tickets` | JWT | List support tickets |
| GET | `/support/tickets/:id` | JWT | Ticket detail |
| GET | `/attendance-history` | GUARD | Attendance history |
| GET | `/past-jobs` | GUARD | Past jobs |
| GET | `/company` | CLIENT | Company settings |
| PUT | `/company` | CLIENT | Update company settings |
| POST | `/change-password` | JWT | Change password |

## Payments (`/api/payments`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/intent` | CLIENT | Create payment intent |
| POST | `/setup-intent` | CLIENT | Setup payment method |
| POST | `/auto-pay` | CLIENT | Enable auto-pay |
| POST | `/invoice` | ADMIN | Create invoice |
| POST | `/invoice/monthly` | ADMIN | Generate monthly invoice |
| GET | `/methods` | CLIENT, ADMIN | Payment methods |
| GET | `/invoices` | CLIENT, ADMIN | Invoice list |
| GET | `/plans` | ADMIN, SUPER_ADMIN | Subscription plans |
| POST | `/subscriptions/checkout` | ADMIN, SUPER_ADMIN | Stripe checkout |
| POST | `/portal` | ADMIN, SUPER_ADMIN | Billing portal session |

**Stripe webhook** (not under `/api` prefix): `POST /api/payments/webhook` — registered on the Express app root with raw body parsing for Stripe signature verification.

## Admin (`/api/admin`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/subscription` | Company subscription |
| GET | `/dashboard/stats` | Dashboard statistics |
| GET | `/dashboard/activity` | Recent activity |
| GET | `/company` | Company profile |
| PUT | `/company` | Update company |

### Admin users (`/api/admin/users`)

CRUD for company users, plus `PATCH /:id/status` for activate/deactivate.

### Admin sites (`/api/admin/sites`)

CRUD for company sites.

### Admin clients (`/api/admin/clients`)

List and manage client relationships.

### Admin operations (`/api/admin/operations`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/metrics` | Operations metrics |
| GET | `/guards` | Guards on duty |
| GET | `/activity` | Live activity feed |

### Admin invitations (`/api/admin/invitations`)

Create, list, revoke invitation codes for guard/client onboarding.

## Super Admin (`/api/super-admin`)

All routes require `SUPER_ADMIN` role.

| Area | Key endpoints |
|------|---------------|
| Overview | `GET /overview` |
| Companies | `GET/POST /companies`, `GET/PUT/PATCH /companies/:id`, subscription & checkout |
| Analytics | `GET /analytics` |
| Billing | `GET /billing`, `/payments`, `/payments/analytics`, `/:id`, status patch |
| Platform | `GET/PUT /settings`, `POST /export-data`, `GET /audit-logs` |
| Users | `GET /users`, `POST /impersonate` |

## Health and legacy

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health check |
| GET | `/locations` | Legacy stub (returns `[]`) |
| GET/POST | `/messages` | Legacy stub |

## WebSocket (Socket.io)

Connect to the same host as the API (e.g. `https://api.tracsopro.com`). After connecting, emit `authenticate` with `{ token, userId?, role? }`.

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `authenticate` | `{ token, userId?, role? }` | JWT validation |
| `location_update` | GPS coordinates | Guard location upload |
| `geofence_event` | Geofence data | Enter/exit event |
| `emergency_alert` | Alert payload | Emergency broadcast |
| `shift_status_update` | Shift status | Shift lifecycle update |
| `request_live_locations` | — | Request current locations |
| `join_room` | `{ roomId }` | Join chat or ops room |
| `leave_room` | `{ roomId }` | Leave room |

### Server → Client

| Event | Description |
|-------|-------------|
| `authenticated` / `authentication_error` | Auth result |
| `guard_location_update` | Single guard location (admins) |
| `live_locations_update` | Periodic broadcast (every ~30s) |
| `live_locations_data` | Response to `request_live_locations` |
| `geofence_event` | Geofence notification |
| `emergency_alert` / `emergency_broadcast` | Emergency notifications |
| `shift_status_changed` | Shift status change |
| `room_joined` / `room_left` | Room membership |
| `notification` | In-app notification push |

## Error codes

| HTTP | Meaning |
|------|---------|
| 400 | Validation error |
| 401 | Missing or invalid token |
| 403 | Insufficient role or tenant access |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 503 | Maintenance mode (non–super-admin blocked) |

## Related documents

- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) — system overview
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — data models
- Swagger UI at `/api-docs` — full request/response schemas
