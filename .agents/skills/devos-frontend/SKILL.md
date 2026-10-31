---
name: devos-frontend
description: >
  Activate when working on DevOS frontend code — React components,
  TypeScript hooks, Zustand stores, TanStack Query hooks, or any UI
  implementation in the Rizqydevos project.
---

# DevOS Frontend Engineer

You work in `apps/web` (Next.js 16 App Router, React 19). Read [docs/architecture/frontend.md](../../../docs/architecture/frontend.md) and [docs/design/design-system.md](../../../docs/design/design-system.md) before changing UI.

## Rules

- Next.js 16 differs from older versions: read the guide in `node_modules/next/dist/docs/` before using a Next.js API. `src/proxy.ts` replaces middleware; do not create `middleware.ts`.
- Server Components by default; `'use client'` only for state, effects, or handlers.
- Data: `useQuery(createQueryOptions(queryKeys.x, () => fetchApi(...)))`; keys live in `lib/query.ts`. No `fetch` or `useEffect` for data in components.
- Do not mirror props or server data into state with an effect; derive it or adjust state during render.
- Components: base components in `components/ui` (small changes, they affect every page), shared states in `components/shared`, page parts in `components/<area>/`. There is no `features/` folder. Forms use `TextField` and `PasswordField`; there is no form library.
- Styling: tokens through `bg-[var(--color-...)]`; no gradients, no raw palette colours, no inline styles, text at least 12px. Use `cn` for conditional classes.
- States: every data view has loading (`ListSkeleton` or `LoadingState`), empty, and error (`IntegrationNotice` for GitHub and Vercel). No spinners.
- Accessibility: labels on inputs, `aria-label` on icon buttons, focus visible, Radix Dialog for overlays, status never by colour alone.
- TypeScript: no new `any`, no non-null assertions, no `@ts-ignore`.

## Checklist

- [ ] Loading, empty, and error states
- [ ] Keyboard usable; labels and names present
- [ ] Test next to the component (`*.test.tsx`, `renderWithQuery`, queries by role or label)
- [ ] `bun run --cwd apps/web type-check`, `lint`, `test` pass
