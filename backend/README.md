# Guard Tracking Backend

Backend API for TracsoPro (guard tracking platform).

## Stack

- Node.js + TypeScript
- Express
- Prisma ORM
- PostgreSQL
- JWT auth (access + refresh)
- Socket.io realtime

## Run locally

```bash
cd backend
npm install
npm run dev:db
```

Health check: `http://localhost:3000/api/health`

## Useful scripts

- `npm run dev:db` - run DB-backed server in watch mode
- `npm run test` - run backend tests
- `npm run test:coverage` - core module coverage gate (utils, validators, shift geofence)
- `npm run test:coverage:all` - full codebase gate (60% lines). `conversationService.ts` is in-gate (~83% via `conversationService.test.ts`). `chatService.ts` remains excluded (~76% via `chatService.test.ts` + `chatFlow.test.ts`) until the legacy Socket.IO paths are refactored.

### Coverage note (chat module)

Dedicated tests: `tests/conversationService.test.ts`, `tests/chatService.test.ts`, and `tests/chatFlow.test.ts`. Only `chatService.ts` is still excluded from the ratchet gate because its large legacy branches keep overall coverage below 60% when included.

- `npm run db:generate` - generate Prisma client
- `npm run db:push` - push schema (dev only)
- `npm run db:migrate` - create migration in dev
- `npm run db:migrate:deploy` - apply pending migrations (production/staging)
- `npm run db:seed` - seed data

### Production migrations

Apply all pending migrations before starting a new backend version:

```bash
cd backend
npm run db:migrate:deploy
```

If the database was created with `db push` instead of migrations, ensure `20260617140000_incident_report_status_enum` is applied so `IncidentReport.status` uses the `IncidentReportStatus` enum (`SUBMITTED`, `PENDING`, `REVIEWED`, `RESOLVED`, `DISMISSED`). When using PgBouncer, set `DIRECT_DATABASE_URL` for migration commands (see root `ENVIRONMENT_VARIABLES.md`).

## Environment

See root `ENVIRONMENT_VARIABLES.md` for required variables and production notes.

## Important notes

- Main runtime entry: `src/server-db.ts`
- Legacy in-memory server exists at `src/server.ts` for compatibility/testing
- Production deploy should use migration-safe flow and strict env validation

## Related docs

- `CLIENT_HANDOFF.md` — delivery overview and go-live checklist
- `docs/API_REFERENCE.md` — REST and WebSocket endpoints
- `docs/DATABASE_SCHEMA.md` — Prisma models and relationships
- `docs/SYSTEM_ARCHITECTURE.md` — backend in system context
- `docs/DEPLOYMENT_GUIDE.md` — production deployment
- `docs/TROUBLESHOOTING.md` — common backend issues
