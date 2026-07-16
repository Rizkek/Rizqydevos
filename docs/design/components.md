# Component Design Decisions

This document covers design decisions for core UI components in DevOS.
These are not implementation specs (see component code) — they define
the visual behavior, states, and rules each component must follow.

Reference: [Tokens](./tokens.md) | [Color](./color.md) | [Motion](./motion.md)

---

## App Shell

### Sidebar

```
Width (expanded):  240px
Width (collapsed): 56px (icon only)
Background:        color-surface
Border-right:      1px solid color-border
Transition:        width 300ms ease-default
```

**Structure:**

```
Sidebar
├── Logo / Brand (top, 48px height)
├── Nav Section (scrollable)
│   └── NavItem (icon + label)
│       ├── Default: icon color-text-2, label color-text-2
│       ├── Hover: bg hsl(255,255,255,5%) overlay
│       └── Active: bg color-accent-muted, text color-accent-text
├── Spacer (flex-grow)
└── User / Settings (bottom)
```

**NavItem:**

- Height: 32px
- Padding: 8px 12px
- Border-radius: 6px (radius-md)
- Icon size: 16px
- Gap (icon → label): 8px
- Font: 13px, weight 500

---

### Topbar

```
Height:     48px
Background: color-bg (blends with page)
Border-bottom: 1px solid color-border
Padding:    0 24px
```

**Contents:**

```
[Breadcrumb]            [Cmd+K Button]   [Notifications]  [Avatar]
```

**Cmd+K Button:**

- Styled as a subtle input-like element
- Shows: "Search or jump to..." placeholder
- Shows kbd shortcut: `⌘K` or `Ctrl K`
- Width: 220px
- Background: color-surface-2
- Border: color-border

---

### Command Palette

```
Overlay backdrop:    color-overlay (60% black)
Panel width:         580px
Panel max-height:    400px
Panel position:      fixed, 20% from top, centered
Border-radius:       radius-xl (12px)
Background:          color-surface-2
Border:              1px solid color-border-strong
Shadow:              shadow-xl
```

**Sections:**

- Recent items
- Navigation (jump to section)
- Actions (create todo, new note, etc.)
- Settings shortcuts

---

## Widget

Widgets are the core unit of the dashboard.

```
Background:    color-surface
Border:        1px solid color-border
Border-radius: radius-lg (8px)
Padding:       16px
```

**Widget sizes on a 12-column grid:**

```
Small:  4 columns × 2 rows   (~280px × 160px)
Medium: 6 columns × 3 rows   (~420px × 240px)
Large:  12 columns × 4 rows  (~full width × 320px)
```

**Widget anatomy:**

```
┌─────────────────────────────────┐
│ WIDGET TITLE            [•••]   │  ← Header (label-style, all-caps, muted)
├─────────────────────────────────┤
│                                 │
│    Content area                 │  ← Varies per widget
│                                 │
└─────────────────────────────────┘
```

**Widget title:**

- Font: 11px (text-xs)
- Weight: 600 (semibold)
- Color: color-text-muted
- Letter-spacing: wider
- Transform: uppercase

**Widget hover state:**

- Border color shifts to `color-border-strong`
- Transition: 150ms

---

## Button

Three variants, three sizes.

### Variants

**Primary:**

```
Background: color-accent
Text:       white
Hover bg:   color-accent-hover
Active:     scale(0.97)
```

**Secondary / Ghost:**

```
Background: transparent
Text:       color-text-2
Border:     1px solid color-border
Hover bg:   color-surface-2
Hover text: color-text
```

**Danger:**

```
Background: transparent
Text:       color-danger
Border:     1px solid color-danger (on hover)
Hover bg:   color-danger-muted
```

### Sizes

| Size   | Height | Padding   | Font     | Border-radius   |
| ------ | ------ | --------- | -------- | --------------- |
| `sm` | 28px   | 8px 12px  | 12px/500 | radius-sm (4px) |
| `md` | 32px   | 8px 16px  | 13px/500 | radius-md (6px) |
| `lg` | 36px   | 10px 20px | 14px/500 | radius-md (6px) |

### States

```
Default:   normal
Hover:     background lightened / darkened
Active:    transform scale(0.97) — 75ms
Focus:     outline 2px color-focus-ring, offset 2px
Disabled:  opacity 0.4, cursor not-allowed (never color-change)
Loading:   spinner replaces label, disabled state
```

---

## Input / Textarea

```
Height (single-line): 32px
Background:  color-surface-2
Border:      1px solid color-border
Border-radius: radius-md (6px)
Padding:     8px 12px
Font:        13px, weight 400
Color:       color-text
Placeholder: color-text-muted
```

**States:**

```
Default:  border color-border
Hover:    border color-border-strong
Focus:    border color-accent + outline 2px color-focus-ring
Error:    border color-danger
Disabled: opacity 0.5, cursor not-allowed
```

---

## Badge / Chip

Small labels for status, tags, languages, etc.

```
Height:        20px
Padding:       2px 8px
Font:          11px (text-xs), weight 500
Border-radius: radius-full (9999px)
```

**Semantic variants:**

```
success:  bg color-success-muted,  text color-success
warning:  bg color-warning-muted,  text color-warning
danger:   bg color-danger-muted,   text color-danger
info:     bg color-info-muted,     text color-info
default:  bg color-surface-3,      text color-text-2
accent:   bg color-accent-muted,   text color-accent-text
```

---

## Card

General-purpose container for content sections.

```
Background:    color-surface
Border:        1px solid color-border
Border-radius: radius-lg (8px)
Padding:       16px (default) | 12px (compact) | 24px (spacious)
```

**Interactive card (clickable):**

```
Hover: border-color → color-border-strong, bg → color-surface-2
Transition: 150ms
Cursor: pointer
```

---

## Navigation Item States

| State    | Background           | Text                | Icon                |
| -------- | -------------------- | ------------------- | ------------------- |
| Default  | transparent          | color-text-2        | color-text-2        |
| Hover    | hsl(255,255,255, 5%) | color-text          | color-text          |
| Active   | color-accent-muted   | color-accent-text   | color-accent        |
| Disabled | transparent          | color-text-disabled | color-text-disabled |

---

## Status Dot

Used in service health indicators, container status, deploy status.

```
Size:    8px diameter (small) | 10px (medium)
Shape:   circle (border-radius: full)
```

| Status             | Color               | Animation    |
| ------------------ | ------------------- | ------------ |
| Online / Success   | color-success       | Pulse (slow) |
| Degraded / Warning | color-warning       | None         |
| Offline / Error    | color-danger        | None         |
| Checking / Loading | color-text-muted    | Pulse (fast) |
| Unknown            | color-text-disabled | None         |

---

## Empty State

Shown when a module or widget has no data.

```
Layout:   centered vertically and horizontally
Icon:     40px, color-text-disabled
Title:    text-md (14px), weight 500, color-text-2
Body:     text-sm (12px), color-text-muted, max-width 280px
CTA:      secondary button (optional)
```

---

## Skeleton / Loading State

Every data-fetching component must have a skeleton.

```
Shape:    matches the final content shape
Color:    color-surface-3
Animation: pulse (1.5s ease-in-out infinite)
Border-radius: matches the target element
```

**Rules:**

- Skeletons are shown for the first load only (< 200ms → no skeleton)
- After data is cached, show stale data + subtle refresh indicator
- Never show a spinner for < 200ms operations

---

## Toast / Notification

```
Position:     bottom-right, fixed
Width:        320px
Padding:      12px 16px
Border-radius: radius-lg (8px)
Background:   color-surface-2
Border:       1px solid color-border
Shadow:       shadow-lg
```

**Variants:**

```
Default:  icon color-text-2
Success:  icon color-success, subtle success-muted bg
Warning:  icon color-warning
Error:    icon color-danger
```

**Behavior:**

- Auto-dismiss after 4 seconds (error: 6 seconds)
- Manual dismiss with × button
- Stack vertically (newest on top)
- Max 4 visible at once

---

## Scrollbar

Custom scrollbar for all scrollable areas.

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--color-border-strong);
  border-radius: var(--radius-full);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-disabled);
}
```

---

## Focus Visible

All interactive elements must have a visible focus ring.
Never `outline: none` without providing an alternative.

```css
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

---

*Last updated: 2026-07-17*
*Status: Foundation*
