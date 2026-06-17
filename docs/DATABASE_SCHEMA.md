# Database Schema

**Database:** PostgreSQL  
**ORM:** Prisma (`backend/prisma/schema.prisma`)  
**Last updated:** June 2026

## Overview

TracSOpro uses a multi-tenant schema centered on `SecurityCompany`. Users belong to the platform with a `Role` enum; guards, clients, and admins are linked to companies through join tables. All migrations live in `backend/prisma/migrations/`.

```
SecurityCompany
├── CompanyUser      → User (ADMIN)
├── CompanyGuard     → Guard → User (GUARD)
├── CompanyClient    → Client → User (CLIENT)
├── CompanySite      → Site
├── Invitation
├── Subscription
└── BillingRecord

Site → Shift → ShiftBreak, ShiftIncident, ShiftReport, ShiftCheckpoint
Guard → TrackingRecord, GeofenceEvent, IncidentReport
```

## Enums

| Enum | Values |
|------|--------|
| `Role` | GUARD, ADMIN, CLIENT, SUPER_ADMIN |
| `AccountType` | INDIVIDUAL, COMPANY |
| `GuardStatus` | ACTIVE, ON_DUTY, OFF_DUTY, ON_LEAVE, SUSPENDED, TERMINATED |
| `ShiftStatus` | SCHEDULED, IN_PROGRESS, ON_BREAK, COMPLETED, CANCELLED, NO_SHOW, EARLY_END |
| `IncidentType` | SECURITY_BREACH, THEFT, VANDALISM, SUSPICIOUS_ACTIVITY, MEDICAL_EMERGENCY, FIRE, NATURAL_DISASTER, EQUIPMENT_FAILURE, OTHER |
| `IncidentSeverity` | LOW, MEDIUM, HIGH, CRITICAL |
| `IncidentStatus` | REPORTED, INVESTIGATING, RESOLVED, CLOSED, ESCALATED |
| `SubscriptionPlan` | BASIC, PROFESSIONAL, ENTERPRISE, CUSTOM |
| `SubscriptionStatus` | TRIAL, ACTIVE, SUSPENDED, CANCELLED, EXPIRED |
| `GeofenceEventType` | ENTER, EXIT |
| `BreakType` | REGULAR, LUNCH, EMERGENCY, UNAUTHORIZED |
| `NotificationType` | SHIFT_REMINDER, INCIDENT_ALERT, MESSAGE, SYSTEM, EMERGENCY |
| `ConversationType` | DIRECT, GROUP, TEAM |
| `SupportAudience` | COMPANY, PLATFORM |
| `SupportStatus` | OPEN, IN_PROGRESS, RESOLVED, CLOSED |

## Core identity

### User

Central authentication record for all roles.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| email | String | Unique |
| password | String | bcrypt hash |
| firstName, lastName | String | Display name |
| role | Role | GUARD, ADMIN, CLIENT, SUPER_ADMIN |
| accountType | AccountType? | INDIVIDUAL or COMPANY |
| isEmailVerified | Boolean | OTP verification gate |
| isActive | Boolean | Soft disable |

**Relations:** one-to-one with `Guard` or `Client`; many `RefreshToken`, `DeviceToken`, `Notification`.

### Guard

Field officer profile linked to `User`.

| Field | Type | Notes |
|-------|------|-------|
| employeeId | String | Unique per guard |
| status | GuardStatus | ACTIVE, ON_DUTY, etc. |
| certificationUrls | String[] | Document URLs |

**Relations:** `Shift[]`, `TrackingRecord[]`, `IncidentReport[]`, `CompanyGuard[]`.

### Client

Client organization profile linked to `User`.

| Field | Type | Notes |
|-------|------|-------|
| accountType | AccountType | INDIVIDUAL or COMPANY |
| companyName | String? | For company accounts |

**Relations:** `Site[]`, `Shift[]`, `CompanyClient[]`.

## Operations

### Site

Physical location managed by a client.

| Field | Type | Notes |
|-------|------|-------|
| clientId | UUID | Owner client |
| latitude, longitude | Float? | Map coordinates |
| radiusMeters | Int | Geofence radius (default 100) |
| isActive | Boolean | Soft disable |

### Shift

Work assignment linking guard, site, and client.

| Field | Type | Notes |
|-------|------|-------|
| guardId | UUID? | Nullable until assigned |
| siteId, clientId | UUID? | Site and client refs |
| scheduledStartTime, scheduledEndTime | DateTime | Planned window |
| actualStartTime, actualEndTime | DateTime? | Check-in/out times |
| status | ShiftStatus | Lifecycle state |
| checkInLocation, checkOutLocation | Json? | GPS snapshot |

**Lifecycle:** `SCHEDULED` → `IN_PROGRESS` → (`ON_BREAK`) → `COMPLETED`

### ShiftBreak

Break periods during an active shift.

| Field | Type | Notes |
|-------|------|-------|
| shiftId | UUID | Parent shift |
| startTime, endTime | DateTime? | Break window |
| breakType | BreakType | REGULAR, LUNCH, etc. |

### TrackingRecord

GPS history for a guard.

| Field | Type | Notes |
|-------|------|-------|
| guardId | UUID | Guard reference |
| latitude, longitude | Float | Coordinates |
| accuracy | Float? | GPS accuracy (meters) |
| batteryLevel | Int? | Device battery |
| timestamp | DateTime | Point-in-time |

### GeofenceEvent

Enter/exit events for site geofences.

| Field | Type | Notes |
|-------|------|-------|
| guardId | UUID | Guard reference |
| geofenceId | String | Site or geofence identifier |
| eventType | GeofenceEventType | ENTER or EXIT |

## Incidents and reports

### Incident (legacy)

Location-based incident with evidence attachments.

| Field | Type | Notes |
|-------|------|-------|
| reportedBy | UUID | User ID |
| locationId | UUID | Location reference |
| type, severity, status | Enums | Classification |
| evidence | Evidence[] | Photos, videos, documents |

### IncidentReport

Guard-submitted reports with media (primary mobile flow).

| Field | Type | Notes |
|-------|------|-------|
| guardId | UUID | Submitting guard |
| reportType | String | Category |
| status | String | SUBMITTED, etc. |
| statusHistory | Json? | Status change log |
| media | IncidentReportMedia[] | Images/videos |

### ShiftIncident

Incident tied to an active shift.

| Field | Type | Notes |
|-------|------|-------|
| shiftId | UUID | Parent shift |
| incidentType, severity | Enums | Classification |
| attachments | Json? | File URL array |

### ShiftReport

Text reports submitted by guards for a shift.

| Field | Type | Notes |
|-------|------|-------|
| shiftId, guardId | UUID | References |
| reportType | ReportTypeEnum | SHIFT, INCIDENT, EMERGENCY |
| content | String | Report body |

## Communication

### Conversation / Message

In-app chat with participant tracking.

| Model | Key fields |
|-------|------------|
| Conversation | id, type (DIRECT/GROUP/TEAM), securityCompanyId, lastMessageAt |
| ConversationParticipant | conversationId, userId, role, lastReadAt |
| Message | senderId, conversationId, content, messageType, isRead |

### Notification

In-app notification inbox.

| Field | Type | Notes |
|-------|------|-------|
| userId | UUID | Recipient |
| type | NotificationType | SHIFT_REMINDER, EMERGENCY, etc. |
| data | String? | JSON payload for deep links |
| isRead | Boolean | Read state |

### DeviceToken

FCM push registration per device.

| Field | Type | Notes |
|-------|------|-------|
| userId | UUID | Owner |
| token | String | FCM token |
| platform | String | ios or android |
| isActive | Boolean | Token validity |

### PushNotificationRetry

Queue for failed push deliveries with exponential retry.

## Multi-tenancy

### SecurityCompany

Tenant root for each security company on the platform.

| Field | Type | Notes |
|-------|------|-------|
| name, email | String | Company identity |
| subscriptionPlan | SubscriptionPlan | BASIC, PROFESSIONAL, etc. |
| subscriptionStatus | SubscriptionStatus | TRIAL, ACTIVE, etc. |
| maxGuards, maxClients, maxSites | Int | Plan limits |
| isActive | Boolean | Tenant enable/disable |

### CompanyUser

Links admin users to a company.

| Field | Type | Notes |
|-------|------|-------|
| securityCompanyId, userId | UUID | Composite unique |
| role | CompanyRole | OWNER, ADMIN, MANAGER, etc. |

### CompanyGuard / CompanyClient / CompanySite

Join tables scoping guards, clients, and sites to a security company.

### Invitation

Onboarding codes for guard and client registration.

| Field | Type | Notes |
|-------|------|-------|
| invitationCode | String | Unique code |
| role | Role | GUARD or CLIENT |
| expiresAt | DateTime | Expiration |
| maxUses, currentUses | Int | Single or multi-use |
| isActive | Boolean | Revocable |

## Billing

### Subscription

Stripe-linked subscription per company.

| Field | Type | Notes |
|-------|------|-------|
| stripeSubscriptionId | String? | Stripe reference |
| plan, status | Enums | Plan and lifecycle |
| billingCycle | BillingCycle | MONTHLY, QUARTERLY, YEARLY |

### BillingRecord

Invoices and payment records.

| Field | Type | Notes |
|-------|------|-------|
| type | BillingType | SUBSCRIPTION, OVERAGE, etc. |
| status | BillingStatus | PENDING, PAID, OVERDUE |
| stripeInvoiceId | String? | Stripe reference |

### StripeWebhookEvent

Idempotency log for processed Stripe webhooks.

## Platform

### PlatformSettings

Key-value settings scoped globally or per company.

### PlatformAnalytics

Time-series metrics (active guards, revenue, etc.).

### SystemAuditLog

Audit trail for super-admin actions (impersonation, config changes).

## Auth tokens

### RefreshToken

Rotating refresh tokens with revocation support.

| Field | Type | Notes |
|-------|------|-------|
| jti | String | Unique token ID |
| revokedAt | DateTime? | Revocation timestamp |
| expiresAt | DateTime | Expiration |

## Support

### SupportTicket / SupportTicketReply

Help desk tickets with company or platform audience.

| Field | Type | Notes |
|-------|------|-------|
| audience | SupportAudience | COMPANY or PLATFORM |
| securityCompanyId | String? | Tenant scope |
| conversationId | String? | Linked chat thread |

## Checkpoint (partial)

QR checkpoint scanning schema exists; mobile UI is limited.

| Model | Purpose |
|-------|---------|
| Checkpoint | QR code tied to a Location |
| ShiftCheckpoint | Scan record during a shift |

## Indexes and tenancy

- Most tenant-scoped queries filter by `securityCompanyId` via join tables.
- `User.email` and `User.role` are indexed.
- `TrackingRecord.timestamp` and `Shift.scheduledStartTime` are indexed for time-range queries.
- Tenant isolation is enforced in services and tested in `backend/tests/tenantIsolation.test.ts`.

## Migrations

```bash
cd backend
npx prisma migrate dev      # Development: create migration
npx prisma migrate deploy   # Production: apply migrations
npx prisma generate         # Regenerate Prisma client
npx prisma db push          # Dev only: push schema without migration
```

## Related documents

- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) — domain flows
- [API_REFERENCE.md](./API_REFERENCE.md) — REST endpoints
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — production migration workflow
