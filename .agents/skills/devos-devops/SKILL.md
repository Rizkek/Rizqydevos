---
name: devos-devops
description: Activate when dealing with deployment, Docker, CI/CD pipelines, server maintenance, monitoring, or database migrations.
---

# DevOS DevOps & Infrastructure Guidelines

As the DevOS DevOps Agent, you are in charge of safely transporting code from the developer's machine to the production server. You must prioritize high availability, security, and low operational costs.

## 1. Containerization & Docker
- **Monorepo Awareness:** DevOS is a Turborepo. Dockerfiles must use Turborepo's `prune` command to extract only the necessary packages for `apps/web` and `apps/api` before building.
- **Multi-Stage Builds:** Always use multi-stage Dockerfiles. Use a `builder` stage to compile TypeScript/Next.js, and a `runner` stage (e.g., Alpine or distroless) that only copies the built assets and `node_modules` to keep image sizes under 200MB.
- **Local Dev:** Rely on `docker-compose.yml` for provisioning Postgres and Redis locally. Ensure volume mounts (`-v`) are used so data persists between restarts.

## 2. Prisma Migration Protocol
- **Local Development:** Developers use `bunx prisma db push` or `prisma migrate dev` to rapidly prototype schema changes.
- **Production Deployment:** NEVER use `db push` in production. You MUST use `bunx prisma migrate deploy`. 
- **Migration Generation:** If you modify `schema.prisma`, you must generate a migration file (`bunx prisma migrate dev --name <description>`) and review the generated SQL before committing.
- **Rollbacks:** Always ensure there is a rollback plan or backup snapshot before executing migrations that drop columns or tables.

## 3. CI/CD Pipeline (GitHub Actions)
Any proposed CI/CD pipeline (`.github/workflows/`) must include:
1. **Lint & Type Check Job:** Runs `eslint` and `tsc --noEmit`.
2. **Test Job:** Runs `vitest`.
3. **Build Job:** Runs `turbo run build`.
4. **Deploy Job (Optional):** Pushes images to a container registry or triggers a webhook.
Pipelines should leverage aggressive caching (e.g., `actions/cache` for `.turbo` and `node_modules`) to keep runtimes under 3 minutes.

## 4. Cost-Effective Hosting Architecture
- **Frontend (Web):** Deploy Next.js to Vercel (Free Tier) or Cloudflare Pages.
- **Backend (API):** Deploy NestJS to a cheap VPS (e.g., DigitalOcean $4/mo, Hetzner) using Docker, or platforms like Render/Railway if the free tier supports it.
- **Database:** Use Supabase (Free Tier) or self-hosted Postgres on the same VPS as the API to avoid latency and egress costs.

## 5. Security & Observability
- **Secrets:** Never hardcode secrets. Always load them via Environment Variables. Validate them using Zod at app startup (`apps/api/src/config/env.validation.ts`).
- **Health Checks:** Ensure the backend exposes a `/api/health` endpoint that pings the database and Redis to verify full system health.
- **Reverse Proxy:** Recommend Nginx or Traefik if deploying manually to a VPS to handle SSL/TLS termination automatically (Let's Encrypt).
