# Frontend Architecture

How `apps/web` (Next.js 16 App Router, React 19) is structured: routes, auth, data fetching, state, and testing. UI tokens and components are in [../design/design-system.md](../design/design-system.md).

---

## 1. Layout

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx             ← fonts (Geist), Providers, Speed Insights
│   │   ├── globals.css            ← design tokens (+ globals.contrast.test.ts)
│   │   ├── login/, reset-password/  ← public pages
│   │   ├── api/auth/[...all]/route.ts  ← Better Auth handler
│   │   └── (app)/                 ← signed-in area with sidebar and topbar
│   │       ├── layout.tsx
│   │       ├── page.tsx           ← Dashboard (Server Component)
│   │       ├── projects/, workspace/, knowledge/, developer/,
│   │       │   infrastructure/, security/, settings/
│   │       └── knowledge/notes/[id]/   ← Markdown note editor
│   ├── components/
│   │   ├── ui/          ← base components (Button, TextField, Sheet, Tabs, ...)
│   │   ├── shared/      ← PageHeader, LoadingState, ListSkeleton, EmptyState, IntegrationNotice
│   │   ├── layout/      ← Sidebar, MobileNav, Topbar, CommandPalette, NavLinks
│   │   ├── dashboard/   ← WidgetGrid, WidgetCard, widgets/
│   │   ├── developer/, infrastructure/, knowledge/, settings/, auth/
│   │   └── providers.tsx
│   ├── lib/             ← api.ts, query.ts, integrations.ts, sites.ts, auth*.ts, format.ts, utils.ts
│   ├── stores/          ← Zustand: ui, widget, command, mobile-nav
│   ├── test/            ← setup, renderWithQuery, axe helper
│   └── proxy.ts         ← session gate (replaces middleware.ts in Next 16)
├── e2e/                 ← Playwright (system Chrome)
├── scripts/create-owner.ts
└── next.config.ts       ← redirects /ai and /monitoring
```

There is no `features/` folder: page-specific components live under `components/<area>/`.

## 2. Routes

| Route | Type | Notes |
|---|---|---|
| `/login`, `/reset-password` | Public, client | Email and password only; no sign-up form |
| `/` | Server page, client widgets | Dashboard; widgets are loaded with `next/dynamic` |
| `/projects`, `/workspace`, `/security`, `/settings` | Client pages | |
| `/knowledge` | Client | Tabs in the query string: `?tab=snippets` (default) or `?tab=prompts`, read with `nuqs` inside `Suspense` |
| `/knowledge/notes/[id]` | Client, dynamic | `new` creates a note; no page links here yet |
| `/developer` | Client | Tabs Activity, Pull requests, Repositories |
| `/infrastructure` | Server page, client panels | Vercel deployments and checks of project deploy URLs |
| `/api/auth/*` | Route handler | Better Auth |

## 3. Authentication

- `lib/auth.ts` configures Better Auth on the server: Prisma adapter on the shared Postgres, email and password, 7-day session refreshed daily, and a database hook that only lets `OWNER_EMAIL` create a user (`lib/signup-policy.ts`).
- `lib/auth-client.ts` is the browser client (`signIn`, `signOut`, `useSession`, `requestPasswordReset`, `resetPassword`).
- `proxy.ts` checks the session on every non-public request and redirects to `/login?redirectTo=...`. `lib/auth-guard.ts` holds `isPublicPath`, `getRedirectUrl`, and `safeRedirectPath` (internal paths only).
- The API verifies the same cookie by calling `/api/auth/get-session` on this app. That only works when the browser sends the cookie to the API, which is true on localhost but not across production domains (ROADMAP Fase P: proxy `/api/v1/*` through Next).

## 4. Data fetching

All server data goes through TanStack Query and `fetchApi`:

```ts
const { data, isLoading, error } = useQuery(
  createQueryOptions(queryKeys.projects, () => fetchApi<Project[]>('/projects')),
)
```

- `lib/api.ts` `fetchApi`: prefixes `NEXT_PUBLIC_API_URL` + `/api/v1`, sends cookies, unwraps `{ success, data }`, and throws `ApiError` with `status`, `code`, and `retryAfter`. A 401 sends the browser to `/login?redirectTo=...`.
- `lib/query.ts`: `queryKeys` (one place for every key) and `createQueryOptions` (60 s stale time, no refetch on focus, one retry).
- `lib/integrations.ts`: hooks for GitHub and Vercel data, `describeIntegrationError` (code to message and action), and `shouldRetryIntegration` (no retry for permanent errors).
- Mutations call `fetchApi` with a method and `invalidateQueries` on success.
- No `fetch` in components and no `useEffect` for fetching.

## 5. Client state

| Store | Persisted | Holds |
|---|---|---|
| `ui.store.ts` | localStorage `devos-ui` | sidebar open, theme, accent, density (density is not applied anywhere yet) |
| `widget.store.ts` | localStorage `devos-widgets` | dashboard widget list, enabled flags, order |
| `command.store.ts` | no | command palette open state |
| `mobile-nav.store.ts` | no | mobile drawer open state |

`providers.tsx` creates the QueryClient, `NuqsAdapter`, `MotionConfig reducedMotion="user"`, and the sonner `Toaster`, and writes `data-theme` and `data-accent` on `<html>`. The theme is applied in an effect after hydration, so light-theme users see a dark flash (ROADMAP Fase E1).

## 6. Conventions

- Server Component by default; add `'use client'` only for state, effects, or handlers.
- Reuse `cn`, `fetchApi`, `createQueryOptions`, `queryKeys`, and the components in `components/ui` and `components/shared` before writing new ones.
- Every data view has loading, empty, and error states (see design-system.md, section 4).
- Do not set state inside effects to sync props or server data; derive it during render, or adjust state during render as in `knowledge/notes/[id]/page.tsx`. Lint (`react-hooks/set-state-in-effect`) blocks this.
- Before writing Next.js code, read the matching guide in `node_modules/next/dist/docs/`; Next 16 differs from older versions (`proxy.ts`, no `next lint`).

## 7. Testing

| Kind | Where | Command |
|---|---|---|
| Unit and component | `src/**/*.test.ts(x)` with Testing Library, jsdom, `renderWithQuery` | `bun run --cwd apps/web test` |
| Accessibility | `src/a11y.test.tsx` (axe), `globals.contrast.test.ts` | same |
| Browser | `e2e/public-pages.spec.ts` (Playwright, system Chrome): axe, 320px reflow, tab order on `/login` and `/reset-password` | `bun run build` then `bun run --cwd apps/web test:e2e` |

Pages behind sign-in have no browser tests yet; they need a test account (ROADMAP Fase E item 0).

## 8. Adding a page

1. Create `src/app/(app)/<route>/page.tsx`; keep it a Server Component and put interactive parts in `components/<area>/`.
2. Add the route to `mainNavItems` in `components/layout/nav-links.tsx` (sidebar, drawer, and command palette follow).
3. Add query keys to `lib/query.ts`; fetch with `createQueryOptions` and `fetchApi`.
4. Cover loading, empty, and error; label every control; check keyboard use.
5. Add a test next to the component.

---

*Last updated: 2026-11-01*
*Status: Active*
