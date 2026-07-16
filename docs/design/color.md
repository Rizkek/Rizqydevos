# Color System

Full documentation of the DevOS color palette, semantic color usage,
and theming strategy.

Reference: [Tokens](./tokens.md)

---

## Color Philosophy

**Monochrome foundation + one accent.**

The palette is built entirely on neutral grays with a single accent hue (Violet).
The accent color is the only "branded" color. All status colors (green, red, amber)
are purely semantic — they carry meaning, not personality.

This constraint forces visual hierarchy through typography, spacing, and opacity —
not through a rainbow of colors. The result is an interface that feels like a
professional tool, not a consumer app.

---

## Accent Color — Violet

Violet was chosen because:
- Carries strong "developer tool" energy (VS Code, Linear, Vercel all use purple)
- High contrast against the dark gray background
- Distinguishable from all semantic status colors
- Not overused in common apps (blue, green are more common)

```
Accent base:   hsl(262, 83%, 68%)   #8b5cf6
Accent hover:  hsl(262, 83%, 60%)   #7c3aed
Accent light:  hsl(262, 100%, 85%)  #c4b5fd  (text on dark accent bg)
Accent muted:  hsl(262, 83%, 68%) / 15%       (subtle accent backgrounds)
```

---

## Neutral Palette

The full neutral scale used to construct themes.

```
gray-950:  hsl(0, 0%, 4%)    #0a0a0a
gray-900:  hsl(0, 0%, 6%)    #0f0f0f   ← dark bg
gray-850:  hsl(0, 0%, 8%)    #141414   ← subtle bg
gray-800:  hsl(0, 0%, 9%)    #171717   ← surface
gray-750:  hsl(0, 0%, 11%)   #1c1c1c   ← surface-2
gray-700:  hsl(0, 0%, 14%)   #242424   ← border / surface-3
gray-600:  hsl(0, 0%, 20%)   #333333   ← strong border
gray-500:  hsl(0, 0%, 30%)   #4d4d4d   ← disabled text
gray-400:  hsl(0, 0%, 45%)   #737373   ← muted text
gray-300:  hsl(0, 0%, 60%)   #999999   ← subtle text
gray-200:  hsl(0, 0%, 70%)   #b3b3b3   ← secondary text
gray-100:  hsl(0, 0%, 85%)   #d9d9d9
gray-50:   hsl(0, 0%, 97%)   #f7f7f7   ← primary text (dark mode)
```

---

## Semantic Colors

These colors carry specific meaning. They are never used decoratively.

### Success — Green

```
Base:   hsl(142, 71%, 45%)   #22c55e
Muted:  hsl(142, 71%, 45%) / 15%
```

**Used for:**
- Completed tasks / done status
- Successful deploy / health check passing
- Positive metric change (↑)
- SSL valid / no vulnerabilities

---

### Warning — Amber

```
Base:   hsl(38, 92%, 50%)    #f59e0b
Muted:  hsl(38, 92%, 50%) / 15%
```

**Used for:**
- In-progress status
- Warning alerts (not critical)
- SSL expiring soon (< 30 days)
- Degraded service
- Metric change that needs attention

---

### Danger — Red

```
Base:   hsl(0, 84%, 60%)     #ef4444
Muted:  hsl(0, 84%, 60%) / 15%
```

**Used for:**
- Errors and failures
- Service down
- Security vulnerabilities
- Destructive actions (delete confirmations)
- Negative metric change (↓ significant)

---

### Info — Blue

```
Base:   hsl(217, 91%, 60%)   #3b82f6
Muted:  hsl(217, 91%, 60%) / 15%
```

**Used for:**
- Informational messages
- In-progress operations (loading deploy, syncing)
- Neutral state indicators
- Links in body text

---

## Status Indicator System

Used for service health, deploy status, container status, etc.

```
● Online / Success     color-success         green dot
● Degraded / Warning   color-warning         amber dot
● Offline / Error      color-danger          red dot
● Unknown / Checking   color-text-muted      gray dot
● In Progress          color-info            blue dot (animated pulse)
```

---

## Opacity Usage Rules

Opacity is used for:

1. **Muted backgrounds**: Semantic colors at 10–15% opacity for subtle highlights
2. **Hover states**: Surfaces at slightly higher opacity (e.g., 5% white overlay)
3. **Disabled states**: `opacity: 0.4` on the entire disabled element
4. **Overlays**: `hsl(0, 0%, 0%, 0.6)` for modal backdrops

```css
/* Correct: semantic bg via opacity */
.success-badge {
  background: var(--color-success-muted); /* 15% opacity green */
  color: var(--color-success);
}

/* Correct: hover via pseudo-element overlay */
.nav-item:hover::before {
  background: hsl(0, 0%, 100%, 0.05);
}

/* Wrong: mixing color + opacity for semantic backgrounds */
.badge {
  background: green; /* never — use tokens */
  opacity: 0.15;     /* never apply opacity to entire element */
}
```

---

## Color Usage Matrix

| Use Case | Token |
|----------|-------|
| App background | `--color-bg` |
| Card / panel background | `--color-surface` |
| Elevated card (hover) | `--color-surface-2` |
| Input background | `--color-surface-2` |
| Sidebar background | `--color-surface` |
| Default border | `--color-border` |
| Input border | `--color-border` |
| Focused input border | `--color-accent` |
| Dividers | `--color-border-subtle` |
| Primary text | `--color-text` |
| Secondary text (descriptions) | `--color-text-2` |
| Placeholder, timestamp | `--color-text-muted` |
| Disabled text | `--color-text-disabled` |
| Primary button bg | `--color-accent` |
| Primary button hover | `--color-accent-hover` |
| Icon (default) | `--color-text-2` |
| Icon (active) | `--color-text` |
| Active nav item | `--color-accent-muted` bg + `--color-accent-text` |
| Hover nav item | `hsl(0, 0%, 100%, 0.05)` overlay |
| Badge — success | `--color-success-muted` bg + `--color-success` text |
| Badge — warning | `--color-warning-muted` bg + `--color-warning` text |
| Badge — danger | `--color-danger-muted` bg + `--color-danger` text |
| Focus ring | `--color-focus-ring` (2px outline) |
| Selection highlight | `--color-selection` |

---

## Dark vs Light Comparison

| Element | Dark | Light |
|---------|------|-------|
| App bg | `#0f0f0f` near-black | `#fafafa` near-white |
| Card | `#171717` very dark | `#ffffff` white |
| Border | `#242424` dark gray | `#e2e2e2` light gray |
| Text | `#f7f7f7` near-white | `#171717` near-black |
| Muted | `#737373` mid-gray | `#8c8c8c` mid-gray |
| Accent | `#8b5cf6` violet | `#7c3aed` darker violet |
| Shadow | Black-based, 40% opacity | Gray-based, 10% opacity |

---

*Last updated: 2026-07-17*
*Status: Foundation*
