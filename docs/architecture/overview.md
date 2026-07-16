# System Architecture Overview

This document is the entry point for understanding the complete DevOS
technical architecture. It connects frontend, backend, database, and
infrastructure into one coherent picture.

Reference ADRs for the reasoning behind each decision.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / PWA                            │
│                    rizky.web.id (HTTPS)                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Caddy (Reverse Proxy)                        │
│            Let's Encrypt SSL — managed by Coolify               │
└──────────────────┬──────────────────────┬───────────────────────┘
                   │                      │
                   ▼                      ▼
     ┌─────────────────────┐  ┌─────────────────────┐
     │   Next.js 15        │  │   NestJS 11          │
     │   Port: 3000        │  │   Port: 3001         │
     │                     │  │                      │
     │  App Router         │  │  REST API            │
     │  React Server       │  │  WebSocket Gateway   │
     │  Components         │  │  BullMQ Workers      │
     │  shadcn/ui          │  │  Cron Jobs           │
     │  TanStack Query     │  │  Better Auth         │
     │  Zustand            │  │                      │
     └─────────────────────┘  └──────────┬───────────┘
                                          │
              ┌───────────────────────────┼───────────────────────┐
              │                           │                       │
              ▼                           ▼                       ▼
  ┌───────────────────┐     ┌─────────────────────┐  ┌──────────────────┐
  │  PostgreSQL 17    │     │    Redis 7           │  │  Meilisearch     │
  │  Port: 5432       │     │    Port: 6379        │  │  Port: 7700      │
  │                   │     │                      │  │                  │
  │  Primary data     │     │  Session store       │  │  Full-text       │
  │  Prisma ORM       │     │  Query cache         │  │  search index    │
  │  Migrations       │     │  BullMQ queues       │  │  Notes, snippets │
  │  Soft deletes     │     │  Rate limiting       │  │                  │
  └───────────────────┘     └─────────────────────┘  └──────────────────┘

              External Services (API integrations)
              ┌─────────────────────────────────────┐
              │  GitHub API       Vercel API         │
              │  Cloudflare API   Docker API         │
              │  Supabase API     OpenAI / Anthropic │
              │  Resend (email)   Cloudflare R2      │
              └─────────────────────────────────────┘
```

---

## Technology Decisions Index

| Decision | Technology | ADR |
|----------|-----------|-----|
| Frontend framework | Next.js 15 (App Router) | [ADR-001](./adr/ADR-001-nextjs-framework.md) |
| Backend framework | NestJS 11 | [ADR-002](./adr/ADR-002-nestjs-backend.md) |
| Primary database | PostgreSQL 17 + Prisma | [ADR-003](./adr/ADR-003-postgresql-database.md) |
| Authentication | Better Auth | [ADR-004](./adr/ADR-004-better-auth.md) |
| Deployment | Docker + Coolify | [ADR-005](./adr/ADR-005-docker-coolify-deployment.md) |
| Cache / Queue | Redis 7 + BullMQ | (to be documented) |
| Search | Meilisearch | (to be documented) |
| Storage | Cloudflare R2 | (to be documented) |
| UI Components | Tailwind CSS v4 + shadcn/ui | (to be documented) |

---

## Monorepo Structure

```
Rizqydevos/
│
├── apps/
│   ├── web/                  ← Next.js frontend
│   │   ├── src/
│   │   ├── public/
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── api/                  ← NestJS backend
│       ├── src/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── package.json
│
├── packages/                 ← Shared code (types, utils)
│   ├── types/                ← Shared TypeScript types
│   └── validators/           ← Shared Zod schemas
│
├── docs/                     ← All documentation
├── .agents/                  ← AI agent skills
├── docker-compose.yml        ← Full stack local development
├── docker-compose.prod.yml   ← Production overrides
├── .env.example              ← Required environment variables
└── package.json              ← Turborepo root
```

---

## Data Flow

### Read Flow (typical)

```
User opens Dashboard
  │
  ▼
Next.js Server Component fetches initial data server-side
  │
  ▼
NestJS API → Service → Repository → PostgreSQL
  │
  ▼
Data returned as props to Client Components
  │
  ▼
TanStack Query handles background refresh + caching
  │
  ▼
Zustand handles UI state (sidebar, widget layout)
```

### Write Flow (typical)

```
User creates a Todo
  │
  ▼
React Hook Form validates with Zod schema (client)
  │
  ▼
TanStack Mutation → POST /api/v1/workspace/todos
  │
  ▼
NestJS: DTO validation → Service → Repository → Prisma → PostgreSQL
  │
  ▼
Service invalidates Redis cache for this user's todos
  │
  ▼
Audit log entry created
  │
  ▼
Response → TanStack Query optimistic update already shown
  │
  ▼
UI reflects confirmed state
```

### Real-time Flow

```
Server metric changes (Docker container goes down)
  │
  ▼
NestJS monitors via polling or Docker Events API
  │
  ▼
Socket.IO emits event to connected client
  │
  ▼
Dashboard widget updates without page refresh
```

---

## Security Layers

```
Layer 1: Cloudflare (WAF, DDoS protection, bot protection)
Layer 2: Caddy (HTTPS enforcement, security headers)
Layer 3: NestJS (AuthGuard, rate limiting, input validation)
Layer 4: PostgreSQL (parameterized queries, no raw SQL)
Layer 5: Application (encrypted secrets, audit log)
```

---

## Development vs Production

| Concern | Development | Production |
|---------|------------|-----------|
| Frontend | `next dev` (hot reload) | Docker container |
| Backend | `nest start --watch` | Docker container |
| Database | PostgreSQL via Docker | PostgreSQL via Docker |
| Redis | Redis via Docker | Redis via Docker |
| HTTPS | HTTP (localhost) | Caddy + Let's Encrypt |
| Secrets | `.env.local` | Coolify environment vars |
| Deploy | Manual `npm run dev` | Auto-deploy on push to `main` |

---

## Architecture Documents

| Document | Description |
|----------|-------------|
| [frontend.md](./frontend.md) | Next.js folder structure, state management, routing, performance |
| [backend.md](./backend.md) | NestJS modules, clean architecture, API design, auth, queues |
| [database.md](./database.md) | Prisma schema, models, migration strategy, encryption |
| [adr/ADR-001](./adr/ADR-001-nextjs-framework.md) | Why Next.js |
| [adr/ADR-002](./adr/ADR-002-nestjs-backend.md) | Why NestJS |
| [adr/ADR-003](./adr/ADR-003-postgresql-database.md) | Why PostgreSQL |
| [adr/ADR-004](./adr/ADR-004-better-auth.md) | Why Better Auth |
| [adr/ADR-005](./adr/ADR-005-docker-coolify-deployment.md) | Why Docker + Coolify |

---

*Last updated: 2026-07-17*
*Status: Foundation*
