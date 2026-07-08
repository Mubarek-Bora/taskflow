# TaskFlow

A full-stack task and project tracker: projects, a Kanban-style task board (To Do / In
Progress / Done), JWT authentication with refresh-token rotation, dark mode, and a
responsive dashboard UI.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Framer Motion |
| Data fetching | TanStack Query (React Query) |
| Forms/validation | react-hook-form + Zod (schemas shared between client and API) |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL 17 (via Docker Compose for local dev) |
| ORM | Prisma 7 (driver adapter: `@prisma/adapter-pg`) |
| Auth | JWT access tokens (jose) + opaque, hashed, rotating refresh tokens; bcrypt password hashing |

## Prerequisites

- Node.js 20.9+ (project developed against Node 24)
- Docker Desktop (for the local Postgres container)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in real secrets
cp .env.example .env
# Edit .env: set JWT_ACCESS_SECRET / JWT_REFRESH_SECRET to long random strings,
# and change POSTGRES_PASSWORD / DATABASE_URL if you want a non-default password.

# 3. Start Postgres
docker compose up -d

# 4. Run migrations
npm run db:migrate

# 5. (Optional) seed a demo user + project
npm run db:seed
# Seeded login: demo@taskflow.dev / Password123!

# 6. Start the dev server
npm run dev
```

Visit http://localhost:3000.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply Prisma migrations (dev) |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |

## Project structure

```
prisma/                    Schema, migrations, seed script
src/
  app/
    (marketing)/           Public landing page
    (auth)/                Login / register
    (dashboard)/           Protected: project list + Kanban board
    api/                   Route handlers (auth, projects, tasks)
  components/
    ui/                    Reusable primitives (Button, Input, Modal, ...)
    layout/                Nav / header components
    features/{projects,tasks}/   Feature-specific components
  hooks/                   React Query hooks (useAuth, useProjects, useTasks)
  lib/                     auth.ts, prisma.ts, validation/, api-client.ts, ...
  proxy.ts                 Route protection (Next.js 16's renamed middleware.ts)
```

## API overview

All endpoints validate input with Zod and return `{ error, details? }` on failure.

- `POST /api/auth/{register,login,refresh,logout}`, `GET /api/auth/me`
- `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/[id]`
- `GET/POST /api/projects/[id]/tasks`, `GET/PATCH/DELETE /api/tasks/[id]`

All project/task routes are scoped to the authenticated user's own data (ownership
checked server-side) and use soft delete (`deletedAt`) rather than hard deletes.

## Security notes

- Passwords hashed with bcrypt (12 rounds); refresh tokens are opaque random strings,
  never JWTs, and only their SHA-256 hash is stored — a leaked DB row can't be replayed
  as a token.
- Access tokens are short-lived (15 min) JWTs in an httpOnly, `SameSite=strict` cookie;
  refresh tokens rotate on every use and are scoped to `/api/auth`.
- `src/proxy.ts` does an optimistic redirect based on the JWT cookie only (no DB call);
  the real authorization boundary is `requireAuth()`/`requireRole()` in each route
  handler, per Next.js's own guidance that proxy/middleware should not be the sole
  authorization layer.
- All database queries go through Prisma (parameterized), so SQL injection isn't
  possible via app code.
- A per-IP in-memory rate limiter guards `/api/auth/*`. It's process-local — fine for
  this single-instance setup, but a real multi-instance deployment would need a shared
  store (Redis) instead.

## What's deliberately out of scope (next phases)

This was scoped as a working core app first, not the full enterprise checklist. Not
implemented, but straightforward to add on top of the existing architecture:

- OAuth (Google/GitHub), email verification, forgot/reset password (would need an email
  provider)
- Admin dashboard: analytics, user/role management, activity logs
- File uploads, CSV/PDF export, in-app notifications
- Automated tests (unit/integration/E2E) — everything so far was verified manually via
  `curl` (API) and Playwright screenshots (UI), not an automated suite
- CI/CD pipeline
- Production Docker image for the Next.js app itself (only the dev Postgres is
  containerized via `docker-compose.yml`)

## Deployment

The app reads all secrets from environment variables (see `.env.example`) and has no
hardcoded config, so it's deployable as-is to any Node.js host once `DATABASE_URL`
points at a real Postgres instance and `npm run build && npm run start` is run behind
HTTPS. `docker-compose.yml` currently only provisions the dev database; containerizing
the Next.js app itself is one of the deferred items above.
