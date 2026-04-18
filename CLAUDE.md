# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

This is a multi-tenant SaaS business tracker built to replace an existing Glide app (`sla-business-tracker.glide.page`). The stack is **Next.js 15** (App Router) with a **PostgreSQL** database, containerised with **Docker**.

**Viewport strategy:** Desktop-first. The primary design target is a full-width browser dashboard with a collapsible sidebar. Layouts must be responsive and usable on tablet/mobile, but all design decisions start from the desktop breakpoint — never mobile-first.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React Server Components) |
| Server | Next.js Route Handlers (`app/api/**/route.ts`) |
| Database | PostgreSQL — Oracle Cloud, AWS RDS/Aurora, or any managed provider |
| Realtime | PostgreSQL LISTEN/NOTIFY → Server-Sent Events |
| Auth | `better-auth` with bcrypt (email/password + OAuth) |
| ORM / Query | Drizzle ORM (parameterised queries only — never raw string interpolation) |
| Styling | Tailwind CSS + shadcn/ui |
| Container | Docker + Docker Compose |
| Secret management | Environment variables injected at runtime; never hardcoded |

---

## Commands

```bash
# Development
npm run dev              # start Next.js dev server (http://localhost:3000)
npm run build            # production build
npm run start            # start production build locally

# Database
npm run db:generate      # generate Drizzle migration files
npm run db:migrate       # apply migrations
npm run db:studio        # open Drizzle Studio

# Docker
docker compose up -d              # start all services
docker compose up -d --build      # rebuild and start
docker compose logs -f app        # stream app logs
docker compose down               # stop and remove containers

# Lint / type-check
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit

# Tests
npm run test             # run all Vitest unit tests
npm run test -- --reporter=verbose <path/to/file.test.ts>   # run a single test file
```

---

## Architecture

### Request flow

```
Browser → React components / hooks
              ↓
          fetch / Server Actions  (client-side calls or server-side mutations)
              ↓
          app/api/**/route.ts     (Route Handlers — all state-mutating operations live here)
              ↓
          Drizzle ORM             (parameterised queries only)
              ↓
          PostgreSQL (managed cloud provider)
```

**Rule:** The client never writes to the database directly. All inserts, updates, and deletes go through Next.js Route Handlers using a server-only database connection defined in server-only environment variables (never prefixed with `NEXT_PUBLIC_`). The session is validated on every Route Handler before any action is taken.

### Directory structure

```
app/
  (auth)/            # login, signup, OAuth callback pages
  (dashboard)/       # protected routes — wrapped by dashboard layout
    layout.tsx       # sidebar + top bar shell
    [teamSlug]/      # per-team routes
  api/               # Route Handlers (server only)
    auth/
    teams/
    members/
    webhooks/
    stream/          # SSE endpoint for realtime
lib/
  db/                # Drizzle client singleton + schema
  auth/              # better-auth config
  permissions/       # RBAC authorize() helper
  webhooks/          # fire-and-forget queue + HMAC signing
drizzle/             # migration files
components/
  ui/                # shadcn/ui primitives
  command-palette/   # Ctrl+K palette
hooks/               # client-side React hooks (useTeam, useRealtime)
middleware.ts        # Next.js middleware — auth guard on all (dashboard) routes
```

### Multi-tenancy

Every table that holds tenant data has a `team_id` foreign key. All Route Handlers resolve `team_id` from the authenticated session, never from the request body. Row-Level Security (RLS) is enforced at the database layer as a second line of defence — no query can reach data from another team even if application logic fails.

### Auth

- Email/password: passwords hashed with **bcrypt** (cost factor ≥ 12); stored hash only, never plaintext.
- OAuth: provider tokens are exchanged server-side via `better-auth`; access tokens are never forwarded to the client.
- Sessions: short-lived JWTs (≤ 15 min) with refresh tokens rotated on each use and stored as `httpOnly`, `Secure`, `SameSite=Strict` cookies.
- Route Handlers call `auth.api.getSession(request)` before any authorisation check.
- `middleware.ts` protects all `(dashboard)` routes at the edge before a request reaches any page or Route Handler.

### Role-based access

Roles: `owner` > `admin` > `member`. Permission checks are enforced in `lib/permissions/authorize.ts`, called at the top of every mutating Route Handler. It throws a `403` before any database access if the session role does not satisfy the required level.

### Realtime

PostgreSQL `LISTEN`/`NOTIFY` triggers broadcast row-level changes. A persistent server-side connection pool subscribes and pushes events to connected clients over **Server-Sent Events** (`app/api/stream/route.ts`). The `useRealtime` hook (`hooks/useRealtime.ts`) reconnects automatically on disconnect.

### Webhooks

Outbound webhooks use a fire-and-forget queue: the originating Route Handler enqueues the payload, returns the response to the caller immediately, and a background worker (`lib/webhooks/worker.ts`) delivers to registered endpoints with exponential-back-off retry (max 5 attempts). Payloads are signed with `HMAC-SHA256` using a per-team secret.

### Dashboard shell

- `app/(dashboard)/layout.tsx` — sidebar + top bar wrapper for all protected pages.
- The sidebar is **collapsible** on desktop (icon-only collapsed state) and becomes a **slide-over drawer** on mobile (≤ `md` breakpoint) — never a bottom tab bar.
- `components/command-palette/` — `Ctrl+K` global command palette (fuzzy search over routes and actions).
- All dashboard pages use a max-width content container so they don't stretch uncomfortably on ultrawide screens.
- Team switching updates the active `team_id` in the session cookie; the router performs a hard navigation to clear stale RSC cache.

---

## Security Requirements

These are non-negotiable constraints. Every PR must satisfy all layers.

### Back-end

- Parameterised queries everywhere — Drizzle ORM enforces this; never use raw SQL with string interpolation.
- Passwords hashed with bcrypt; never logged or returned in API responses.
- `authorize(session, requiredRole)` is the first call in every mutating Route Handler, before any DB access.
- Rate-limit auth endpoints (`middleware.ts` or `app/api/auth/`) — max 10 login attempts per IP per 15 min.

### Front-end

- Sanitise all user-generated content before rendering; use `dangerouslySetInnerHTML` only with DOMPurify-cleaned input.
- No secrets, tokens, or internal IDs stored in `localStorage` or `sessionStorage`.
- HTTPS enforced in production via Docker reverse proxy (nginx/Caddy) and HSTS headers.
- CSP and security headers set in `next.config.ts` under `headers()`.

### Data access

- Row-Level Security enabled on all tenant tables in PostgreSQL.
- Sensitive columns (PII, payment references) encrypted at rest using PostgreSQL `pgcrypto` or provider-managed keys (AWS KMS / Oracle Vault).
- All connections use TLS in transit; `ssl: { rejectUnauthorized: true }` in the Drizzle/pg config.

### Supply chain & SAST

- `npm audit` runs in CI; builds fail on high/critical CVEs.
- ESLint with `eslint-plugin-security` catches dangerous patterns (e.g. `eval`, regex DoS).
- `secretlint` or `gitleaks` pre-commit hook — blocks commits containing credential-shaped strings.
- Dependabot or Renovate enabled for automated dependency PRs.

---

## Secrets & Credential Hygiene

- **All credentials live in environment variables.** Use `process.env.VARIABLE_NAME`. Never assign a literal secret to a variable.
- `.env.local` is git-ignored. `.env.example` documents required keys with placeholder values only.
- Server-only variables are never prefixed with `NEXT_PUBLIC_` — Next.js will not bundle them into the client.
- For production, secrets are injected at container start via Docker secrets or a secret manager (HashiCorp Vault / AWS Secrets Manager).
- Session signing keys and webhook HMAC keys support `AUTH_SECRET` + `AUTH_SECRET_PREV` for zero-downtime rotation.
- **Do not include real secrets or PII in prompts sent to Claude.** Use placeholders such as `[DATABASE_URL]` when sharing config snippets.

---

## Architectural & Runtime Controls

- **Principle of Least Privilege:** The application database user has only `SELECT`, `INSERT`, `UPDATE`, `DELETE` on its own schema. No `DROP`, `CREATE`, `TRUNCATE`, or cross-schema access. Migrations run under a separate privileged migration user that is never available at runtime.
- **Short-lived credentials:** Access tokens expire in 15 minutes. Webhook signing secrets and OAuth client secrets rotate every 90 days. Refresh tokens are single-use.
- **Output filtering:** A CI step (`scripts/scan-output.ts`) scans generated files for secret-shaped patterns (regex: API keys, connection strings, private keys) before they can be committed.
- **Blocklist dangerous patterns:** ESLint rules flag: hardcoded credential assignments, unvalidated `req.body` access, `dangerouslySetInnerHTML` without sanitisation, and `eval`/`Function` constructor usage.

---

## Docker

The app ships as two Docker services defined in `docker-compose.yml`:

| Service | Description |
|---|---|
| `app` | Next.js 14 production build (`node:20-alpine`) |
| `db` | PostgreSQL 16 (for local dev only; production uses a managed cloud provider) |

Build target is multi-stage: `deps` → `builder` → `runner`. The runner image runs as a non-root user (`node`). The `app` service mounts no source code in production — the image is self-contained.

Health checks are defined for both services. The `app` container only starts after `db` passes its health check.

Environment variables are supplied via `docker-compose.override.yml` locally and via Docker secrets / CI environment injection in production.

---

## Environment Variables

Required variables (document in `.env.example`):

```
DATABASE_URL=
AUTH_SECRET=
AUTH_SECRET_PREV=
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=
WEBHOOK_SIGNING_SECRET=
NEXT_PUBLIC_APP_URL=
NODE_ENV=
```

Server-only variables (never prefixed with `NEXT_PUBLIC_`):
`DATABASE_URL`, `AUTH_SECRET`, `AUTH_SECRET_PREV`, `OAUTH_*`, `WEBHOOK_SIGNING_SECRET`.
