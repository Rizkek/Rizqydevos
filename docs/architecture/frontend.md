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
│   │       ├── projects/, workspace/, knowledge/, developer/, links/ (+ add/),
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
| `/login` | Public, client | Email and password only; no sign-up form |
| `/reset-password` | Public, server page | Reads `searchParams` (`token`, `error`) on the server and renders `reset-password-form.tsx` (client), so the form is in the first HTML instead of waiting for JavaScript |
| `/` | Server page, client widgets | Dashboard; widgets are loaded with `next/dynamic` |
| `/projects`, `/workspace`, `/settings` | Client pages | |
| `/security` | Client | Tabs Secrets Vault, Checklist, Backup and import, Audit Log in the query string (`?tab=checklist`); `useSearchParams` inside `Suspense` |
| `/links` | Client | List, search, tag filter, add or edit sheet, import, export, link check, bookmarklet |
| `/links/add` | Client | Target of the bookmarklet: `?url=&title=` prefill the form; `useSearchParams` inside `Suspense` |
| `/knowledge` | Client | Tabs in the query string: `?tab=snippets` (default) or `?tab=prompts`, read with `nuqs` inside `Suspense` |
| `/knowledge/notes/[id]` | Client, dynamic | `new` creates a note; no page links here yet |
| `/developer` | Client | Tabs Activity, Pull requests, Repositories |
| `/infrastructure` | Server page, client panels | Vercel deployments and checks of project deploy URLs |
| `/api/auth/*` | Route handler | Better Auth |

## 3. Authentication

- `lib/auth.ts` configures Better Auth on the server: Prisma adapter on the shared Postgres, email and password, 7-day session refreshed daily, and a database hook that only lets `OWNER_EMAIL` create a user (`lib/signup-policy.ts`).
- `lib/auth-client.ts` is the browser client (`signIn`, `signOut`, `useSession`, `requestPasswordReset`, `resetPassword`, `twoFactor`) with the `twoFactorClient` plugin. Sign-up is not exported: registration is closed.
- Two-factor sign-in: `signIn.email` answers `{ twoFactorRedirect: true }` instead of a session when the account has it on. `lib/two-factor.ts` holds `needsSecondFactor`, `verifySecondFactor` (authenticator code or backup code), and `isTwoFactorEnabled`. The sign-in page (mode `code`) and the password confirmation dialog in the vault (`components/security/reauth.tsx`) both show the shared `SecondFactorField` for the second step. Settings has `TwoFactorCard` (turn on with a key and setup link, turn off, new backup codes; each needs the password). There is no QR code: no QR library is installed, so the key is shown as text next to an otpauth link.
- `proxy.ts` checks the session on every non-public request and redirects to `/login?redirectTo=...`. `lib/auth-guard.ts` holds `isPublicPath`, `getRedirectUrl`, and `safeRedirectPath` (internal paths only).
- The API verifies the same cookie by calling `/api/auth/get-session` on this app. The browser calls `/api/v1/*` on this app and `next.config.ts` rewrites it to `API_URL`, so the cookie is always sent, also when the API runs on another domain. `proxy.ts` skips `/api/v1`, so an expired session comes back as JSON 401 from the API (ADR-006).

## 4. Data fetching

All server data goes through TanStack Query and `fetchApi`:

```ts
const { data, isLoading, error } = useQuery(
  createQueryOptions(queryKeys.projects, () => fetchApi<Project[]>('/projects')),
)
```

- `lib/api.ts` `fetchApi`: calls `/api/v1` on this origin (rewritten to `API_URL` by `next.config.ts`), sends cookies, unwraps `{ success, data }`, and throws `ApiError` with `status`, `code`, and `retryAfter`. A 401 sends the browser to `/login?redirectTo=...`.
- `lib/query.ts`: `queryKeys` (one place for every key) and `createQueryOptions` (60 s stale time, no refetch on focus). Retry policy: ordinary errors once; a 502, 503, or 504 without the API's JSON body becomes `ApiError` with code `API_UNAVAILABLE` (the API is asleep or down) and is retried up to five times with delays of 1, 2, 4, 8, and 15 seconds; an expired session (401) is never retried.
- `lib/bookmarks.ts`: Links logic with unit tests: URL normalisation and typed-URL handling, tag parsing, filtering, browser bookmark file parsing (folders to tags), import preview, and HTML and JSON export. `components/links/` holds the page parts.
- `components/security/`: `useReauth` (password dialog that runs an action again after `REAUTH_REQUIRED`), `SecretRow` (30 second auto-hide, clipboard clearing), and `VaultBackup`.
- `lib/integrations.ts`: hooks for GitHub and Vercel data, `describeIntegrationError` (code to message and action), and `shouldRetryIntegration` (no retry for permanent errors).
- Mutations call `fetchApi` with a method and `invalidateQueries` on success.
- No `fetch` in components and no `useEffect` for fetching.

## 5. Client state

| Store | Persisted | Holds |
|---|---|---|
| `ui.store.ts` | localStorage `devos-ui` | sidebar open, theme, accent, density (density is not applied anywhere yet) |
| `widget.store.ts` | localStorage `devos-widgets` | dashboard widget list, enabled flags, order. On load, `mergeWidgets` keeps the saved order and flags and appends widgets that did not exist when the list was saved, so a new widget type appears without a reset |
| `command.store.ts` | no | command palette open state |
| `mobile-nav.store.ts` | no | mobile drawer open state |

`providers.tsx` creates the QueryClient, `NuqsAdapter`, `MotionConfig reducedMotion="user"`, and the sonner `Toaster`, and keeps `data-theme` and `data-accent` on `<html>` in step with the store. The first paint is handled earlier: `app/layout.tsx` puts `THEME_SCRIPT` (`lib/theme-script.ts`) in `<head>`, which reads the saved theme and accent from localStorage (`devos-ui`) and writes the two attributes before the page is drawn. It accepts only dark or light (system is resolved with `prefers-color-scheme`) and plain lowercase accent names, and ignores damaged storage.

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

`e2e/public-pages.spec.ts` also checks that the saved theme is on `<html>` before React runs. `e2e/app-pages.spec.ts` covers the ten pages behind sign-in (landmark and one h1, axe, no sideways scrolling at 320 px, skip link). It is skipped unless `E2E_EMAIL` and `E2E_PASSWORD` are set, because it needs a running API and a database; it has not been run against a real account yet (ROADMAP Fase H).

Images: GitHub avatars in Developer use `next/image` (`images.remotePatterns` allows `avatars.githubusercontent.com`). The avatar in the top bar can come from any host and stays a plain `img`.

Loading layout: the dashboard shows `DEFAULT_WIDGET_COUNT` skeletons until the saved widget list is read, so the grid keeps its height.

## 8. Adding a page

1. Create `src/app/(app)/<route>/page.tsx`; keep it a Server Component and put interactive parts in `components/<area>/`.
2. Add the route to `mainNavItems` in `components/layout/nav-links.tsx` (sidebar, drawer, and command palette follow).
3. Add query keys to `lib/query.ts`; fetch with `createQueryOptions` and `fetchApi`.
4. Cover loading, empty, and error; label every control; check keyboard use.
5. Add a test next to the component.

---

*Last updated: 2026-11-01*
*Status: Active*
