# Typography

Font system, type scale, and typographic rules for DevOS.

Reference: [Tokens](./tokens.md)

---

## Font Families

### Primary — Geist

**Usage:** All UI text — labels, body, headings, navigation, buttons.

Geist is designed by Vercel for developer tools. It is:
- Optimized for UI at small sizes (11–16px)
- Legible at low contrast
- Modern, neutral, and opinionated without being flashy

```css
font-family: 'Geist', system-ui, -apple-system, sans-serif;
```

**Fallback chain:** If Geist fails to load, `system-ui` (SF Pro on macOS,
Segoe UI on Windows) keeps the UI legible with minimal layout shift.

---

### Monospace — Geist Mono

**Usage:** Code snippets, terminal output, file paths, commit hashes,
timestamps in logs, JSON values, keyboard shortcuts.

```css
font-family: 'Geist Mono', 'Fira Code', 'Cascadia Code', monospace;
```

Geist Mono has ligatures enabled by default. Do not disable.

---

### Loading via next/font

```typescript
// src/app/layout.tsx
import { Geist, Geist_Mono } from 'next/font/google'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})
```

---

## Type Scale

DevOS uses a **dense type scale** — slightly smaller than typical web
applications. Developers are comfortable with information density.

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-xs` | 11px | 400–500 | 1.25 | Timestamps, badges, meta labels |
| `text-sm` | 12px | 400–500 | 1.375 | Secondary text, captions, kbd |
| `text-base` | 13px | 400 | 1.5 | Body text (default) |
| `text-md` | 14px | 400–500 | 1.5 | Slightly larger body |
| `text-lg` | 16px | 500–600 | 1.375 | Section headers, nav items |
| `text-xl` | 18px | 600 | 1.25 | Card titles, dialog titles |
| `text-2xl` | 22px | 600–700 | 1.25 | Page titles |
| `text-3xl` | 28px | 700 | 1.2 | Dashboard headings |
| `text-4xl` | 36px | 700 | 1.1 | Display size (rarely used) |

---

## Font Weight Usage

| Weight | Value | When to Use |
|--------|-------|-------------|
| Regular | 400 | Body text, descriptions, secondary labels |
| Medium | 500 | Nav items, button labels, field labels |
| Semibold | 600 | Card titles, section titles, strong labels |
| Bold | 700 | Page titles, major headings only |

**Rule:** Never use weight alone to create hierarchy — pair it with
size and color changes. Weight is the last resort for emphasis.

---

## Typographic Hierarchy in Practice

### Navigation Item (inactive)
```
Size: 13px (text-base)
Weight: 500 (medium)
Color: color-text-2
```

### Navigation Item (active)
```
Size: 13px (text-base)
Weight: 500 (medium)
Color: color-accent-text
Background: color-accent-muted
```

### Widget Title
```
Size: 12px (text-sm)
Weight: 600 (semibold)
Color: color-text-2
Letter spacing: wider (0.05em)
Transform: uppercase
```

### Widget Content / Values
```
Size: 13–14px (text-base to text-md)
Weight: 400 (regular)
Color: color-text
```

### Page Title
```
Size: 22px (text-2xl)
Weight: 600–700
Color: color-text
```

### Metric / Count (large number)
```
Size: 28–36px (text-3xl to text-4xl)
Weight: 700 (bold)
Color: color-text
Font: Geist (not mono, even for numbers)
```

### Code / Snippet
```
Size: 12–13px (text-sm to text-base)
Font: Geist Mono
Color: color-text (in light syntax), token colors (in syntax highlighted)
Background: color-surface-2
```

### Timestamp / Date
```
Size: 11px (text-xs)
Font: Geist Mono
Color: color-text-muted
```

### Error / Validation Message
```
Size: 12px (text-sm)
Weight: 400 (regular)
Color: color-danger
```

---

## Keyboard Shortcut Typography

Keyboard shortcuts are always shown in monospace, styled as `<kbd>`.

```css
kbd {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-2);
  background: var(--color-surface-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 1px 5px;
  letter-spacing: 0;
}
```

---

## Line Length

- **UI text** (labels, nav, buttons): no max-width constraint
- **Body text** (notes, descriptions): max 70 characters per line (≈ `max-width: 65ch`)
- **Code blocks**: horizontal scroll, no wrapping

---

## Anti-patterns

```
❌ Using font-size below 11px (readability)
❌ Using font-weight 300 (thin text is hard to read on dark bg)
❌ All-caps for body text (only for widget labels ≤ 10 chars)
❌ Justified text (creates river gaps, bad for readability)
❌ Using serif fonts (inconsistent with developer tool aesthetic)
❌ Line height below 1.25 for multi-line text
❌ Mixing more than 2 font weights in a single UI section
```

---

*Last updated: 2026-07-17*
*Status: Foundation*
