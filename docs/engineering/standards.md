# Engineering Standards

Conventions for code in this repository. AGENTS.md at the root holds the full working rules for AI agents; this document is the short version for any contributor. Where they differ, AGENTS.md wins.

---

## 1. Tooling

| Concern | Choice |
|---|---|
| Package manager and runtime | Bun (workspaces), Node 20+ |
| Monorepo tasks | Turborepo: `bun run dev`, `build`, `lint`, `type-check`, `test` from the root |
| Language | TypeScript 6, strict |
| Lint | ESLint 9 in web (`eslint-config-next`), ESLint 10 with `@typescript-eslint` in api. Lint errors block; warnings are debt |
| Tests | Vitest in both apps; Testing Library and jsdom in web; Playwright with system Chrome for browser tests |

## 2. Git

- One branch, `main`. The owner commits and pushes; agents hand over ready-to-run `git add` and `git commit` commands only.
- Conventional Commits: `type(scope): lowercase summary without a period`, at most 72 characters. Types: feat, fix, refactor, perf, test, docs, chore. Scope is the module (`integrations`, `dashboard`, `auth`, `config`, `api`, `web`).
- The body explains why, not what. No Co-Authored-By line.
- Never commit `.env` files, tokens, keys, or `ENCRYPTION_KEY`. `.env.example` is a local reference and is not tracked.

## 3. Naming

| Thing | Style | Example |
|---|---|---|
| Files and folders | kebab-case | `sites-panel.tsx`, `integration.errors.ts` |
| React components | PascalCase | `SitesPanel` |
| Variables and functions | camelCase | `sitesFromProjects` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_SITES` |
| Nest classes | PascalCase with suffix | `InfrastructureController`, `SslService` |
| Tests | next to the file | `sites.test.ts` (web), `ssl.service.spec.ts` (api) |

## 4. TypeScript

- No new `any`; use `unknown` or a real type. No new non-null assertions (`!`), no `@ts-ignore`.
- Shared types go to `packages/types` (`@devos/types`) when both apps need them.
- Prefer types derived from existing ones (`Project['status']`) over string casts.

## 5. React and Next.js

- Server Components by default; `'use client'` only for state, effects, or handlers.
- Data through TanStack Query with `fetchApi` and keys from `queryKeys`; no `fetch` or `useEffect` for data in components.
- Do not mirror props or server data into state with an effect; derive it, or adjust state during render.
- Every data view handles loading, empty, and error. No spinners.
- Reuse `components/ui` and `components/shared` before adding components. Use `cn` for conditional classes.
- Read `node_modules/next/dist/docs/` before using a Next.js API; this is Next 16.

## 6. API

- Controllers route; services hold logic; DTOs validate every input field.
- Scope every query by the current user. Return mapped data, never secret fields.
- Errors use typed codes through `GlobalExceptionFilter`; upstream failures never return 401.
- Details: [../architecture/backend.md](../architecture/backend.md).

## 7. UI and accessibility

- Tokens and components: [../design/design-system.md](../design/design-system.md). Flat, solid colours from tokens; no gradients or decorative icons.
- Target WCAG 2.2 AA: labels on every input, names on icon buttons, visible focus, dialogs on Radix Dialog, text at least 12px, status never by colour alone.

## 8. Tests

- Test observable behaviour (what the user sees, what the API returns), not implementation details. Mock external services (Octokit, `fetch`, Prisma).
- A bug fix comes with a test that fails before the fix and passes after.
- Contracts that the other app depends on (error codes, response shapes) need tests.
- Before handing work over: `bun run type-check`, `bun run lint`, `bun run test`. Browser tests: `bun run build`, then `bun run --cwd apps/web test:e2e`.

## 9. Security

- Secrets and integration tokens are encrypted with `ENCRYPTION_KEY` and never returned by the API.
- Never log tokens, `Authorization` headers, or raw provider errors.
- Outgoing requests to user-supplied URLs go through host validation (the current filter is incomplete; see backend.md).
- Dependency changes (`bun add`, `bun remove`) and database migrations need the owner's approval.

## 10. Documentation

- Docs describe the code as it is. When code changes behaviour, update the matching document in the same change.
- Every document ends with `Last updated` and `Status`.
- Plans and state live in `docs/plans/` (ROADMAP, HANDOFF, baseline). Decisions with lasting impact get an ADR in `docs/architecture/adr/`.

---

*Last updated: 2026-11-01*
*Status: Active*
