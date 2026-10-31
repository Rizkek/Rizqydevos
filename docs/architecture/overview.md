# System Architecture Overview

This document is the entry point for understanding the DevOS technical
architecture as it exists in the code. It connects frontend, backend,
database, and infrastructure into one picture.

Scope and business flows: [docs/product/overview.md](../product/overview.md).
Plan: [docs/plans/ROADMAP.md](../plans/ROADMAP.md). Reference ADRs for the reasoning behind each decision.

---

## System Diagram

```
                         Browser (one user)
                    │                        │
       pages, /api/auth/*           fetchApi → /api/v1/*  (credentials: include)
                    ▼                        ▼
┌──────────────────────────────┐   ┌──────────────────────────────────────┐
│ apps/web — Next.js 16        │   │ apps/api — NestJS 11                  │
│ port 3000                    │   │ port 3001, prefix /api/v1             │
│                              │   │                                       │
│ App Router, React 19         │◄──┤ AuthGuard: GET <BETTER_AUTH_URL>      │
│ src/proxy.ts (session gate)  │   │   /api/auth/get-session (cookie fwd)  │
│ Better Auth (email+password, │   │ ThrottlerGuard (before AuthGuard)     │
│   owner-only signup)         │   │ ValidationPipe, helmet, CORS=APP_URL  │
│ TanStack Query, Zustand      │   │ AES-256-GCM for secrets and tokens    │
└──────────────┬───────────────┘   └───────┬──────────────┬───────────────┘
               │ Prisma (auth tables)      │ Prisma       │ ioredis
               ▼                           ▼              ▼
        ┌─────────────────────────────────────┐   ┌──────────────────────┐
        │ PostgreSQL (Supabase, free tier)    │   │ Redis (hosted, TLS)  │
        │ schema: prisma/schema.prisma        │   │ readiness check only │
        └─────────────────────────────────────┘   └──────────────────────┘

        Outbound from the API: GitHub REST API, Vercel REST API,
        and HTTP/TLS checks against the deploy URLs entered in Projects.
```

Sessions are stored in Postgres by Better Auth. The API never reads the session table; it
asks the web app. Integration tokens for GitHub and Vercel are entered in Settings, verified
with the provider, and stored encrypted in the `Integration` table; they are not environment
variables.

---

## Technology Decisions Index

| Decision | Technology | ADR |
|----------|-----------|-----|
| Frontend framework | Next.js 16 (App Router, built with `--webpack`) | [ADR-001](./adr/ADR-001-nextjs-framework.md) |
| Backend framework | NestJS 11 | [ADR-002](./adr/ADR-002-nestjs-backend.md) |
| Primary database | PostgreSQL on Supabase + Prisma 7 | [ADR-003](./adr/ADR-003-postgresql-database.md) |
| Authentication | Better Auth, email and password, single owner | [ADR-004](./adr/ADR-004-better-auth.md) |
| Deployment | Planned: web on Vercel, API on Render (Fase P) | [ADR-005](./adr/ADR-005-docker-coolify-deployment.md) (under review) |
| Cache | Redis (kept because it is free; used for readiness only) | (to be documented) |
| UI | Tailwind CSS 4, Radix primitives, components in `components/ui` | (to be documented) |

---

## API Modules

| Module | Routes (`/api/v1/...`) | Purpose |
|---|---|---|
| projects | `projects` | Project registry: repo URL, deploy URL, stack, status |
| workspace | `workspace/todos`, `workspace/notes`, `workspace/bookmarks` | Tasks, notes, scratchpad; bookmarks back the planned Links page |
| knowledge | `knowledge/snippets`, `knowledge/notes` | Snippets and notes |
| ai | `ai/prompts` | Prompt library, shown as the Prompts tab in Knowledge |
| integrations | `integrations`, `integrations/github/*`, `integrations/vercel/*` | GitHub and Vercel tokens and data |
| infrastructure | `infrastructure/ssl*`, `infrastructure/health*` | Uptime and SSL checks |
| audit | `audit-log` | Read-only audit trail |
| secrets | `secrets` | Encrypted secret vault |
| settings | `settings` | User settings |
| (root) | `health`, `health/liveness`, `health/readiness` | Platform probes (public, not throttled) |

---

## Monorepo Structure

```
Rizqydevos/
├── apps/
│   ├── web/                  ← Next.js app (also hosts Better Auth)
│   │   ├── src/              ← app/, components/, lib/, stores/, proxy.ts
│   │   ├── e2e/              ← Playwright (system Chrome)
│   │   └── scripts/          ← create-owner.ts
│   └── api/                  ← NestJS API
│       └── src/              ← modules/, shared/, config/, database/, cache/
├── packages/
│   └── types/                ← @devos/types (shared TypeScript types)
├── prisma/                   ← schema.prisma and migrations (shared by web and api)
├── docs/
├── docker-compose.dev.yml    ← Local Postgres and Redis
├── docker-compose.yml        ← References Dockerfiles that do not exist yet (Fase P)
├── render.yaml               ← API service only (Fase P)
├── .env.example              ← Which variable each program reads
└── package.json              ← Bun workspaces + Turborepo
```

---

## Data Flow

### Read

```
Client Component (useQuery with a key from queryKeys)
  → fetchApi('/endpoint')          browser → API, session cookie attached
  → ThrottlerGuard → AuthGuard     AuthGuard asks the web app whether the session is valid
  → Controller → Service → Prisma → PostgreSQL
  → { success: true, data }        unwrapped by fetchApi
```

### Write

```
Form → useMutation → fetchApi(POST/PATCH/DELETE)
  → ValidationPipe (DTO, whitelist + forbidNonWhitelisted)
  → Service → Prisma (+ AuditService for projects, secrets, integrations)
  → invalidateQueries on success
```

Errors use one envelope from `GlobalExceptionFilter`. Integration failures carry typed codes
(`INTEGRATION_NOT_CONFIGURED`, `TOKEN_REJECTED`, `RATE_LIMITED`, ...); 401 means only that the app
session expired.

---

## Security Layers

```
Web:   src/proxy.ts redirects unauthenticated page requests to /login (safe redirectTo)
       Better Auth: registration limited to OWNER_EMAIL
API:   ThrottlerGuard (100/min per IP, 10/min for connecting an integration)
       AuthGuard (global, @Public() for health only)
       ValidationPipe, helmet, CORS limited to APP_URL
Data:  AES-256-GCM for secret values and integration tokens (ENCRYPTION_KEY, exactly 32 bytes)
       Audit log for connect/disconnect, secret create/reveal/delete
```

Known gaps are tracked in [ROADMAP.md](../plans/ROADMAP.md): SSRF hardening of the uptime check (Fase F),
2FA before the vault holds real passwords (Fase C), and the session cookie reaching the API across
domains in production (Fase P).

---

## Development vs Production

| Concern | Development | Production |
|---------|------------|-----------|
| Web | `bun run dev` (turbo, port 3000) | Vercel (planned, Fase P) |
| API | `bun run dev` (turbo, port 3001) | Render (planned; `render.yaml` exists, Fase P) |
| Database | Supabase, or Postgres from `docker-compose.dev.yml` | Supabase |
| Redis | Hosted Redis, or `docker-compose.dev.yml` | Hosted Redis |
| Migrations | `prisma migrate dev` (owner approves) | `prisma migrate deploy`, step not wired yet (Fase P) |
| Secrets | `apps/api/.env`, `apps/web/.env`, root `.env` (see `.env.example`) | Platform environment variables |

---

## Architecture Documents

| Document | Description |
|----------|-------------|
| [../product/overview.md](../product/overview.md) | Scope, modules, business flows, non-goals |
| [frontend.md](./frontend.md) | Routes, auth, data fetching, client state, testing |
| [backend.md](./backend.md) | Request flow, error codes, module rules, testing |
| [database.md](./database.md) | Models, conventions, encryption, migrations |
| [../design/design-system.md](../design/design-system.md) | Tokens, components, UI patterns |
| [adr/ADR-001](./adr/ADR-001-nextjs-framework.md) | Why Next.js |
| [adr/ADR-002](./adr/ADR-002-nestjs-backend.md) | Why NestJS |
| [adr/ADR-003](./adr/ADR-003-postgresql-database.md) | Why PostgreSQL |
| [adr/ADR-004](./adr/ADR-004-better-auth.md) | Why Better Auth |
| [adr/ADR-005](./adr/ADR-005-docker-coolify-deployment.md) | Deployment (under review) |

---

*Last updated: 2026-11-01*
*Status: Active*
