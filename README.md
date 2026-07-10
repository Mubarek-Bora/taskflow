# TaskFlow

A full-stack task and project tracker: projects, a Kanban-style task board (To Do / In
Progress / Done), JWT authentication with refresh-token rotation and Google/GitHub
OAuth, dark mode, and a responsive dashboard UI.

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

## OAuth setup (optional)

The app works fully with email/password without this — the Google/GitHub buttons on
the login page will just show an error until you configure them. To enable them:

### Google
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services →
   Credentials → **Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Under **Authorized redirect URIs**, add exactly:
   `http://localhost:3000/api/auth/oauth/google/callback`
   (swap the host for your real domain in production, matching `NEXT_PUBLIC_SITE_URL`).
4. Copy the generated **Client ID** and **Client secret** into `.env` as
   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

### GitHub
1. Go to GitHub → Settings → Developer settings → **OAuth Apps → New OAuth App**.
2. **Authorization callback URL**, add exactly:
   `http://localhost:3000/api/auth/oauth/github/callback`
3. Copy the **Client ID**, generate a **Client secret**, and put both into `.env` as
   `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`.

Restart the dev server after editing `.env`. If a redirect URI doesn't match exactly
(including trailing slashes/http vs https), the provider will reject the request before
it ever reaches the app.

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
| `npm test` | Unit tests (fast, no DB/server needed) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:integration` | Builds the app, then runs API/integration tests against a real, disposable test database + a real running server |
| `npm run test:all` | Both suites |

## Testing

Two tiers, matching what's realistic to automate for a cookie-session app like this:

- **Unit** (`tests/unit/`, Vitest, `npm test`) — pure functions: Zod validation
  schemas, password hashing/JWT sign-verify/refresh-token hashing, the rate limiter,
  pagination math, OAuth error-message mapping. No database, no server, runs in ~1s.
- **Integration** (`tests/integration/`, `npm run test:integration`) — hits a real
  `next start` server on port 3100 with real `fetch` calls against a disposable
  `taskflow_test` Postgres database (dropped and recreated fresh on every run by
  `tests/integration/setup/global-setup.ts`). This is deliberate: auth here goes
  through `next/headers` cookies tied to Next's request-scoped context, which can't be
  faked by importing route handlers directly and calling them — a live server is the
  only way to exercise it faithfully. `tests/integration/helpers/client.ts` is a small
  cookie-jar `fetch` wrapper that automates the same register → login → me → refresh →
  logout / ownership-isolation checks that were done by hand with `curl` throughout
  this project's development.
- Requires `DATABASE_URL_TEST` in `.env` (see `.env.example`) pointing at a second,
  disposable database on the same Postgres instance.
- **Not included**: a formal browser E2E suite (Playwright was used ad hoc for visual
  verification during development, not wired up as a permanent suite) and testing the
  real OAuth token exchange (needs live provider credentials — see OAuth setup above).

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
  lib/                     auth.ts, prisma.ts, validation/, api-client.ts, oauth/, ...
  proxy.ts                 Route protection (Next.js 16's renamed middleware.ts)
```

## API overview

All endpoints validate input with Zod and return `{ error, details? }` on failure.

- `POST /api/auth/{register,login,refresh,logout}`, `GET /api/auth/me`
- `GET /api/auth/oauth/[provider]/start`, `GET /api/auth/oauth/[provider]/callback`
  (`provider` is `google` or `github`; these are full-page redirects, not fetch calls)
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
- OAuth uses the standard authorization-code flow with a random `state` value in a
  short-lived, `httpOnly`, `SameSite=Lax` cookie (CSRF protection for the callback;
  `Lax` — not `Strict` — is required here since the cookie must survive the top-level
  redirect back from the provider's domain). A Google/GitHub sign-in only auto-links to
  an *existing* email/password account if the provider reports that email as verified,
  to prevent account takeover via an attacker registering an OAuth identity with
  someone else's unverified email.

## What's deliberately out of scope (next phases)

This was scoped as a working core app first, not the full enterprise checklist. Not
implemented, but straightforward to add on top of the existing architecture:

- Email verification, forgot/reset password (would need an email provider) — OAuth
  (Google/GitHub) is now implemented
- Admin dashboard: analytics, user/role management, activity logs
- File uploads, CSV/PDF export, in-app notifications
- A formal browser E2E test suite (see Testing section) and CI/CD pipeline to run the
  test suites automatically
- Production Docker image for the Next.js app itself (only the dev Postgres is
  containerized via `docker-compose.yml`)

## Deployment

The app reads all secrets from environment variables (see `.env.example`) and has no
hardcoded config, so it's deployable as-is to any Node.js host once `DATABASE_URL`
points at a real Postgres instance and `npm run build && npm run start` is run behind
HTTPS. `docker-compose.yml` currently only provisions the dev database; containerizing
the Next.js app itself is one of the deferred items above.
