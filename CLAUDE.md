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

---

## Project Context & Documentation

See the full documentation in the `/docs` directory.

### Key Files

- **Architecture**: `docs/architecture.md`
- **API Design**: `docs/api-conventions.md`
- **Testing Guide**: `docs/testing.md`
- **Code Style**: `docs/code-style.md`
- **Change Journal**: `docs/journal/INDEX.md`

### Instructions

1. Read the relevant guide above before starting work on any feature area.
2. For file-specific rules, check for a `CLAUDE.md` in the subdirectory.
3. Always refer to the authoritative source in `/docs`, not any copy or summary.

---

## Change Journal

All significant work must be logged in `docs/journal/` for continuity across sessions.

### Journal Structure

```
docs/journal/
  INDEX.md                          # catalog of all entries, newest first
  YYYY-MM-DD-HH-MM-brief-desc.md   # individual timestamped entry
```

### When to Write an Entry

After completing any of the following: implementing a feature, fixing a bug, making an architectural decision, updating the schema, or changing a core convention.

### Entry Format

```markdown
# YYYY-MM-DD HH:MM — Brief Description

## Summary
What changed and why.

## Changes
- File / component affected → what changed
- ...

## Reasoning
Why this approach was chosen over alternatives.

## Challenges
Any gotchas, trade-offs, or follow-up items.
```

### Rules

- Save the entry as `docs/journal/YYYY-MM-DD-HH-MM-brief-description.md` using UTC time.
- Add a single line to the **top** of `docs/journal/INDEX.md` in the format:
  `- [YYYY-MM-DD HH:MM](./YYYY-MM-DD-HH-MM-brief-description.md) — one-line summary`
- Be concise but complete — future sessions rely on these entries for context.
- Use `/compact` proactively to manage the context window during long sessions.
- **After every commit**, update the journal entry and `INDEX.md` to reflect what was committed, then include those context file updates in the same commit or a follow-up commit immediately after.

---

## AI-Assisted Development Workflow (Vibe Coding)

This project follows a **test-first** approach when using Claude to generate implementation code. Tests are the specification language — write them before prompting for implementation.

### Workflow

**Step 1 — Write the test first.**
Define the expected behaviour using Vitest (unit/integration) or Playwright (E2E). Cover the happy path, error cases, and edge cases before any implementation exists.

**Step 2 — Prompt Claude with the test as context.**
Use the test file as the primary context. A minimal effective prompt:

```
Make this test pass.
File: <path/to/file.test.ts>
Framework: Vitest
Do NOT mock the database. DO mock [external service].
Follow the AAA pattern (Arrange / Act / Assert).
```

**Step 3 — Review and refactor critically.**
Do not ship AI-generated code unread. Use the tests as a safety net while refactoring for clarity, correctness, and style. The tests must still pass after refactoring.

**Step 4 — Pre-commit hooks catch regressions.**
Linting (`npm run lint`) and the test suite (`npm run test`) run automatically on every commit via Husky + lint-staged. A failing hook means the commit is rejected — fix the root cause, never bypass with `--no-verify`.

### Prompt Template for Test Generation

When asking Claude to write tests rather than implementation:

```
Write [unit | integration | E2E] tests for [component/route/function] using [Vitest | Playwright].

Requirements:
- Follow the AAA pattern (Arrange / Act / Assert)
- Test scenarios: [happy path], [error case], [edge case]
- Do NOT mock: [database, internal helpers]
- DO mock: [external APIs, email service, third-party SDKs]
- Framework conventions: [any project-specific patterns]
```

### Context Tiers

When providing context to Claude, tier it by relevance:

| Tier | What to include |
|---|---|
| High context | The test file, the file under test, and the direct imports it uses |
| Medium context | The relevant `docs/` guide (architecture, API conventions, testing) |
| Low context | Unrelated files, full `node_modules`, generated migration files |

Never paste entire directories — curate context to the task.

---

## Git & GitHub Workflow

### Commit Every Change

Every discrete, working change must be committed immediately — do not batch unrelated changes into one commit.

**Commit cadence rules:**
- One logical change = one commit. A feature, a bug fix, a refactor, a config update — each gets its own commit.
- Never hold back a working change waiting for the "next natural stopping point."
- After committing code, commit updated context files (`docs/journal/`, `CLAUDE.md` if changed) in the same or an immediate follow-up commit.

### Commit Message Format

```
<type>(<scope>): <short summary>

[optional body — what and why, not how]
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`.

Example:
```
feat(auth): add bcrypt password hashing on signup

Uses cost factor 12. Plain-text password is never stored or logged.
```

### Push to GitHub

After every commit (or small batch of related commits), push to the remote:

```bash
git push origin main   # or the current feature branch
```

**Push rules:**
- Never let local commits diverge from `origin` by more than one logical unit of work.
- Push before ending a session so work is never lost on a local machine.
- If working on a feature branch, open a PR on GitHub as soon as the branch has at least one meaningful commit — draft PRs are fine.

### Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Always deployable; protected |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `chore/<name>` | Tooling, deps, config |

Merge to `main` via PR only — never push directly to `main`.

---

## Implementation To-Do

This section is the canonical build checklist. **Update it after every commit** — check off completed items and add new ones as scope is discovered. Future Claude sessions must read this before starting work so they don't duplicate or skip anything.

### Legend
- `[x]` — committed to `main`
- `[ ]` — not started
- `[~]` — in progress / partial

---

### Phase 1 — Project Bootstrap
- [x] Replace `package.json` (puppeteer-only → full Next.js 15 manifest)
- [x] `tsconfig.json` — strict mode, `@/*` alias
- [x] `next.config.ts` — security headers (CSP, HSTS, X-Frame-Options)
- [x] `postcss.config.mjs` — Tailwind v4
- [x] `eslint.config.mjs` — next/core-web-vitals
- [x] `vitest.config.ts` — react plugin, `@` alias
- [x] `.env.example` — all required vars documented
- [x] `.gitignore` — Next.js standard

### Phase 2 — Database Schema
- [x] `src/lib/db/schema.ts` — 12 tables: users, sessions, accounts, verifications, teams, team_members, contacts, activities, bpm_guests, daily_challenges, challenge_submissions, business_submissions, recruits, providers
- [x] All enums: `user_role`, `contact_type`, `contact_segment`, `bpm_format`, `submission_status`
- [x] Drizzle relations defined
- [ ] `npm run db:generate` — generate first migration file
- [ ] `npm run db:migrate` — apply migration to database
- [ ] RLS policies in migration SQL (contacts, activities, bpm_guests, challenge_submissions, business_submissions, recruits)

### Phase 3 — Auth
- [x] `src/lib/auth/index.ts` — better-auth config (email/password + Google OAuth, 15-min JWT)
- [x] `src/lib/auth/client.ts` — `signIn`, `signOut`, `signUp`, `useSession`
- [x] `src/app/api/auth/[...all]/route.ts` — better-auth catch-all handler
- [x] `src/middleware.ts` — auth guard on dashboard routes + rate-limit on `/api/auth/`
- [x] `src/lib/permissions/authorize.ts` — `authorize(user, role)` helper

### Phase 4 — Dashboard Shell
- [x] `src/components/sidebar.tsx` — 7-item collapsible sidebar + mobile slide-over drawer
- [x] `src/components/topbar.tsx` — date display + hamburger trigger
- [x] `src/components/dashboard-shell.tsx` — client component managing collapse/mobile state
- [x] `src/app/(dashboard)/layout.tsx` — server layout validating session, rendering shell
- [x] Auth pages: `login/page.tsx` (email + Google), `signup/page.tsx`

### Phase 5 — Infrastructure
- [x] `Dockerfile` — multi-stage (deps → builder → runner), non-root `node` user
- [x] `docker-compose.yml` — app + postgres:16-alpine with health checks
- [x] `docker-compose.override.yml` — local dev bind-mount config
- [x] `src/app/api/health/route.ts` — `GET /api/health`
- [x] `scripts/seed.ts` — 4 providers, 3 challenges, 1 admin user
- [x] `src/hooks/use-realtime.ts` — SSE client stub with auto-reconnect
- [ ] Husky pre-commit hooks (lint + typecheck on staged files)
- [ ] `npm audit` CI step

### Phase 6 — Dashboard Page ✅
- [x] `src/components/kpi-card.tsx` — reusable KPI card (label, value, icon, sub-label)
- [x] `src/components/daily-challenge-card.tsx` — expandable card, good-faith checkbox, submit, pending/approved/rejected states
- [x] `src/components/quick-add-bar.tsx` — 5 quick-add buttons (Contact, Guest, Appt, Recruit, Biz)
- [x] `src/app/(dashboard)/dashboard/page.tsx` — greeting, 6 KPI cards, Crush 13 bar, 3 challenge cards, quick-add bar
- [x] `GET /api/kpis` — monthly points + appt count aggregation
- [x] `GET /api/challenges` — challenges with today's submission status
- [x] `POST /api/challenge-submissions` — submit with dedup (409 on double-submit)
- [x] `GET /api/challenge-submissions` — today's submissions for session user
- [ ] `PATCH /api/challenge-submissions/[id]` — mentor approve / reject
- [ ] Mentor approval queue view (mentor-only page or modal)

### Phase 7 — Rolodex (Contacts)
- [ ] `GET /api/contacts` — list (search by name, filter by contact_type)
- [ ] `POST /api/contacts` — create contact (20-field validation)
- [ ] `GET /api/contacts/[id]` — contact detail
- [ ] `PATCH /api/contacts/[id]` — update contact
- [ ] `DELETE /api/contacts/[id]` — soft-delete or hard-delete
- [ ] `src/app/(dashboard)/rolodex/page.tsx` — search bar + 5 filter tabs (Pre-Contact, Post-Contact, Agents, Clientele, Network) + contact list
- [ ] `src/components/forms/contact-form.tsx` — 20-field form (Full Name req, Contact Type req, ≥1 Qualifier req)
- [ ] `src/app/(dashboard)/rolodex/new/page.tsx` — new contact page
- [ ] `src/app/(dashboard)/rolodex/[id]/page.tsx` — contact detail / edit page

### Phase 8 — Activity Calendar
- [ ] `GET /api/activities` — list (filter by segment, date range)
- [ ] `POST /api/activities` — create appointment
- [ ] `PATCH /api/activities/[id]` — update appointment
- [ ] `DELETE /api/activities/[id]` — delete appointment
- [ ] `src/app/(dashboard)/activity/page.tsx` — 4 segment tabs (Prospect / Client / Agent / Network) + Schedule (month calendar) + Today button
- [ ] `src/components/forms/appt-form.tsx` — contact relation, date/time, location, notes
- [ ] `src/app/(dashboard)/activity/new/page.tsx` — new appointment page
- [ ] Month calendar component (no external lib — build with CSS grid)

### Phase 9 — BPM Guests
- [ ] `GET /api/bpm-guests` — list (monthly filter, YTD filter)
- [ ] `POST /api/bpm-guests` — create guest record
- [ ] `PATCH /api/bpm-guests/[id]` — update guest record
- [ ] `src/app/(dashboard)/bpm-guests/page.tsx` — Monthly table + Year-to-Date table with toggle; columns: Contact Name, Attended, In Person/Online, Date Attended, Book Next Step
- [ ] `src/components/forms/bpm-guest-form.tsx` — attended bool, format choice, date, book_next_step
- [ ] `src/app/(dashboard)/bpm-guests/new/page.tsx` — new guest entry page

### Phase 10 — Business Production
- [ ] `GET /api/business` — list submissions (product mix + points submitted)
- [ ] `POST /api/business` — create business submission
- [ ] `src/app/(dashboard)/business/page.tsx` — Product Mix section + Points Submitted section
- [ ] `src/components/forms/biz-form.tsx` — Contract Number (req), Details (req), Servicing Points (req), Licensed Split fields, Non-Licensed field
- [ ] `src/app/(dashboard)/business/new/page.tsx` — new business submission page

### Phase 11 — Providers
- [ ] `GET /api/providers` — list (real-time name search)
- [ ] `GET /api/providers/[id]` — provider detail
- [ ] `PATCH /api/providers/[id]` — admin-only update
- [ ] `src/app/(dashboard)/providers/page.tsx` — searchable carrier list (Equitable, iA Financial Group, Ivari, Manulife)
- [ ] `src/app/(dashboard)/providers/[id]/page.tsx` — provider detail view

### Phase 12 — Teams
- [ ] `GET /api/teams` — list teams with licensed agent counts
- [ ] `GET /api/teams/[id]` — team detail with members
- [ ] `src/app/(dashboard)/teams/page.tsx` — team list with licensed agent count badges
- [ ] `src/app/(dashboard)/teams/[id]/page.tsx` — team detail with member list

### Phase 13 — Recruits
- [ ] `POST /api/recruits` — create recruit record
- [ ] `GET /api/recruits` — list recruits for session agent
- [ ] `src/app/(dashboard)/rolodex/recruit/page.tsx` — recruit form (agent code field)
- [ ] `src/components/forms/recruit-form.tsx`

### Phase 14 — Realtime (SSE)
- [ ] PostgreSQL LISTEN/NOTIFY triggers on key tables (challenge_submissions, contacts, activities)
- [ ] `src/app/api/stream/route.ts` — SSE endpoint subscribing to NOTIFY events
- [ ] Wire `useRealtime` hook into dashboard page to refresh KPIs + challenge status on events

### Phase 15 — Polish & Production Readiness
- [ ] Husky + lint-staged pre-commit hooks (lint + typecheck)
- [ ] `npm audit` in CI (fail on high/critical CVEs)
- [ ] ESLint `eslint-plugin-security` rules
- [ ] `secretlint` or `gitleaks` pre-commit hook
- [ ] Dependabot / Renovate config
- [ ] RLS policies verified end-to-end
- [ ] HTTPS + HSTS enforced via nginx/Caddy reverse proxy config
- [ ] Drizzle Studio accessible in dev (`npm run db:studio`)
- [ ] E2E smoke test (Playwright): login → dashboard → submit challenge → verify pending state
