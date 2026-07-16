# ADR-005 — Use Docker + Coolify for Deployment

**Date:** 2026-07-17
**Status:** Accepted
**Deciders:** Rizky

---

## Context

DevOS is self-hosted on a VPS. The deployment system must handle:
- Next.js frontend service
- NestJS backend service
- PostgreSQL database
- Redis cache
- Meilisearch
- BullMQ workers
- Reverse proxy (HTTPS termination)
- Automated deployments on git push

All of this must be manageable by a solo developer without a dedicated
DevOps team.

---

## Decision Drivers

- Self-hosted — no vendor lock-in to Vercel, Railway, or Render
- Must handle multiple services (Next.js, NestJS, PostgreSQL, Redis, etc.)
- Automated deployment pipeline (git push → deploy)
- HTTPS termination with auto-renewing SSL certificates
- Must not require extensive Kubernetes knowledge
- Disaster recovery must be straightforward (rebuild from docker-compose)
- Low monthly cost

---

## Options Considered

### Option A — Docker + Coolify
**Pros:**
- Coolify is a self-hosted Heroku/Vercel alternative
- Manages Docker deployments with a GUI and CLI
- Auto-deploys on git push via webhooks
- Built-in HTTPS with Let's Encrypt (via Caddy)
- Supports multi-service deployments (docker-compose)
- Dashboard for logs, resource usage, and health
- Zero additional cost (runs on the same VPS)

**Cons:**
- Coolify itself adds another service to maintain
- Less mature than Kubernetes for complex scaling
- If Coolify has a bug, it can affect all services

---

### Option B — Docker Compose (manual, no orchestration layer)
**Pros:**
- Simple — just `docker-compose up`
- No additional software beyond Docker
- Fully understood and controlled

**Cons:**
- No auto-deploy — must SSH into server and pull manually
- No built-in health monitoring dashboard
- No HTTPS automation — must configure Caddy/Nginx manually
- More DevOps work for each deployment

---

### Option C — Vercel (frontend) + Railway (backend)
**Pros:**
- Zero DevOps — just push and it deploys
- HTTPS automatic
- Excellent DX

**Cons:**
- **Not self-hosted** — violates the core DevOS philosophy
- Secrets and data touch third-party infrastructure
- Cost scales with usage — eventually expensive
- Vendor lock-in for both services

---

### Option D — Kubernetes (k3s)
**Pros:**
- Industry standard for container orchestration
- Excellent scaling and self-healing

**Cons:**
- Massive overkill for a single-user personal application
- High operational complexity for a solo developer
- Significant time investment to set up and maintain
- Not needed at DevOS's scale

---

## Decision

We chose **Docker + Coolify** because:

1. Coolify provides the automation (auto-deploy, HTTPS, monitoring) that
   makes bare docker-compose feel incomplete, without the complexity of
   Kubernetes
2. Coolify runs on the same VPS as DevOS — no additional cost, no new
   external dependency
3. The entire deployment can still be described in `docker-compose.yml` —
   if Coolify is removed, a single command restores everything
4. HTTPS with Let's Encrypt and automatic renewal is handled by Coolify's
   built-in Caddy integration

The philosophy: Coolify is a convenience layer, not a hard dependency.
The `docker-compose.yml` is always the source of truth.

---

## Service Architecture

```
VPS (Ubuntu 24.04)
│
├── Coolify (management layer)
│   ├── HTTPS via Caddy (Let's Encrypt)
│   └── Auto-deploy via GitHub webhooks
│
├── nginx / Caddy (reverse proxy)
│   ├── rizky.web.id → Next.js :3000
│   └── api.rizky.web.id → NestJS :3001
│
├── Next.js container     :3000
├── NestJS container      :3001
├── PostgreSQL container  :5432
├── Redis container       :6379
├── Meilisearch container :7700
└── BullMQ worker         (same container as NestJS or separate)
```

## docker-compose.yml Structure

```yaml
services:
  frontend:
    build: ./apps/web
    ports: ["3000:3000"]
    environment: [...]
    depends_on: [backend]

  backend:
    build: ./apps/api
    ports: ["3001:3001"]
    environment: [...]
    depends_on: [postgres, redis]

  postgres:
    image: postgres:17-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]
    environment: [...]

  redis:
    image: redis:7-alpine
    volumes: [redis_data:/data]

  meilisearch:
    image: getmeili/meilisearch:latest
    volumes: [meili_data:/meili_data]

volumes:
  postgres_data:
  redis_data:
  meili_data:
```

---

## Backup Strategy

```
Daily at 02:00 WIB:
  pg_dump → compress → upload to Cloudflare R2

Weekly:
  Full volume backup → Cloudflare R2

Retention:
  Daily backups: 7 days
  Weekly backups: 4 weeks
```

---

## Consequences

**Positive:**
- One-command local development: `docker-compose up`
- Auto-deploy on git push to `main`
- HTTPS fully automated
- Monitoring dashboard (Coolify UI)
- Full data sovereignty — everything on own VPS

**Negative / Trade-offs:**
- VPS must be managed and kept updated (security patches)
- If VPS goes down, DevOS goes down (no redundancy for personal use)
- Coolify updates must be applied periodically

---

## References

- [Coolify docs](https://coolify.io/docs)
- [Docker Compose reference](https://docs.docker.com/compose/compose-file/)
- [Caddy reverse proxy](https://caddyserver.com/docs/)

---

*Last updated: 2026-07-17*
