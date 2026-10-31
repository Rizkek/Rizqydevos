# DevOS Web (`apps/web`)

Next.js 16 App Router app: every page of DevOS, and Better Auth for sign-in. It talks to the API in `apps/api` for all data except authentication.

## Run

```bash
bun run dev            # from this folder, http://localhost:3000
# or from the root: bun run dev (web and api together)
```

The API must run on `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).

## Environment (`apps/web/.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres for Better Auth tables (same database as the API) |
| `BETTER_AUTH_URL` | Origin of this app, for example `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Signs sessions; at least 32 characters |
| `NEXT_PUBLIC_API_URL` | API origin; inlined at build time, rebuild after changing it |
| `OWNER_EMAIL` | Only needed when running `create-owner` |

## Scripts

| Command | What it does |
|---|---|
| `bun run dev` | Development server |
| `bun run build` | Production build (`next build --webpack`) |
| `bun run start` | Serve the production build |
| `bun run lint` | ESLint (lint errors block) |
| `bun run type-check` | TypeScript |
| `bun run test` | Vitest: components, hooks, axe, contrast |
| `bun run test:e2e` | Playwright with system Chrome on the public pages (run `build` first) |
| `bun run create-owner` | Create the single owner account; needs `OWNER_EMAIL` and `OWNER_PASSWORD` |

## Structure

| Path | Contents |
|---|---|
| `src/app/(app)/` | Signed-in pages: Dashboard, Projects, Workspace, Knowledge, Developer, Infrastructure, Security, Settings |
| `src/app/login`, `src/app/reset-password` | Public pages |
| `src/app/api/auth/[...all]` | Better Auth route handler |
| `src/proxy.ts` | Session gate for every non-public page (Next 16 replacement for middleware) |
| `src/components/ui`, `shared`, `layout` | Base components, shared states, app shell |
| `src/lib/api.ts`, `query.ts` | `fetchApi`, `ApiError`, `queryKeys`, `createQueryOptions` |
| `src/stores/` | Zustand stores (theme, accent, widget layout, palette, drawer) |
| `e2e/` | Playwright specs |

## Rules that matter here

- Next.js 16 differs from older versions: read `node_modules/next/dist/docs/` before using a Next.js API. `proxy.ts` replaces `middleware.ts`; `next lint` no longer exists.
- Data goes through TanStack Query and `fetchApi`, never `fetch` in a component.
- Use design tokens and the components in `src/components/ui`; see [../../docs/design/design-system.md](../../docs/design/design-system.md).

More: [../../docs/architecture/frontend.md](../../docs/architecture/frontend.md) and [../../AGENTS.md](../../AGENTS.md).
