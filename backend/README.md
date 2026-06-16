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
- `npm run db:generate` - generate Prisma client
- `npm run db:push` - push schema (dev only)
- `npm run db:migrate` - create migration in dev
- `npm run db:seed` - seed data

## Environment

See root `ENVIRONMENT_VARIABLES.md` for required variables and production notes.

## Important notes

- Main runtime entry: `src/server-db.ts`
- Legacy in-memory server exists at `src/server.ts` for compatibility/testing
- Production deploy should use migration-safe flow and strict env validation
