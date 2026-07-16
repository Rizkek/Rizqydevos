# Design System — Quick Reference

A single-page reference card for all design decisions.
Use this when coding components or reviewing designs.

---

## Colors

| Token | Dark Value | Hex | Usage |
|-------|-----------|-----|-------|
| `--color-bg` | `hsl(0,0%,6%)` | `#0f0f0f` | App background |
| `--color-bg-subtle` | `hsl(0,0%,8%)` | `#141414` | Subtle variation |
| `--color-surface` | `hsl(0,0%,9%)` | `#171717` | Cards, panels |
| `--color-surface-2` | `hsl(0,0%,11%)` | `#1c1c1c` | Inputs, elevated |
| `--color-surface-3` | `hsl(0,0%,14%)` | `#242424` | Skeleton, hover |
| `--color-border` | `hsl(0,0%,14%)` | `#242424` | Default borders |
| `--color-border-strong` | `hsl(0,0%,20%)` | `#333333` | Emphasized |
| `--color-text` | `hsl(0,0%,97%)` | `#f7f7f7` | Primary text |
| `--color-text-2` | `hsl(0,0%,70%)` | `#b3b3b3` | Secondary text |
| `--color-text-muted` | `hsl(0,0%,45%)` | `#737373` | Muted / placeholder |
| `--color-text-disabled` | `hsl(0,0%,30%)` | `#4d4d4d` | Disabled |
| `--color-accent` | `hsl(262,83%,68%)` | `#8b5cf6` | **Violet accent** |
| `--color-accent-hover` | `hsl(262,83%,60%)` | `#7c3aed` | Accent hover |
| `--color-success` | `hsl(142,71%,45%)` | `#22c55e` | ✓ Success |
| `--color-warning` | `hsl(38,92%,50%)` | `#f59e0b` | ⚠ Warning |
| `--color-danger` | `hsl(0,84%,60%)` | `#ef4444` | ✕ Error |
| `--color-info` | `hsl(217,91%,60%)` | `#3b82f6` | ℹ Info |

---

## Typography

| Context | Size | Weight | Font |
|---------|------|--------|------|
| Widget title label | 11px | 600 | Geist, uppercase |
| Timestamps / meta | 11px | 400 | Geist Mono |
| Secondary text | 12px | 400 | Geist |
| **Body (default)** | **13px** | **400** | **Geist** |
| Nav items | 13px | 500 | Geist |
| Button labels | 13px | 500 | Geist |
| Card titles | 14px | 600 | Geist |
| Section headers | 16px | 600 | Geist |
| Page titles | 22px | 700 | Geist |
| Metrics / counts | 28–36px | 700 | Geist |
| Code / snippets | 12–13px | 400 | Geist Mono |
| Keyboard shortcuts | 11px | 500 | Geist Mono |

---

## Spacing

```
4px  → space-1   (tight gap, icon spacing)
8px  → space-2   (element padding)
12px → space-3   (sidebar item padding, input x-padding)
16px → space-4   (widget padding, button x-padding)
24px → space-6   (section gap, page padding)
32px → space-8   (large gaps)
48px → space-12  (section separators)
```

---

## Border Radius

```
4px    → radius-sm   (inputs, small buttons, kbd)
6px    → radius-md   (cards, panels, standard buttons) ← default
8px    → radius-lg   (modals, dropdowns, large cards)
12px   → radius-xl   (command palette, large sheets)
9999px → radius-full (pills, badges, avatars, dots)
```

---

## Shadows

```
shadow-sm  → 0 1px 2px black/40%                   (subtle raise)
shadow-md  → 0 4px 8px black/40%                   (card hover)
shadow-lg  → 0 8px 24px black/50%                  (dropdown, popover)
shadow-xl  → 0 16px 40px black/60%                 (modal, command palette)
shadow-accent → 0 0 20px violet/25%                (accent glow)
```

---

## Animation

```
75ms  / instant  → Hover colors, focus rings
150ms / fast     → Button press, icon swap
200ms / normal   → Dropdown, tooltip, modal fade
300ms / slow     → Sidebar slide, sheet open
400ms / slower   → Page entry (max — never exceed)

Easing:
  ease-default → cubic-bezier(0.4, 0, 0.2, 1)   ← use for most things
  ease-out     → cubic-bezier(0, 0, 0.2, 1)      ← entering elements
  ease-in      → cubic-bezier(0.4, 0, 1, 1)      ← exiting elements
  ease-spring  → cubic-bezier(0.34, 1.56, 0.64, 1) ← playful (use sparingly)
```

---

## Layout

```
Sidebar width:          240px (expanded) / 56px (collapsed)
Topbar height:          48px
Widget gap:             12px
Widget row height:      80px (base)
Content max-width:      1400px
Page padding:           24px
Widget padding:         16px
```

---

## Z-Index

```
0    → base
10   → raised (cards)
100  → dropdown, popover
200  → sticky header
300  → overlay/backdrop
400  → modal
500  → toast
600  → tooltip
700  → command palette (always on top)
```

---

## Component Sizes at a Glance

| Component | Height | Radius |
|-----------|--------|--------|
| Button sm | 28px | 4px |
| Button md | 32px | 6px |
| Button lg | 36px | 6px |
| Input | 32px | 6px |
| Nav item | 32px | 6px |
| Badge | 20px | 9999px |
| Status dot | 8–10px | 9999px |

---

## Tailwind Class Mapping

When in doubt, use these Tailwind classes that map to tokens:

```
text-[var(--color-text)]           → primary text
text-[var(--color-text-2)]         → secondary text
text-[var(--color-text-muted)]     → muted text

bg-[var(--color-surface)]          → card/panel
bg-[var(--color-surface-2)]        → input/elevated

border-[var(--color-border)]       → default border
rounded-[var(--radius-md)]         → cards, buttons

text-[11px]                        → widget label
text-[12px]                        → secondary
text-[13px]                        → body (default)

font-medium                        → nav, button labels
font-semibold                      → card titles
font-bold                          → page titles
font-mono                          → code, timestamps
```

---

*Last updated: 2026-07-17*
*Status: Foundation*
