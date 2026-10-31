# Design System

Tokens, components, and UI patterns as they exist in `apps/web`. When this document and the code disagree, the code wins: tokens live in `apps/web/src/app/globals.css`, components in `apps/web/src/components/`.

---

## 1. Principles

1. **Dark first, light supported.** Both themes are complete; every colour token has a light value.
2. **Flat and solid.** Solid colours from tokens. No gradients, no decorative blur, no glow effects.
3. **One accent.** Neutral greys carry the layout; the accent marks the primary action, the active item, and focus.
4. **Dense but readable.** Base text is 13px; nothing is smaller than 12px.
5. **Status is never colour alone.** Every status dot or badge has text next to it.
6. **No spinners.** Loading uses skeletons or a status text.

## 2. Tokens

Use tokens through Tailwind arbitrary values, for example `bg-[var(--color-surface)]` or `text-[var(--color-text-2)]`. Do not use raw palette classes such as `text-yellow-400`: they do not follow the theme or the accent.

### 2.1 Colour

The theme is set on `<html data-theme="dark|light">` and the accent on `<html data-accent="...">` (`apps/web/src/components/providers.tsx`).

| Token | Dark | Light | Use |
|---|---|---|---|
| `--color-bg` | hsl(0 0% 6%) | hsl(0 0% 98%) | Page background |
| `--color-bg-subtle` | 8% | 96% | Subtle page areas |
| `--color-surface` | 9% | 100% | Cards, panels |
| `--color-surface-2` | 11% | 97% | Hover, nested surfaces |
| `--color-surface-3` | 14% | 94% | Pressed, third level |
| `--color-border` | 14% | 88% | Dividers, card borders (decorative) |
| `--color-border-subtle` | 11% | 92% | Faint dividers |
| `--color-border-strong` | 20% | 78% | Outline buttons, emphasis |
| `--color-input-border` | 42% | 52% | Inputs, selects, option buttons (3:1, WCAG 1.4.11) |
| `--color-text` | 97% | 9% | Primary text |
| `--color-text-2` | 70% | 32% | Secondary text |
| `--color-text-muted` | 62% | 42% | Tertiary text; passes 4.5:1 |
| `--color-text-disabled` | 30% | 70% | Disabled controls only |
| `--color-on-solid` | 6% | 100% | Text on solid accent or status fills |
| `--color-focus-ring` | accent | accent | Focus outline |
| `--color-overlay` | black 60% | | Dialog backdrop |

Semantic colours, each with a `-muted` variant (15% alpha dark, 12% light) for tinted backgrounds:

| Token | Dark | Light |
|---|---|---|
| `--color-success` | hsl(142 71% 45%) | hsl(142 71% 27%) |
| `--color-warning` | hsl(38 92% 50%) | hsl(32 95% 30%) |
| `--color-danger` | hsl(0 84% 65%) | hsl(0 72% 42%) |
| `--color-info` | hsl(217 91% 65%) | hsl(217 91% 42%) |

Accent tokens: `--color-accent`, `--color-accent-hover`, `--color-accent-muted`, `--color-accent-border`, `--color-accent-text`, `--color-selection`. Five accents, each with a dark and a light value:

| Accent | Dark `--color-accent` | Light `--color-accent` |
|---|---|---|
| violet (default) | hsl(262 83% 72%) | hsl(262 83% 50%) |
| emerald | hsl(160 84% 45%) | hsl(160 84% 25%) |
| cyan | hsl(188 86% 50%) | hsl(188 86% 26%) |
| amber | hsl(38 92% 50%) | hsl(32 95% 28%) |
| rose | hsl(350 89% 64%) | hsl(350 80% 42%) |

Every theme and accent combination is checked by `apps/web/src/app/globals.contrast.test.ts` (text 4.5:1, UI components 3:1). Change a colour only together with that test.

### 2.2 Typography

| Item | Value |
|---|---|
| Sans | Geist (`next/font/google`, variable `--font-sans`) |
| Mono | Geist Mono (`--font-mono`), for code, keys, hosts, URLs |
| Base size | 13px on `html` and `body`, line height 1.5 |
| Minimum | 12px. Nothing smaller |

Sizes in use: 12px for labels, timestamps, and badges; 13px for body and list text; 14px for descriptions; 15px for card and sheet titles; `text-2xl` bold for page titles (`PageHeader`). Base 13px does not follow the browser font-size setting yet (open item, see ROADMAP).

### 2.3 Spacing, radius, shadow

| Token | Value |
|---|---|
| `--spacing-page-pad` | 24px (page padding) |
| `--spacing-section-gap` | 24px |
| `--spacing-widget-pad` | 16px |
| `--widget-gap` | 12px (dashboard grid gap) |
| `--radius-sm` / `-md` / `-lg` / `-xl` / `-full` | 4 / 6 / 8 / 12 / 9999px |
| `--shadow-sm` to `--shadow-xl` | Dark shadows for raised layers; `--shadow-accent` exists but is not used |

### 2.4 Layout and layers

| Token | Value |
|---|---|
| `--sidebar-width` / `--sidebar-collapsed-width` | 240px / 56px |
| `--topbar-height` | 48px |
| `--z-dropdown` to `--z-command` | 100, 200 (sticky), 300 (overlay), 400 (modal), 500 (toast), 600 (tooltip), 700 (command palette) |

Below the `md` breakpoint the sidebar becomes a drawer (`components/layout/mobile-nav.tsx`). The app layout uses `h-dvh`.

### 2.5 Motion

| Token | Value |
|---|---|
| `--duration-fast` / `-normal` / `-slow` | 150 / 200 / 300ms |
| `--ease-default` | cubic-bezier(0.4, 0, 0.2, 1) |
| `--ease-out` | cubic-bezier(0, 0, 0.2, 1) |
| `--ease-spring` | cubic-bezier(0.34, 1.56, 0.64, 1) |

Animate `transform` and `opacity` only. `prefers-reduced-motion` is honoured twice: a CSS rule in `globals.css` for CSS animations, and `<MotionConfig reducedMotion="user">` in providers for the `motion` library. No infinite animations.

## 3. Components

### 3.1 Base components (`components/ui`)

Changes here apply to every page; keep them small.

| Component | Variants and notes |
|---|---|
| `Button` | `default` (accent fill), `destructive`, `outline`, `secondary`, `ghost`, `link`. Sizes `default` (32px), `sm` (28px), `lg` (40px), `icon` (32x32). `asChild` renders a link with button styles. Icon-only buttons need `aria-label` |
| `Badge` | `default`, `secondary`, `destructive`, `outline`, `success`, `warning` |
| `Input`, `Textarea` | Plain controls. Prefer `TextField` in forms |
| `TextField`, `PasswordField` | Label, hint, and error wired with `htmlFor`, `aria-describedby`, `aria-invalid`. `PasswordField` adds a show and hide toggle |
| `Card` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `Tabs` | Radix tabs: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| `Sheet` | Side panel on Radix Dialog: `Sheet`, `SheetContent`, `SheetTitle`, `SheetClose`. Focus trap and Escape included |
| `DropdownMenu` | Radix dropdown |
| `Skeleton` | Placeholder block for loading layouts |

### 3.2 Shared components (`components/shared`)

| Component | Use |
|---|---|
| `PageHeader` | Page title (h1), description, optional actions |
| `LoadingState` | Status text with `role="status"` for page or panel loading |
| `ListSkeleton` | Rows of skeletons with a screen-reader label, for lists |
| `EmptyState` | Icon, title, description, optional action |
| `IntegrationNotice` | Error state for GitHub and Vercel data: message from the error code plus Open Settings or Try again |

### 3.3 Layout (`components/layout`)

`Sidebar` (inside `<nav aria-label>`), `MobileNav` (drawer on Radix Dialog), `Topbar`, `CommandPalette` (cmdk inside Radix Dialog, opened with Ctrl+K or Cmd+K), and `NavLinks` (the single navigation list, with `aria-current="page"`).

## 4. Patterns

| State | Pattern |
|---|---|
| Loading a list | `ListSkeleton` with a label, for example Loading deployments |
| Loading a page or panel | `LoadingState` with specific text, for example Loading vault… |
| Empty | One sentence that says what is missing and, when possible, a button or link to fix it |
| Error from GitHub or Vercel | `IntegrationNotice` |
| Other errors | A sentence plus Try again; announce with `role="status"` |
| Status | Dot or icon with `aria-hidden`, followed by text (Online, 120 ms; SSL expires in 9 days) |
| Destructive action | `destructive` button. Browser `confirm()` is still used for deletes (open accessibility item) |

Copy is plain and functional: Sign in, Create account, Save changes, Try again. Avoid dramatic wording.

## 5. Accessibility rules for UI code

- Every input has a connected label; placeholders are not labels.
- Icon-only controls have `aria-label`; toggles have `aria-pressed` or `aria-expanded`.
- Controls hidden with `opacity-0 group-hover:` also appear on `focus-visible` and `focus-within`.
- Dialogs use Radix Dialog; dialogs opened from state use `useReturnFocus` (`lib/use-return-focus.ts`) to return focus to the opener.
- Touch targets are at least 24x24 px, preferably 32px.
- Layout must hold at 320px width and 200% zoom.

Checks: `apps/web/src/a11y.test.tsx` (axe in jsdom), `globals.contrast.test.ts`, and `apps/web/e2e/public-pages.spec.ts` (axe in Chrome for the public pages).

---

*Last updated: 2026-11-01*
*Status: Active*
