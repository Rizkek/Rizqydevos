# DevOS API (`apps/api`)

NestJS 11 REST API under `/api/v1`. It serves all DevOS data, verifies sessions against the web app, encrypts secrets and integration tokens, and calls GitHub and Vercel.

## Run

```bash
bun run dev            # from this folder, http://localhost:3001/api/v1
# or from the root: bun run dev (web and api together)
```

The web app must run on `BETTER_AUTH_URL`, because every protected request is verified by calling its `/api/auth/get-session`.

## Environment (`apps/api/.env`)

Validated at startup by `src/config/env.validation.ts`; the API refuses to start when a value is invalid.

| Variable | Required | Purpose |
|---|---|---|
| `APP_URL` | yes | Web origin allowed by CORS |
| `DATABASE_URL` | yes | Postgres |
| `BETTER_AUTH_URL` | yes | Web origin used to verify sessions |
| `BETTER_AUTH_SECRET` | yes | At least 32 characters (validated, not read by API code) |
| `ENCRYPTION_KEY` | in production | Exactly 32 bytes: 32 characters, 64 hex characters, or base64 of 32 bytes. Back it up; losing it makes stored secrets unreadable |
| `REDIS_URL` | no (default `redis://localhost:6379`) | Readiness check |
| `PORT` | no (3001) | |
| `TRUST_PROXY_HOPS` | no (0) | Proxies in front of the API, for per-client rate limits |
| `LOG_LEVEL` | no (info) | Pino level |

## Scripts

| Command | What it does |
|---|---|
| `bun run dev` | Watch mode |
| `bun run build` | Compile to `dist/` |
| `bun run start` | Run `dist/main` |
| `bun run test` | Vitest (`src/**/*.spec.ts`) |
| `bun run lint` | ESLint 10 with `@typescript-eslint` |
| `bun run type-check` | TypeScript |

Database commands run from the repository root, because the schema is in `prisma/`: `bunx prisma generate`, `bunx prisma migrate dev --name <change>`, `bunx prisma migrate deploy`, `bunx prisma studio`.

## Modules and routes

| Module | Routes |
|---|---|
| projects | `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id` |
| workspace | `/workspace/todos`, `/workspace/notes`, `/workspace/bookmarks` (CRUD) |
| knowledge | `/knowledge/snippets`, `/knowledge/notes` (CRUD) |
| ai | `/ai/prompts` (CRUD), `POST /ai/prompts/:id/usage` |
| integrations | `GET /integrations`, `POST/PATCH/DELETE /integrations/:provider`, `GET /integrations/github/{activity,prs,repos}`, `GET /integrations/vercel/deployments` |
| infrastructure | `GET /infrastructure/{ssl,health}` and `/batch` variants |
| audit | `GET /audit-log` |
| secrets | `/secrets` (CRUD), `GET /secrets/:id/reveal` |
| settings | `GET/PATCH /settings` |
| health | `GET /health`, `/health/liveness`, `/health/readiness` (public) |

Responses are `{ success: true, data }`; errors are `{ success: false, error: { code, message } }` with typed codes. Details, error codes, and rules: [../../docs/architecture/backend.md](../../docs/architecture/backend.md).
