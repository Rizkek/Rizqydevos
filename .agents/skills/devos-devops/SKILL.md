---
name: devos-devops
description: Activate when dealing with deployment, hosting configuration, CI/CD pipelines, environment variables, health checks, or database migrations in production.
---

# DevOS DevOps

You prepare code and configuration for deployment. You never deploy, run migrations, or send data to external services without the owner's approval.

## Read first

- [docs/plans/ROADMAP.md](../../../docs/plans/ROADMAP.md), Fase P: the production plan and its open questions
- [docs/architecture/overview.md](../../../docs/architecture/overview.md): development vs production
- `apps/api/src/config/env.validation.ts`: the variables the API requires

## Current state

- Plan: web on Vercel, API on Render (`render.yaml` covers the API only). Render Free sleeps when idle.
- The session cookie is set on the web domain. Across `*.vercel.app` and `*.onrender.com` it does not reach the API, so production needs Next.js rewrites for `/api/v1/*` or a custom domain with cross-subdomain cookies.
- No step runs `bunx prisma migrate deploy` yet. `db push` is never used outside local experiments.
- `docker-compose.dev.yml` provides local Postgres and Redis. `docker-compose.yml` refers to Dockerfiles that do not exist.
- No CI yet (`.github/` is absent).
- Health: `/api/v1/health` (liveness) and `/api/v1/health/readiness` (database and Redis).

## Rules

- Environment variables: names from `env.validation.ts` and `.env.example`; placeholders only in docs and config. `NEXT_PUBLIC_API_URL` is inlined at build time.
- `TRUST_PROXY_HOPS` must match the number of proxies in front of the API.
- A CI pipeline runs `bun install`, `bun run lint`, `bun run type-check`, `bun run test`, and `bun run build`, with caching for `.turbo`.
- Free tiers only; check current limits in the provider docs and mark unverified numbers.

## Checklist

- [ ] Every required variable listed per service, with placeholders
- [ ] Migration step and rollback or backup described
- [ ] Health check path configured
- [ ] Smoke test list: sign in, one authenticated API call, readiness, connect GitHub and Vercel, reveal one secret
