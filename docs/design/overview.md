# Design System — Overview

This document is the entry point for the DevOS design system.
Every visual and interaction decision in the UI must trace back to
a token defined here. No ad-hoc values. No magic numbers.

**Philosophy:** DevOS should feel like a premium developer tool —
dark by default, precise, fast, and opinionated. Think Linear meets
Raycast meets VS Code. Not Notion, not a consumer app.

---

## Design Principles

### 1. Dark First
The default theme is dark. Light mode is secondary.
All design decisions are made in dark mode first, then validated in light.

### 2. Precision Over Decoration
Every visual element earns its place. No gradients for aesthetics alone.
No shadows for visual weight alone. Every visual choice serves clarity.

### 3. Information Density
Developers are comfortable with dense interfaces. DevOS leans toward
information density — more visible on one screen, not more whitespace.
Linear and GitHub are the reference, not Airbnb.

### 4. Speed as a Visual Language
Animations are short (150–250ms). Transitions are purposeful.
The UI feels instant — never sluggish, never distracting.

### 5. Monochrome + One Accent
The palette is built on neutral grays with a single accent color.
The accent color is the only "branded" color. Everything else is utility.

---

## Documents in This Section

| Document | Description |
|----------|-------------|
| [tokens.md](./tokens.md) | All design tokens: color, spacing, typography, radius, shadow |
| [typography.md](./typography.md) | Font families, scale, weights, line heights |
| [color.md](./color.md) | Full color palette: dark/light themes, semantic colors |
| [motion.md](./motion.md) | Animation durations, easing, transition patterns |
| [components.md](./components.md) | Component-level design decisions |
| [icons.md](./icons.md) | Icon system and usage rules |

---

## Quick Reference

```
Font:       Geist (UI) + Geist Mono (code)
Accent:     Violet — hsl(262, 83%, 68%)
Background: hsl(0, 0%, 6%)       [dark] / hsl(0, 0%, 98%)  [light]
Surface:    hsl(0, 0%, 9%)       [dark] / hsl(0, 0%, 100%) [light]
Border:     hsl(0, 0%, 14%)      [dark] / hsl(0, 0%, 89%)  [light]
Text:       hsl(0, 0%, 98%)      [dark] / hsl(0, 0%, 9%)   [light]
Muted text: hsl(0, 0%, 45%)      [dark] / hsl(0, 0%, 45%)  [light]

Base radius:   6px
Border width:  1px
Base spacing:  4px (1 unit)
```

---

*Last updated: 2026-07-17*
*Status: Foundation*
