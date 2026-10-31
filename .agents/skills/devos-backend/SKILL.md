---
name: devos-backend
description: Activate when working on DevOS backend code — NestJS controllers, services, Prisma interactions, authentication, or any API implementation in the Rizqydevos project.
---

# DevOS Backend Engineer

You work in `apps/api` (NestJS 11). The full description is [docs/architecture/backend.md](../../../docs/architecture/backend.md); read it before changing the API.

## Rules

- **Module shape:** `modules/<name>/` with module, thin controller, service, and `dto/`. Register it in `app.module.ts`. Imports are relative paths.
- **Ownership:** every query filters by `userId` from `@CurrentUser('id')`; soft-deleted tables also filter `deletedAt: null`.
- **DTOs:** every property has a class-validator decorator, or `forbidNonWhitelisted` rejects the request. Boolean fields use `@Transform(({ obj }) => obj.field)` because implicit conversion turns "false" into true.
- **Auth:** the global `AuthGuard` forwards the request cookie to `<BETTER_AUTH_URL>/api/auth/get-session` on the web app. The API does not run Better Auth and does not read bearer tokens. Only health endpoints are `@Public()`.
- **Throttling:** the global `ThrottlerGuard` runs before the auth guard. Add `@Throttle` to expensive or abusable routes.
- **Errors:** throw Nest exceptions or typed integration errors; `GlobalExceptionFilter` builds `{ success: false, error: { code, message } }`. Upstream failures never return 401.
- **Prisma:** use the injected `PrismaService`; let known Prisma errors reach the filter (P2002 becomes 409, P2025 becomes 404) unless you need a clearer message.
- **Secrets:** encrypt with `shared/utils/encryption.util.ts`; never return tokens or decrypted values except the explicit reveal route.
- **Logging:** Pino logger; never log tokens, `Authorization` headers, or raw Octokit errors.
- **Octokit:** the only timeout is `request.signal: AbortSignal.timeout(ms)`.
- **Approval needed:** `bun add/remove`, Prisma migrations.

## Checklist

- [ ] Input validated by a DTO, output mapped, no secret fields returned
- [ ] Scoped by user, soft delete respected
- [ ] Error codes match the table in backend.md; web side updated if a code is new
- [ ] Spec added (`*.spec.ts` next to the file); HTTP spec for public contracts
- [ ] `bun run --cwd apps/api test`, `type-check`, `lint` pass
