# Backend Architecture

How `apps/api` (NestJS 11) is structured, how a request flows, and the rules for adding to it. For the system picture see [overview.md](./overview.md); for data see [database.md](./database.md).

---

## 1. Layout

```
apps/api/src/
├── main.ts                    ← bootstrap: helmet, cookies, CORS, pipes, filter, interceptor, prefix /api/v1
├── app.module.ts              ← global guards (Throttler, then Auth), config, modules
├── health.controller.ts       ← /health, /health/liveness, /health/readiness (public, not throttled)
├── config/env.validation.ts   ← Zod schema for environment variables (+ .spec.ts)
├── database/                  ← PrismaService (Prisma 7 with @prisma/adapter-pg)
├── cache/                     ← ioredis client and CacheService (readiness only)
├── shared/
│   ├── guards/auth.guard.ts           ← session check against the web app
│   ├── filters/global-exception.filter.ts
│   ├── interceptors/response-transform.interceptor.ts
│   ├── middleware/correlation-id.middleware.ts
│   ├── decorators/                    ← @Public(), @CurrentUser()
│   ├── dto/pagination-query.dto.ts
│   ├── services/audit.service.ts
│   ├── logger/pino-logger.service.ts
│   └── utils/encryption.util.ts
└── modules/
    ├── projects/        ← /projects
    ├── workspace/       ← /workspace/todos, /workspace/notes, /workspace/bookmarks
    ├── knowledge/       ← /knowledge/snippets, /knowledge/notes
    ├── ai/              ← /ai/prompts (shown as the Prompts tab in Knowledge)
    ├── integrations/    ← /integrations, /integrations/github/*, /integrations/vercel/*
    ├── infrastructure/  ← /infrastructure/ssl*, /infrastructure/health*
    ├── audit/           ← /audit-log
    ├── secrets/         ← /secrets
    └── settings/        ← /settings (not used by the web app yet)
```

Each module has a `*.module.ts`, a thin `*.controller.ts`, a `*.service.ts` with the logic, and `dto/` with class-validator classes.

## 2. Request flow

```
Request
  → CorrelationIdMiddleware      x-request-id read or generated, echoed in the response
  → helmet, cookie-parser, CORS  CORS allows APP_URL only, with credentials
  → ThrottlerGuard (global)      100 requests/min per IP; POST /integrations/:provider 10/min; /health skipped
  → AuthGuard (global)           skipped for @Public(); otherwise forwards the cookie to
                                 <BETTER_AUTH_URL>/api/auth/get-session (5 s timeout) and sets request.user
  → ValidationPipe               whitelist, forbidNonWhitelisted, transform, implicit conversion
  → Controller → Service → Prisma
  → ResponseTransformInterceptor { success: true, data } (paginated results add meta)
  or GlobalExceptionFilter       { success: false, error: { code, message, details?, retryAfter? } }
```

The throttler runs before the auth guard on purpose: the auth guard makes an HTTP call, so floods are rejected before that call. Client IPs depend on `TRUST_PROXY_HOPS` (0 when the API is reached directly, 1 behind one proxy).

### Error codes

| Code | HTTP | Source |
|---|---|---|
| `VALIDATION_ERROR` | 400 | DTO validation; field messages in `details.fields` |
| `UNAUTHORIZED` | 401 | Missing or expired app session only |
| `NOT_FOUND`, `DUPLICATE_ENTRY`, `DATABASE_ERROR` | 404, 409, 500 | Prisma errors P2025, P2002, others |
| `RATE_LIMITED` | 429 | Throttler or provider limit; `Retry-After` header and `error.retryAfter` |
| `INTEGRATION_NOT_CONFIGURED` | 404 | Integration not connected |
| `INTEGRATION_DISABLED` | 409 | Integration switched off |
| `TOKEN_UNREADABLE` | 409 | Stored token cannot be decrypted (ENCRYPTION_KEY changed) |
| `INTEGRATION_TOKEN_INVALID` | 422 | Token rejected while saving |
| `TOKEN_REJECTED` | 424 | Provider rejected the stored token |
| `UPSTREAM_UNAVAILABLE` | 502, 504 | Provider down or timed out |
| `INTERNAL_SERVER_ERROR` | 500 | Unknown error; logged with stack, message sanitised |

Upstream failures never return 401, so the web app can treat 401 as "sign in again". Integration codes are defined in `modules/integrations/integration.errors.ts`.

## 3. Cross-cutting rules

- **Ownership.** Every query filters by `userId` from `@CurrentUser('id')`. A record of another user answers 404.
- **DTOs.** Every property needs a class-validator decorator, or the request is rejected (`forbidNonWhitelisted`). Boolean DTO fields use `@Transform(({ obj }) => obj.field)`, because implicit conversion turns the string "false" into `true`.
- **Pagination.** List endpoints accept `PaginationQueryDto` (`page` from 1, `limit` 1 to 100, default 20).
- **Soft delete.** Domain tables have `deletedAt`; reads filter `deletedAt: null`.
- **Audit.** `AuditService.log` is called by projects, secrets (create, update, delete, `REVEAL_SECRET`), and integrations (connect, enable or disable, disconnect). Other modules do not write audit entries. It never throws into the caller and never stores token values.
- **Encryption.** `encrypt`/`decrypt` in `shared/utils/encryption.util.ts`: AES-256-GCM, stored as `iv:authTag:ciphertext` in hex. `ENCRYPTION_KEY` must be exactly 32 bytes (32 UTF-8 bytes, 64 hex characters, or base64 of 32 bytes); production refuses to start without it. Values without `:` are returned as-is (rows written before encryption).
- **Logging.** Pino through `PinoLoggerService` (`LOG_LEVEL`, default `info`). Never log tokens, `Authorization` headers, or raw Octokit errors; log status and flags.
- **Configuration.** Read environment through `ConfigService` where possible. New variables go into `env.validation.ts`, `.env.example` (local reference, not tracked), the deployment config, and `turbo.json` `globalEnv` when they affect a build.

## 4. Modules in detail

### Integrations

- `IntegrationsService` stores one row per user and provider (`github`, `vercel`; anything else is 400). Tokens are encrypted; responses expose `{ id, provider, enabled, metadata: { accountLogin?, teamId? }, updatedAt }` and never the token.
- `IntegrationConnectionService` verifies the token with the provider before saving (`GET /user` on GitHub, `GET /v2/user` on Vercel, plus a deployments call when a Team ID is given) and writes the audit entry.
- `GithubService` (Octokit 22, loaded with a dynamic import because it is ESM-only): activity feed, open pull requests involving the user, recently pushed repositories. The only timeout that works is `request.signal: AbortSignal.timeout(10 s)`; an aborted request surfaces as status 500 and maps to 502.
- `VercelService` (`fetch` against `https://api.vercel.com`): `/v6/deployments` with optional `teamId`.
- Provider errors go through `fromUpstream()` so every failure has a typed code.

### Infrastructure

- `GET /infrastructure/health/batch?urls=a,b` fetches each URL (5 s timeout) and returns `{ url, online, statusCode?, latencyMs?, error? }`.
- `GET /infrastructure/ssl/batch?hostnames=a,b` opens a TLS connection on port 443 (8 s timeout) and returns `{ hostname, valid, daysRemaining, expiresAt, issuer, status }` with status `VALID`, `EXPIRING_SOON` (under 30 days), `EXPIRED`, or `ERROR`.
- At most 20 targets per batch. Host validation is a regex on the hostname: it does not resolve DNS, follow redirects safely, or catch IPv4-mapped IPv6, and it wrongly rejects hosts starting with fc or fd. Treat it as an open SSRF gap (ROADMAP Fase F item 3).

### Secrets

List and detail responses mask the value. `GET /secrets/:id/reveal` decrypts and writes `REVEAL_SECRET` to the audit log. Delete is soft; the `@@unique([userId, key])` constraint still counts deleted rows (ROADMAP Fase S item 9).

### Health

`/health` and `/health/liveness` answer `{ status: 'ok' }` without touching dependencies. `/health/readiness` runs `SELECT 1` and a Redis read and answers 503 if either fails.

## 5. Testing

- Vitest with SWC (`apps/api/vitest.config.ts`), files `src/**/*.spec.ts`, timeout 20 s because HTTP specs boot a Nest app.
- Unit specs mock Prisma, Octokit, and `fetch`. HTTP specs (`integrations.http.spec.ts`, `shared/throttling.http.spec.ts`) boot Nest with the same pipe, filter, and interceptor as `main.ts` and call it over a real socket.
- The integration error contract must keep tests: `integration.errors.spec.ts`, `github.service.spec.ts`, `vercel.service.spec.ts`.
- Not yet covered: projects, knowledge, workspace notes and bookmarks, settings, prompts, and the infrastructure host validation (ROADMAP Fase F item 8).

Commands: `bun run --cwd apps/api test`, `type-check`, `lint` (ESLint 10 with `@typescript-eslint`, `no-explicit-any` as a warning).

## 6. Adding a module

1. Create `modules/<name>/` with module, controller, service, and DTOs. Register the module in `app.module.ts`.
2. Scope every query by `userId`; filter `deletedAt: null` for soft-deleted tables.
3. Validate input with DTOs, map output (never return a raw Prisma model with secret fields).
4. Mark only health-style endpoints `@Public()`; add `@Throttle` for expensive or abusable routes.
5. Add specs for the service and, for public contracts, an HTTP spec.
6. Document new routes in [overview.md](./overview.md) and new tables in [database.md](./database.md).

---

*Last updated: 2026-11-01*
*Status: Active*
