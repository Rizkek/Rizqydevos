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
    ├── checklist/       ← /checklist
    ├── secrets/         ← /secrets
    └── settings/        ← /settings (not used by the web app yet)
```

Each module has a `*.module.ts`, a thin `*.controller.ts`, a `*.service.ts` with the logic, and `dto/` with class-validator classes.

## 2. Request flow

```
Request
  → CorrelationIdMiddleware      x-request-id read or generated, echoed in the response
  → helmet, cookie-parser, CORS  APP_URL only; browsers reach the API through the web app proxy
  → ThrottlerGuard (global)      100 requests/min per IP; POST /integrations/:provider 10/min; /health skipped
  → AuthGuard (global)           skipped for @Public(); otherwise forwards the cookie to
                                 <BETTER_AUTH_URL>/api/auth/get-session (5 s timeout) and sets request.user;
                                 a verified session is remembered for 30 s (SessionCache)
  → ValidationPipe               whitelist, forbidNonWhitelisted, transform, implicit conversion
  → Controller → Service → Prisma
  → ResponseTransformInterceptor { success: true, data } (paginated results add meta)
  or GlobalExceptionFilter       { success: false, error: { code, message, details?, retryAfter? } }
```

The throttler runs before the auth guard on purpose: the auth guard makes an HTTP call, so floods are rejected before that call. The session cache (`shared/guards/session-cache.ts`) keeps at most 50 entries for 30 seconds, keyed by a SHA-256 hash of the cookie header, and stores successes only. A page that loads several lists therefore asks the web app once. A session signed out elsewhere still works here for up to 30 seconds. Client IPs depend on `TRUST_PROXY_HOPS` (0 when the API is reached directly, 1 behind one proxy).

### Error codes

| Code | HTTP | Source |
|---|---|---|
| `VALIDATION_ERROR` | 400 | DTO validation; field messages in `details.fields` |
| `UNAUTHORIZED` | 401 | Missing or expired app session only |
| `NOT_FOUND`, `DUPLICATE_ENTRY`, `DATABASE_ERROR` | 404, 409, 500 | Prisma errors P2025, P2002, others |
| `RATE_LIMITED` | 429 | Throttler or provider limit; `Retry-After` header and `error.retryAfter` |
| `REAUTH_REQUIRED` | 403 | Vault action needs a sign-in from the last 15 minutes |
| `INVALID_BACKUP` | 400 | Not a DevOS secrets backup, wrong passphrase, or a changed file |
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
- At most 20 targets per batch. Validation has two layers (`host-guard.ts`, `target-validation.ts`). The first refuses malformed names and literal private addresses with a 400. The second runs where the connection is opened: a custom `lookup` resolves the name and refuses any private result, so a public name that resolves to a private address is blocked as well.
- Blocked ranges: loopback, private, link-local (cloud metadata at 169.254.169.254), CGNAT, benchmarking, documentation, multicast, and reserved IPv4; the same ranges for IPv6, including IPv4-mapped, NAT64, and 6to4 forms that wrap an IPv4 address.
- Uptime checks follow redirects themselves, at most 3 hops, and check every hop like the first request. Only http and https are accepted.
- The lookup is injectable (`HOST_LOOKUP` provider) so tests resolve names to chosen addresses. Real DNS behaviour on Render is not verified yet (ROADMAP Fase H).

### Checklist

Per-project security chores (`/checklist`, table `ChecklistItem`). Every query filters by `userId`, and `projectId` and `secretId` are checked to belong to the same user before an item is created or changed.

- `GET /checklist` returns up to 2000 items, each with its project name.
- `POST /checklist` creates an item: `projectId`, `title` (up to 300), optional `note` (up to 1000), `dueAt` (ISO 8601), `repeatDays` (1 to 3650), `secretId`.
- `POST /checklist/templates` with `{ projectId }` adds the six recommended items (`checklist-templates.ts`) and skips titles the project already has. It answers `{ created }`.
- `PATCH /checklist/:id` changes any of those fields. In this DTO `null` clears a value and a missing field leaves it alone. Setting `done: true` stores `doneAt`; when the item has `repeatDays` and the request has no `dueAt`, the next due date becomes now plus the interval. `done: false` clears `doneAt`.
- `DELETE /checklist/:id` answers 204. Deleting a secret sets `secretId` to null on its items; deleting a project removes its items.
- The state of an item (overdue, open, due soon, ok) is computed in the web app (`lib/checklist.ts`), not stored.

### Secrets

List and detail responses mask the value.

- **Recent sign-in.** `AuthGuard` keeps `{ id, createdAt }` of the Better Auth session on the request (`@CurrentSession()`). `reveal`, `POST /secrets/backup`, and `POST /secrets/restore` answer 403 `REAUTH_REQUIRED` when `createdAt` is older than 15 minutes (`REAUTH_WINDOW_MS`). The session time only changes when the user signs in again, which the web app does in its password dialog **[verify against the running app: a new sign-in must produce a new session createdAt]**.
- **Reveal.** `GET /secrets/:id/reveal` decrypts and writes `REVEAL_SECRET` to the audit log; 20 requests per minute.
- **Delete.** Soft delete that also sets `value` to an empty string. `create` reuses a deleted row with the same key and username, because `@@unique([userId, key, username])` counts deleted rows. Changing a username first removes a deleted row that holds the new identity.
- **Backup.** `POST /secrets/backup` takes `{ passphrase }` (12 to 256 characters) and returns a file sealed by `backup-crypto.ts`: scrypt (N=2^15, r=8, p=1) derives a key from the passphrase and AES-256-GCM encrypts the JSON list of secrets. The scrypt cost is fixed in code and a file asking for another cost is refused, so a crafted file cannot exhaust the server. `POST /secrets/restore` takes `{ passphrase, backup }` and, in one transaction, adds missing keys, revives deleted ones, and skips keys that are active. Both are limited to 5 requests per minute and audited as `EXPORT_SECRETS` and `IMPORT_SECRETS` with counts.
- **Key rotation.** `bun run --cwd apps/api rotate-key` (`src/scripts/rotate-encryption-key.ts`) re-encrypts `Secret.value` and the `Integration` tokens from `OLD_ENCRYPTION_KEY` to `NEW_ENCRYPTION_KEY` in one transaction; a value that does not open with the old key aborts before anything is written. `DRY_RUN=1` only checks.

- **Fields (v2).** Besides `name`, `key`, `value`, `category` (the type), and `description` (notes), a secret has `username` (empty when there is no account; part of the unique identity), `url`, and `tags` (up to 20, 50 characters each). Update accepts the same fields; a clash on key and username answers 409.
- **Import.** `POST /secrets/import` takes `{ items, dryRun? }` with 1 to 2000 rows (`name`, `key`, `username?`, `url?`, `value`, `category?`, `description?`); 10 requests per minute. The browser parses the CSV. With `dryRun: true` it returns the counts and writes nothing; otherwise it creates new identities in one transaction (`createMany`, 30 s timeout), revives deleted ones, and skips identities in the vault or repeated in the request, and audits `IMPORT_SECRETS` with counts and `source: csv`. It does not need a recent sign-in, because it adds secrets and reveals none. Restore uses the same write path (`writeSecrets`).
- **Backup format version 2** adds username, url, and tags. Version 1 files still restore, with empty values for the new fields.

### Bookmarks

`GET /workspace/bookmarks/all` returns up to 5000 links (pinned first, then newest) for the Links page. `POST /workspace/bookmarks/import` takes up to 2000 items per request and skips links already saved or repeated in the request, comparing URLs with `normalizeBookmarkUrl` (host lowercased, no fragment, no trailing slash); 10 requests per minute. URLs must be absolute http or https. The JSON body limit is 4 MB (`main.ts`).

### Health

`/health` and `/health/liveness` answer `{ status: 'ok' }` without touching dependencies. `/health/readiness` runs `SELECT 1` and a Redis read and answers 503 if either fails. The Redis client (`cache/redis.client.ts`) fails fast (one retry per command, 2 s command timeout) and logs each distinct connection error once, plus a line when the connection returns, instead of printing an unhandled error on every reconnect. Readiness is its only caller.

## 5. Testing

- Vitest with SWC (`apps/api/vitest.config.ts`), files `src/**/*.spec.ts`, timeout 20 s because HTTP specs boot a Nest app.
- Unit specs mock Prisma, Octokit, and `fetch`. HTTP specs (`integrations.http.spec.ts`, `shared/throttling.http.spec.ts`) boot Nest with the same pipe, filter, and interceptor as `main.ts` and call it over a real socket.
- The integration error contract must keep tests: `integration.errors.spec.ts`, `github.service.spec.ts`, `vercel.service.spec.ts`.
- Covered: bookmarks (import, deduplication, URL and limits validation), secrets (recent sign-in, backup and restore, duplicate keys), backup encryption, key rotation, checklist (ownership, templates, repeat dates), the SSRF guard (address ranges, resolution at connect time, redirects), the session cache, the Redis error logging, and the auth guard.
- `shared/data-ownership.spec.ts` runs one parametrised check over the services that hold user data: a record owned by another user is never returned, changed, or deleted.
- Not yet covered: projects, knowledge, workspace notes, settings, and prompts beyond the ownership check.

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
