# Motion & Animation

Animation principles, timing values, and interaction patterns for DevOS.

Reference: [Tokens](./tokens.md)

---

## Motion Philosophy

**Purposeful, fast, and never distracting.**

Every animation in DevOS serves a functional purpose:
1. **Orientation** — helps the user understand where content came from
2. **State communication** — signals that something changed
3. **Continuity** — keeps the user anchored during transitions

Animations never exist purely for aesthetics. If removing an animation
doesn't break comprehension — it should be removed.

**The 200ms rule:** Any animation longer than 200ms for a UI state change
is too slow. Users should never feel like they are waiting for the UI.

---

## Duration Scale

| Token | Value | Use Case |
|-------|-------|---------|
| `--duration-instant` | 75ms | Hover color changes, focus rings |
| `--duration-fast` | 150ms | Button press, icon swap, badge update |
| `--duration-normal` | 200ms | Dropdown open, tooltip show, modal fade |
| `--duration-slow` | 300ms | Sidebar slide, sheet open, panel expand |
| `--duration-slower` | 400ms | Page entry, large layout shifts |

**Never exceed 400ms** for any UI transition in the main app.
Loading/progress animations are the exception.

---

## Easing Functions

```css
--ease-default:  cubic-bezier(0.4, 0, 0.2, 1);   /* Material standard — most transitions */
--ease-in:       cubic-bezier(0.4, 0, 1, 1);      /* Elements exiting the screen */
--ease-out:      cubic-bezier(0, 0, 0.2, 1);      /* Elements entering the screen */
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1); /* Playful spring (use sparingly) */
```

### When to Use Each

| Easing | When |
|--------|------|
| `ease-default` | Everything that doesn't enter or exit |
| `ease-out` | Modals opening, dropdowns appearing, toasts entering |
| `ease-in` | Modals closing, dropdowns disappearing, toasts exiting |
| `ease-spring` | Success states, button interactions, widget appearance |

---

## Component Animation Patterns

### Button — Press

```css
button:active {
  transform: scale(0.97);
  transition: transform var(--duration-instant) var(--ease-default);
}
```

### Hover — Background

```css
.nav-item {
  transition: background-color var(--duration-fast) var(--ease-default);
}
/* No transform on hover — hover transforms feel jittery */
```

### Dropdown / Popover — Open

```css
@keyframes dropdown-open {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dropdown {
  animation: dropdown-open var(--duration-normal) var(--ease-out);
}
```

### Modal — Open

```css
@keyframes modal-backdrop {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes modal-panel {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-backdrop {
  animation: modal-backdrop var(--duration-normal) var(--ease-out);
}

.modal-panel {
  animation: modal-panel var(--duration-slow) var(--ease-out);
}
```

### Command Palette — Open

```css
@keyframes command-palette-open {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### Toast Notification — Enter

```css
@keyframes toast-enter {
  from {
    opacity: 0;
    transform: translateX(calc(100% + 16px));
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Exit from bottom */
@keyframes toast-exit {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(calc(100% + 16px));
  }
}
```

### Sidebar — Collapse/Expand

```css
.sidebar {
  width: var(--sidebar-width);
  transition: width var(--duration-slow) var(--ease-default);
  overflow: hidden;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}
```

### Widget — Appear on Dashboard

```css
@keyframes widget-enter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Staggered entrance with CSS delay */
.widget:nth-child(1) { animation-delay: 0ms; }
.widget:nth-child(2) { animation-delay: 40ms; }
.widget:nth-child(3) { animation-delay: 80ms; }
/* ... max 6 staggered — don't stagger more than 6 items */
```

### Number Count-up

Used for metrics (e.g., GitHub commit count, uptime percentage).

```typescript
// Use a simple count-up hook — duration 800ms, ease-out
// Only play on first mount, not on every re-render
```

### Loading States

```css
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

.skeleton {
  background: var(--color-surface-3);
  border-radius: var(--radius-md);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
```

### Status Indicator Pulse (live services)

```css
@keyframes status-pulse {
  0% {
    box-shadow: 0 0 0 0 currentColor;
    opacity: 1;
  }
  70% {
    box-shadow: 0 0 0 6px transparent;
    opacity: 0;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
    opacity: 0;
  }
}

/* Only for "online/active" status — not for error or offline */
.status-dot.online::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  animation: status-pulse 2s ease-out infinite;
  color: var(--color-success);
}
```

---

## Reduced Motion

**Always respect `prefers-reduced-motion`.**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Motion Anti-patterns

```
❌ Animations longer than 400ms on UI state changes
❌ Transform + color change simultaneously (pick one)
❌ Infinite spinning loaders on content that loads in < 1s
❌ Parallax effects (cognitively disorienting)
❌ Bounce effects on destructive actions (dismissive feeling)
❌ Fade-in for elements that appear instantly (< 100ms)
❌ Staggering more than 8 items in a list
❌ Using spring easing on critical error states
❌ Animating layout properties (width, height) — use transform instead
```

---

## Motion with Motion Library (Framer Motion)

For complex animations, use `motion` from `framer-motion`:

```tsx
import { motion, AnimatePresence } from 'motion/react'

// Standard entry animation
<motion.div
  initial={{ opacity: 0, y: -4 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -4 }}
  transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
>
  {children}
</motion.div>

// Layout animation (for reordering widgets)
<motion.div layout layoutId={widget.id}>
  <Widget />
</motion.div>
```

Use `AnimatePresence` for all conditional rendering that should animate
on both mount and unmount.

---

*Last updated: 2026-07-17*
*Status: Foundation*
