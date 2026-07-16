# Engineering Standards

This document defines the engineering standards for DevOS development.
Every developer (including AI agents) must follow these standards.
Deviations require explicit justification in the relevant PR or ADR.

Reference: [Principles](../vision/03-principles.md) | [Frontend Architecture](../architecture/frontend.md)

---

## Git Conventions

### Branch Strategy

```
main          ← Production-ready code only. Never commit directly.
│
├── dev       ← Integration branch. All features merge here first.
│
├── feat/[name]     ← New features
├── fix/[name]      ← Bug fixes
├── chore/[name]    ← Config, tooling, dependencies
├── docs/[name]     ← Documentation only
├── refactor/[name] ← Code restructuring, no behavior change
├── perf/[name]     ← Performance improvements
└── hotfix/[name]   ← Emergency fixes directly from main
```

**Rules:**
- Branch names are lowercase, words separated by hyphens
- Maximum branch lifetime: 7 days — keep PRs small
- Delete branches immediately after merge
- Never force push to `main` or `dev`

---

### Commit Convention

Format: **Conventional Commits** (https://www.conventionalcommits.org)

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:**

| Type | When to Use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Build process, tooling, no production code change |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `style` | Formatting only (whitespace, semicolons) |
| `ci` | CI/CD configuration |
| `revert` | Reverting a previous commit |

**Scopes:** Match the module name.

```
feat(dashboard): add pomodoro widget
fix(knowledge): resolve snippet search returning stale results
feat(developer): add Docker container status card
chore(deps): upgrade TanStack Query to v5.80
docs(architecture): add backend architecture document
refactor(workspace): extract todo item into standalone component
test(ai): add unit tests for prompt library CRUD
```

**Rules:**
- Description is lowercase, no period at end
- Max 72 characters in the first line
- Body explains the **why**, not the **what**
- Breaking changes get `!` suffix: `feat(auth)!: switch to passkey`

---

## Naming Conventions

### Files and Folders

| Type | Convention | Example |
|------|-----------|---------|
| React component | PascalCase | `TaskWidget.tsx` |
| Hook | camelCase with `use` prefix | `useGitHubActivity.ts` |
| Utility | camelCase | `formatDate.ts` |
| Store | camelCase with `.store.ts` | `ui.store.ts` |
| Type file | camelCase with `.types.ts` | `api.types.ts` |
| Test file | same as target with `.test.ts` | `formatDate.test.ts` |
| Folder | kebab-case | `reading-list/` |
| Route segment | kebab-case | `ssh-connections/` |
| Config file | kebab-case | `next.config.ts` |

### TypeScript

```typescript
// ✅ Types and Interfaces — PascalCase
interface GitHubActivity { ... }
type WidgetSize = 'small' | 'medium' | 'large'

// ✅ Variables — camelCase
const activityData = []
const isLoading = true

// ✅ Constants — SCREAMING_SNAKE_CASE
const MAX_WIDGETS = 12
const DEFAULT_THEME = 'dark'

// ✅ Enums — PascalCase enum, PascalCase values
enum WidgetType {
  Tasks = 'tasks',
  GitHub = 'github',
  Pomodoro = 'pomodoro',
}

// ✅ Functions — camelCase, verb + noun
function fetchGitHubActivity() { ... }
function formatDateRelative() { ... }

// ✅ React components — PascalCase
function TasksWidget({ ... }: TasksWidgetProps) { ... }

// ✅ Props interfaces — ComponentNameProps
interface TasksWidgetProps {
  maxItems?: number
  onTaskComplete: (id: string) => void
}
```

### CSS / Tailwind

```tsx
// ✅ Use `cn()` utility for conditional classes
import { cn } from '@/lib/utils'

<div className={cn(
  'flex items-center gap-2',
  isActive && 'bg-accent',
  disabled && 'opacity-50 cursor-not-allowed'
)} />

// ❌ Never inline styles
<div style={{ display: 'flex' }} />

// ❌ Never arbitrary Tailwind values unless absolutely needed
<div className="w-[347px]" />
```

---

## Code Standards

### TypeScript Rules

```typescript
// ✅ Always explicit return types for public functions
export function formatDate(date: Date): string { ... }

// ✅ Use `type` for unions/primitives, `interface` for object shapes
type Status = 'active' | 'inactive'
interface Widget { id: string; type: WidgetType }

// ✅ Prefer optional chaining and nullish coalescing
const name = user?.profile?.name ?? 'Anonymous'

// ✅ Use `satisfies` for object literals with known shape
const config = {
  theme: 'dark',
  sidebar: true,
} satisfies Partial<UIConfig>

// ❌ No `any` — use `unknown` if type is truly unknown
// ❌ No non-null assertions (`!`) — handle null explicitly
// ❌ No `@ts-ignore` — fix the type error or use `@ts-expect-error` with explanation
```

### React Rules

```tsx
// ✅ Server Component by default — add 'use client' only when needed
// ✅ Prefer named exports for components
export function TasksWidget() { ... }

// ✅ Prop destructuring with defaults
function Widget({ size = 'medium', title }: WidgetProps) { ... }

// ✅ Early returns for conditional rendering
function UserMenu({ user }: { user: User | null }) {
  if (!user) return null
  return <menu>...</menu>
}

// ❌ No prop drilling beyond 2 levels — use context or store
// ❌ No useEffect for data fetching — use TanStack Query
// ❌ No direct DOM manipulation — use refs or libraries
```

### API / Data Fetching Rules

```typescript
// ✅ All API calls go through the API client, not fetch directly
import { api } from '@/lib/api/client'
const data = await api.get('/github/activity')

// ✅ All query keys defined in a keys factory file
// ✅ Error handling is never swallowed silently

// ❌ No direct fetch() in components
// ❌ No API calls in Server Actions that bypass validation
// ❌ No mutation without optimistic update for user-facing actions
```

---

## Folder Rules

```
components/ui/           ← Only shadcn-generated files. Do not manually edit.
components/layout/       ← Max 5 files. Structural only.
features/[name]/         ← All code for one feature lives here.
lib/                     ← No React components. Pure utilities.
types/                   ← No implementation logic. Types only.
stores/                  ← No async operations. Pure state.
```

**Rules:**
- A feature folder must be self-contained — it should not import from
  another feature folder directly. Use shared components or a shared
  service in `lib/` instead.
- `lib/` contains no React components.
- `hooks/` at the root level is for hooks used by 2+ features only.

---

## Testing Standards

### Required Test Coverage

| Layer | Tool | Coverage Target |
|-------|------|----------------|
| Utilities | Vitest | 90% |
| Hooks | Vitest + React Testing Library | 80% |
| Components | React Testing Library | 70% |
| API routes | Vitest + Supertest | 80% |
| E2E critical paths | Playwright | All happy paths |

### What to Test

```
✅ Utility functions (pure functions — 100% coverage)
✅ Custom hooks (behavior, not implementation)
✅ Components with complex conditional rendering
✅ Form validation schemas (Zod)
✅ API route handlers
✅ Auth flows (E2E)
✅ Critical user paths (E2E): login, create task, view dashboard

❌ shadcn/ui component internals
❌ Simple pass-through components
❌ Type definitions
```

### Test File Convention

```typescript
// File: useGitHubActivity.test.ts
describe('useGitHubActivity', () => {
  it('returns loading state initially', () => { ... })
  it('returns activity data on success', () => { ... })
  it('returns error state on API failure', () => { ... })
})
```

---

## Code Review Standards

### Before Submitting a PR

- [ ] TypeScript compiles with zero errors
- [ ] All tests pass (`pnpm test`)
- [ ] No console.log left in production code
- [ ] New components have proper TypeScript props
- [ ] New API endpoints have validation
- [ ] New secrets are not committed (check with `git-secrets`)
- [ ] PR title follows commit convention format
- [ ] PR description explains the **why**, not just the **what**

### PR Size

- **Preferred**: < 400 lines changed
- **Acceptable**: 400–800 lines (requires detailed description)
- **Requires split**: > 800 lines

---

## Security Standards

- **No secrets in code** — all secrets go through environment variables
- **All environment variables are validated at startup** using Zod
- **All user inputs are validated** server-side — never trust the client
- **SQL queries use parameterized statements** — no string concatenation
- **Authentication is checked on every protected route** — server-side
- **Rate limiting is applied** to all public API endpoints
- **Content Security Policy** is set on all responses

```typescript
// ✅ Environment variable validation at startup
const env = z.object({
  DATABASE_URL: z.string().url(),
  GITHUB_TOKEN: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
}).parse(process.env)

// ❌ Never access process.env directly in components
```

---

## Documentation Standards

- **Every public function** has a JSDoc comment explaining purpose and params
- **Every module** has a `README.md` in its folder
- **Every architectural decision** has an ADR in `docs/architecture/adr/`
- **Complex logic** has inline comments explaining the **why**

```typescript
/**
 * Formats a GitHub commit timestamp into a relative time string.
 * Uses the user's local timezone for display.
 *
 * @param date - The commit date from the GitHub API (ISO 8601)
 * @returns A human-readable relative time (e.g., "3 hours ago")
 */
export function formatCommitDate(date: string): string { ... }
```

---

*Last updated: 2026-07-17*
*Status: Foundation*
