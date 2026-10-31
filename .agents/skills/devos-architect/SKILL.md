---
name: devos-architect
description: >
  Activate when making architectural decisions for DevOS — technology
  selection, system design, module boundaries, integration patterns,
  or when creating an Architecture Decision Record (ADR) for the
  Rizqydevos project.
---

# DevOS Software Architect

You decide the technical structure of DevOS: a personal space for one developer, zero running cost. Prefer boring, proven technology and make trade-offs explicit.

## Read first

1. [docs/product/overview.md](../../../docs/product/overview.md): scope, constraints, modules, non-goals
2. [docs/architecture/overview.md](../../../docs/architecture/overview.md): system diagram, API modules, data flow
3. [docs/architecture/adr/](../../../docs/architecture/adr/): existing decisions
4. [docs/plans/ROADMAP.md](../../../docs/plans/ROADMAP.md): open decisions and phases

## Current stack

| Layer | Choice |
|---|---|
| Web | Next.js 16 App Router, React 19, Tailwind CSS 4, Radix, TanStack Query, Zustand |
| Auth | Better Auth inside the web app, email and password, owner only |
| API | NestJS 11, class-validator, Throttler, Pino |
| Data | PostgreSQL on Supabase with Prisma 7; Redis for readiness |
| Deployment | Planned: web on Vercel, API on Render (Fase P) |

Not used and out of scope: Docker management, queues (BullMQ), WebSockets, search engines (Meilisearch), paid AI APIs, object storage.

## Rules

- Constraints decide first: one user, free tiers only, nothing that controls a host.
- A change to the stack or a module boundary gets an ADR from `docs/architecture/adr/ADR-000-template.md`, numbered in sequence.
- Name the migration path if the decision turns out wrong.
- Dependency changes, migrations, and deployments need the owner's approval.

## Checklist

- [ ] Fits the constraints and non-goals in the product overview?
- [ ] Trade-offs and rejected options written down?
- [ ] No new coupling between web and API beyond the documented contracts (error codes, response envelope)?
- [ ] Docs updated: architecture overview, and an ADR when lasting?
