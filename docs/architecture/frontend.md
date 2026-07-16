# Frontend Architecture

This document defines the complete frontend architecture for DevOS.
Every structural decision recorded here is the source of truth for
all frontend development.

Reference: [Principles](../vision/03-principles.md) | [Module Breakdown](../product/module-breakdown.md)

---

## Technology Stack

| Concern        | Technology                  | Reason                                     |
| -------------- | --------------------------- | ------------------------------------------ |
| Framework      | Next.js 15 (App Router)     | File-based routing, RSC, strong ecosystem  |
| Language       | TypeScript (strict mode)    | Type safety, refactoring confidence        |
| Styling        | Tailwind CSS v4 + shadcn/ui | Utility-first, accessible components       |
| State (server) | TanStack Query v5           | Server state, caching, background sync     |
| State (client) | Zustand                     | Minimal, ergonomic global state            |
| Forms          | React Hook Form + Zod       | Performant forms, schema validation        |
| Animation      | Motion (Framer Motion v11)  | Micro-animations, layout transitions       |
| Icons          | Lucide React                | Consistent, tree-shakeable icon set        |
| Charts         | Recharts                    | Composable, React-native charts            |
| Table          | TanStack Table              | Headless, flexible data tables             |
| Terminal       | xterm.js                    | Full-featured embedded terminal            |
| Editor         | CodeMirror 6                | Lightweight code editor for snippets/notes |
| Date           | date-fns                    | Lightweight, tree-shakeable date utility   |

---

## Folder Structure

```
src/
│
├── app/                          ← Next.js App Router
│   ├── (auth)/                   ← Auth group (no sidebar)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (app)/                    ← Main app group (with sidebar)
│   │   ├── layout.tsx            ← App shell: sidebar + topbar
│   │   ├── page.tsx              ← Dashboard (/)
│   │   ├── projects/
│   │   ├── workspace/
│   │   │   ├── todo/
│   │   │   ├── kanban/
│   │   │   ├── calendar/
│   │   │   ├── notes/
│   │   │   ├── whiteboard/
│   │   │   ├── scratchpad/
│   │   │   └── bookmarks/
│   │   ├── knowledge/
│   │   │   ├── library/
│   │   │   ├── snippets/
│   │   │   ├── learning/
│   │   │   └── reading-list/
│   │   ├── developer/
│   │   │   ├── github/
│   │   │   ├── repositories/
│   │   │   ├── api/
│   │   │   ├── docker/
│   │   │   ├── terminal/
│   │   │   ├── ssh/
│   │   │   └── logs/
│   │   ├── infrastructure/
│   │   ├── security/
│   │   ├── monitoring/
│   │   ├── ai/
│   │   ├── analytics/
│   │   ├── automation/
│   │   └── settings/
│   │
│   ├── api/                      ← Next.js API routes (BFF layer)
│   │   └── [...trpc]/
│   │       └── route.ts
│   │
│   ├── globals.css
│   └── layout.tsx                ← Root layout (font, providers)
│
├── components/                   ← Reusable UI components
│   ├── ui/                       ← shadcn/ui base components (do not edit)
│   ├── layout/                   ← Structural components
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── CommandPalette.tsx
│   │   └── AppShell.tsx
│   ├── dashboard/                ← Dashboard-specific components
│   │   ├── WidgetGrid.tsx
│   │   ├── Widget.tsx
│   │   └── widgets/
│   │       ├── TasksWidget.tsx
│   │       ├── GitHubWidget.tsx
│   │       ├── PomodoroWidget.tsx
│   │       └── ...
│   └── shared/                   ← Cross-module shared components
│       ├── PageHeader.tsx
│       ├── EmptyState.tsx
│       ├── LoadingState.tsx
│       ├── ErrorBoundary.tsx
│       └── SkeletonCard.tsx
│
├── features/                     ← Feature modules (business logic)
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── store.ts
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   ├── workspace/
│   ├── knowledge/
│   ├── developer/
│   ├── infrastructure/
│   ├── security/
│   ├── monitoring/
│   ├── ai/
│   └── settings/
│
├── hooks/                        ← Global shared hooks
│   ├── useCommandPalette.ts
│   ├── useKeyboardShortcut.ts
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   └── useMediaQuery.ts
│
├── lib/                          ← Utilities and configurations
│   ├── api/                      ← API client and helpers
│   │   ├── client.ts
│   │   └── endpoints.ts
│   ├── auth.ts                   ← Better Auth client config
│   ├── query-client.ts           ← TanStack Query config
│   ├── utils.ts                  ← General utilities (cn, etc.)
│   ├── constants.ts              ← App-wide constants
│   └── validators/               ← Zod schemas shared across features
│
├── stores/                       ← Zustand global stores
│   ├── ui.store.ts               ← Sidebar open/close, theme, etc.
│   ├── widget.store.ts           ← Dashboard widget config
│   └── command.store.ts          ← Command palette state
│
├── types/                        ← Global TypeScript types
│   ├── api.types.ts
│   ├── auth.types.ts
│   └── common.types.ts
│
└── styles/                       ← Global styles
    ├── fonts.css
    └── themes/
        ├── dark.css
        └── light.css
```

---

## Component Architecture

### Hierarchy

```
App Shell (layout)
│
├── Sidebar
│   └── NavItem[]
│
├── Topbar
│   ├── Breadcrumb
│   ├── CommandPaletteButton
│   └── UserMenu
│
└── Page Content
    └── [Feature Components]
```

### Component Layers

| Layer                   | Location                        | Rule                                           |
| ----------------------- | ------------------------------- | ---------------------------------------------- |
| **UI primitives** | `components/ui/`              | shadcn generated — do not modify directly     |
| **Layout**        | `components/layout/`          | Structural, no business logic                  |
| **Shared**        | `components/shared/`          | Used by 2+ features, no feature-specific logic |
| **Feature**       | `features/[name]/components/` | Belongs to one feature only                    |
| **Page**          | `app/(app)/[route]/page.tsx`  | Composes feature components, handles routing   |

### Rules

- Components are **function components only** — no class components
- Props are always typed with explicit interfaces
- Components do **not** fetch data directly — use hooks
- No inline styles — Tailwind classes or CSS variables only
- Maximum component file length: **200 lines** — split if longer

---

## State Management

### When to Use What

| Type of State   | Tool            | Example                            |
| --------------- | --------------- | ---------------------------------- |
| Server data     | TanStack Query  | GitHub activity, Docker containers |
| Global UI       | Zustand         | Sidebar open, active theme         |
| URL state       | `nuqs`        | Filters, pagination, active tab    |
| Form state      | React Hook Form | All form inputs                    |
| Local component | `useState`    | Dropdown open, hover state         |

### TanStack Query Conventions

```typescript
// Query keys are always defined in a keys factory
export const githubKeys = {
  all: ['github'] as const,
  activity: () => [...githubKeys.all, 'activity'] as const,
  repos: () => [...githubKeys.all, 'repos'] as const,
  repo: (name: string) => [...githubKeys.repos(), name] as const,
}

// Queries are always wrapped in a custom hook
export function useGitHubActivity() {
  return useQuery({
    queryKey: githubKeys.activity(),
    queryFn: fetchGitHubActivity,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

### Zustand Store Structure

```typescript
// stores/ui.store.ts
interface UIState {
  sidebarOpen: boolean
  theme: 'dark' | 'light' | 'system'
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: UIState['theme']) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'dark',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'devos-ui' }
  )
)
```

---

## Data Fetching Strategy

### Server Components (default)

Use RSC for data that doesn't need real-time updates and can be
fetched on the server.

```typescript
// app/(app)/developer/github/page.tsx
export default async function GitHubPage() {
  const activity = await fetchGitHubActivity() // server fetch
  return <GitHubDashboard initialData={activity} />
}
```

### Client Components (opt-in)

Use `'use client'` only when:

- Needing browser APIs (localStorage, DOM)
- Using hooks (useState, useEffect, TanStack Query)
- Needing event listeners

### Real-time Data

- WebSocket for monitoring metrics and log tailing
- Server-Sent Events (SSE) for notifications
- TanStack Query polling for semi-real-time data (deploy status, container health)

---

## Performance Requirements

| Metric                    | Target  |
| ------------------------- | ------- |
| First Contentful Paint    | < 1.0s  |
| Largest Contentful Paint  | < 2.5s  |
| Time to Interactive       | < 3.0s  |
| Cumulative Layout Shift   | < 0.1   |
| Interaction to Next Paint | < 200ms |

### Techniques

- **Code splitting**: Every route is automatically split by Next.js
- **Lazy loading**: Heavy components (Terminal, Whiteboard, Charts) use `dynamic()`
- **Images**: Next.js `<Image>` component always — never `<img>`
- **Fonts**: `next/font` with `display: swap` — always preloaded
- **Skeletons**: Every data-fetching component has a skeleton fallback
- **Optimistic UI**: Mutations update UI before server confirms

---

## Error Handling

```
Page Load Error → ErrorBoundary → Error UI with retry button
API Error → TanStack Query error state → Inline error component
Form Error → React Hook Form field-level error → Inline message
Network Error → Global toast notification
Auth Error → Redirect to /login
```

Every async boundary must have:

1. A loading state (skeleton or spinner)
2. An error state with actionable message
3. An empty state when data returns zero results

---

## Routing Conventions

| Pattern                            | Example                     | Purpose      |
| ---------------------------------- | --------------------------- | ------------ |
| `/`                              | Dashboard                   |              |
| `/(app)/[module]`                | `/workspace`              | Module index |
| `/(app)/[module]/[feature]`      | `/workspace/notes`        | Feature page |
| `/(app)/[module]/[feature]/[id]` | `/workspace/notes/abc123` | Detail page  |
| `/(auth)/login`                  | Login page                  |              |

- **No** dynamic routes with `[...slug]` unless absolutely necessary
- Route params are always validated with Zod before use
- `notFound()` is called explicitly when an entity doesn't exist

---

## Keyboard Shortcuts

| Shortcut               | Action                |
| ---------------------- | --------------------- |
| `Cmd+K` / `Ctrl+K` | Open command palette  |
| `Cmd+B` / `Ctrl+B` | Toggle sidebar        |
| `Cmd+/` / `Ctrl+/` | Focus search          |
| `G` then `D`       | Go to Dashboard       |
| `G` then `P`       | Go to Projects        |
| `G` then `W`       | Go to Workspace       |
| `Esc`                | Close modal / palette |

All shortcuts are documented in Settings > Keyboard Shortcuts.

---

## Accessibility Requirements

- All interactive elements must have descriptive `aria-label`
- Color is never the only indicator of state
- Focus ring is always visible (not `outline: none`)
- All images have `alt` text
- Modal focus trapping is required
- Target: WCAG 2.1 Level AA

---

*Last updated: 2026-07-17*
*Status: Foundation*
