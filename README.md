# DevOS

> **A personal command center for software engineers.**

```
rizky.web.id
```

---

## What is this?

DevOS is a self-hosted personal space for one developer: links, knowledge,
prompts, passwords worth backing up, a registry of projects, and a glance at
GitHub, Vercel, and the uptime of your own sites. One user, zero running cost.

Scope decision (2026-10-14): [docs/vision/06-scope-update-2026-10.md](./docs/vision/06-scope-update-2026-10.md).
Plan: [docs/plans/ROADMAP.md](./docs/plans/ROADMAP.md). Resume work: [docs/plans/HANDOFF.md](./docs/plans/HANDOFF.md).

---

## Modules

| Module | Purpose |
|--------|---------|
| **Dashboard** | Today at a glance: tasks, notes, GitHub activity, deployments |
| **Projects** | Registry of projects: repository, deploy URL, stack, status |
| **Links** | Bookmarks with tags, pin, search, import and export (UI planned) |
| **Knowledge** | Snippets, notes, and prompts |
| **Developer** | GitHub activity, pull requests, repositories |
| **Infrastructure** | Vercel deployments, uptime and SSL expiry of your sites |
| **Security** | Per-project security checklist and the password and secret vault |
| **Workspace** | Todo, notes, scratchpad |
| **Settings** | Appearance and integrations |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| State | TanStack Query + Zustand |
| Backend | NestJS |
| Database | PostgreSQL + Prisma |
| Cache | Redis |
| Auth | Better Auth (email and password, single owner; 2FA or passkey planned) |
| Deployment | Docker + Coolify |

---

## Documentation

All documentation lives in [`/docs`](./docs/README.md).

Start here: [Vision](./docs/vision/01-vision.md)

---

## Status

> 🚧 **Phase 0 — Foundation**
> Documentation and architecture in progress. No code yet.

---

## Relationship with TRASON

DevOS is not TRASON. TRASON is a career management SaaS product.
DevOS is a personal developer workspace. They are complementary.

→ [TRASON](https://github.com/rizkek/TRASON)

---

*Self-hosted. Personal. Open architecture.*
