# Design Tokens

All design tokens for DevOS. These are the atomic values that every
component is built from. No magic numbers outside of this file.

Implemented as CSS custom properties in `src/styles/tokens.css` and
mapped to Tailwind v4 theme configuration.

---

## Color Tokens

### Dark Theme (Default)

```css
:root {
  /* ── Background ── */
  --color-bg:           hsl(0, 0%, 6%);    /* #0f0f0f — app background */
  --color-bg-subtle:    hsl(0, 0%, 8%);    /* #141414 — subtle bg variation */
  --color-surface:      hsl(0, 0%, 9%);    /* #171717 — card, panel surface */
  --color-surface-2:    hsl(0, 0%, 11%);   /* #1c1c1c — elevated surface */
  --color-surface-3:    hsl(0, 0%, 14%);   /* #242424 — more elevated */

  /* ── Border ── */
  --color-border:       hsl(0, 0%, 14%);   /* #242424 — default border */
  --color-border-subtle: hsl(0, 0%, 11%);  /* #1c1c1c — subtle dividers */
  --color-border-strong: hsl(0, 0%, 20%);  /* #333333 — emphasized border */

  /* ── Text ── */
  --color-text:         hsl(0, 0%, 97%);   /* #f7f7f7 — primary text */
  --color-text-2:       hsl(0, 0%, 70%);   /* #b3b3b3 — secondary text */
  --color-text-muted:   hsl(0, 0%, 45%);   /* #737373 — muted/placeholder */
  --color-text-disabled: hsl(0, 0%, 30%);  /* #4d4d4d — disabled state */

  /* ── Accent — Violet ── */
  --color-accent:       hsl(262, 83%, 68%);  /* #8b5cf6 — primary accent */
  --color-accent-hover: hsl(262, 83%, 60%);  /* #7c3aed — hover state */
  --color-accent-muted: hsl(262, 83%, 68%, 0.15); /* subtle accent bg */
  --color-accent-border: hsl(262, 83%, 68%, 0.30); /* accent-tinted border */
  --color-accent-text:  hsl(262, 100%, 85%); /* accent on dark bg */

  /* ── Semantic — Status ── */
  --color-success:      hsl(142, 71%, 45%);  /* #22c55e — green */
  --color-success-muted: hsl(142, 71%, 45%, 0.15);
  --color-warning:      hsl(38, 92%, 50%);   /* #f59e0b — amber */
  --color-warning-muted: hsl(38, 92%, 50%, 0.15);
  --color-danger:       hsl(0, 84%, 60%);    /* #ef4444 — red */
  --color-danger-muted: hsl(0, 84%, 60%, 0.15);
  --color-info:         hsl(217, 91%, 60%);  /* #3b82f6 — blue */
  --color-info-muted:   hsl(217, 91%, 60%, 0.15);

  /* ── Semantic — States ── */
  --color-focus-ring:   hsl(262, 83%, 68%, 0.5);  /* focus outline */
  --color-overlay:      hsl(0, 0%, 0%, 0.6);       /* modal backdrop */
  --color-selection:    hsl(262, 83%, 68%, 0.25);  /* text selection */
}
```

### Light Theme

```css
[data-theme="light"] {
  /* ── Background ── */
  --color-bg:           hsl(0, 0%, 98%);
  --color-bg-subtle:    hsl(0, 0%, 96%);
  --color-surface:      hsl(0, 0%, 100%);
  --color-surface-2:    hsl(0, 0%, 97%);
  --color-surface-3:    hsl(0, 0%, 94%);

  /* ── Border ── */
  --color-border:       hsl(0, 0%, 88%);
  --color-border-subtle: hsl(0, 0%, 92%);
  --color-border-strong: hsl(0, 0%, 78%);

  /* ── Text ── */
  --color-text:         hsl(0, 0%, 9%);
  --color-text-2:       hsl(0, 0%, 32%);
  --color-text-muted:   hsl(0, 0%, 55%);
  --color-text-disabled: hsl(0, 0%, 70%);

  /* Accent stays the same in light mode */
  --color-accent:       hsl(262, 83%, 58%);  /* slightly darker for contrast */
  --color-accent-hover: hsl(262, 83%, 50%);
  --color-accent-muted: hsl(262, 83%, 58%, 0.10);
  --color-accent-border: hsl(262, 83%, 58%, 0.25);
  --color-accent-text:  hsl(262, 83%, 45%);

  /* Semantic colors are slightly adjusted for contrast */
  --color-success:      hsl(142, 71%, 35%);
  --color-warning:      hsl(38, 92%, 40%);
  --color-danger:       hsl(0, 84%, 50%);
  --color-info:         hsl(217, 91%, 50%);
}
```

---

## Spacing Tokens

Base unit: **4px**. All spacing is multiples of the base unit.

```css
:root {
  --space-0:    0px;
  --space-px:   1px;
  --space-0-5:  2px;    /* 0.5 */
  --space-1:    4px;
  --space-1-5:  6px;
  --space-2:    8px;
  --space-2-5:  10px;
  --space-3:    12px;
  --space-3-5:  14px;
  --space-4:    16px;
  --space-5:    20px;
  --space-6:    24px;
  --space-7:    28px;
  --space-8:    32px;
  --space-9:    36px;
  --space-10:   40px;
  --space-12:   48px;
  --space-14:   56px;
  --space-16:   64px;
  --space-20:   80px;
  --space-24:   96px;
}
```

### Semantic Spacing

```css
:root {
  --spacing-widget-padding:   var(--space-4);   /* 16px — inside widgets */
  --spacing-section-gap:      var(--space-6);   /* 24px — between sections */
  --spacing-page-padding:     var(--space-6);   /* 24px — page horizontal padding */
  --spacing-sidebar-padding:  var(--space-3);   /* 12px — sidebar item padding */
  --spacing-input-x:          var(--space-3);   /* 12px — input horizontal padding */
  --spacing-input-y:          var(--space-2);   /* 8px — input vertical padding */
  --spacing-button-x:         var(--space-4);   /* 16px — button horizontal */
  --spacing-button-y:         var(--space-2);   /* 8px — button vertical */
}
```

---

## Typography Tokens

```css
:root {
  /* ── Font Families ── */
  --font-sans:  'Geist', system-ui, -apple-system, sans-serif;
  --font-mono:  'Geist Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* ── Font Sizes ── */
  --text-xs:    11px;   /* labels, badges, timestamps */
  --text-sm:    12px;   /* secondary text, captions */
  --text-base:  13px;   /* body text (dense UI default) */
  --text-md:    14px;   /* slightly larger body */
  --text-lg:    16px;   /* section headers */
  --text-xl:    18px;   /* card titles */
  --text-2xl:   22px;   /* page titles */
  --text-3xl:   28px;   /* major headings */
  --text-4xl:   36px;   /* display */

  /* ── Font Weights ── */
  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;

  /* ── Line Heights ── */
  --leading-none:    1;
  --leading-tight:   1.25;
  --leading-snug:    1.375;
  --leading-normal:  1.5;
  --leading-relaxed: 1.625;

  /* ── Letter Spacing ── */
  --tracking-tight:  -0.02em;
  --tracking-normal:  0em;
  --tracking-wide:    0.05em;
  --tracking-wider:   0.1em;
  --tracking-widest:  0.15em;
}
```

---

## Border Radius Tokens

```css
:root {
  --radius-none:  0px;
  --radius-sm:    4px;    /* inputs, small buttons */
  --radius-md:    6px;    /* cards, panels (default) */
  --radius-lg:    8px;    /* modals, dropdowns */
  --radius-xl:    12px;   /* large cards, sheets */
  --radius-2xl:   16px;   /* very large surfaces */
  --radius-full:  9999px; /* pills, badges, avatars */
}
```

---

## Shadow Tokens

```css
:root {
  /* Dark mode shadows (very subtle — dark surfaces don't shadow well) */
  --shadow-sm:  0 1px 2px hsl(0, 0%, 0%, 0.4);
  --shadow-md:  0 4px 8px hsl(0, 0%, 0%, 0.4), 0 1px 2px hsl(0, 0%, 0%, 0.3);
  --shadow-lg:  0 8px 24px hsl(0, 0%, 0%, 0.5), 0 2px 4px hsl(0, 0%, 0%, 0.3);
  --shadow-xl:  0 16px 40px hsl(0, 0%, 0%, 0.6), 0 4px 8px hsl(0, 0%, 0%, 0.3);

  /* Glow effect for accent-colored elements */
  --shadow-accent: 0 0 20px hsl(262, 83%, 68%, 0.25);

  /* Inset shadow for pressed/active state */
  --shadow-inset: inset 0 1px 2px hsl(0, 0%, 0%, 0.3);
}
```

---

## Transition Tokens

```css
:root {
  /* ── Durations ── */
  --duration-instant:  75ms;
  --duration-fast:     150ms;   /* hover effects */
  --duration-normal:   200ms;   /* state changes */
  --duration-slow:     300ms;   /* panel open/close */
  --duration-slower:   400ms;   /* page transitions */

  /* ── Easing ── */
  --ease-default:  cubic-bezier(0.4, 0, 0.2, 1);   /* standard */
  --ease-in:       cubic-bezier(0.4, 0, 1, 1);      /* enter */
  --ease-out:      cubic-bezier(0, 0, 0.2, 1);      /* exit */
  --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1); /* bounce/spring */

  /* ── Standard transitions ── */
  --transition-colors: color var(--duration-fast) var(--ease-default),
                       background-color var(--duration-fast) var(--ease-default),
                       border-color var(--duration-fast) var(--ease-default);

  --transition-opacity: opacity var(--duration-fast) var(--ease-default);

  --transition-transform: transform var(--duration-normal) var(--ease-spring);
}
```

---

## Z-Index Scale

```css
:root {
  --z-base:       0;
  --z-raised:     10;    /* cards, raised elements */
  --z-dropdown:   100;   /* dropdowns, popovers */
  --z-sticky:     200;   /* sticky headers */
  --z-overlay:    300;   /* overlays, backdrops */
  --z-modal:      400;   /* modal dialogs */
  --z-toast:      500;   /* notifications */
  --z-tooltip:    600;   /* tooltips */
  --z-command:    700;   /* command palette (always on top) */
}
```

---

## Layout Tokens

```css
:root {
  /* ── Sidebar ── */
  --sidebar-width:          240px;
  --sidebar-collapsed-width: 56px;
  --sidebar-item-height:    32px;

  /* ── Topbar ── */
  --topbar-height:          48px;

  /* ── Widget Grid ── */
  --widget-cols:            12;    /* 12-column grid */
  --widget-row-height:      80px;  /* base row height */
  --widget-gap:             12px;  /* gap between widgets */

  /* ── Content ── */
  --content-max-width:      1400px;
  --content-padding:        var(--space-6);

  /* ── Breakpoints ── */
  --bp-sm:   640px;
  --bp-md:   768px;
  --bp-lg:   1024px;
  --bp-xl:   1280px;
  --bp-2xl:  1536px;
}
```

---

## Tailwind v4 Configuration

These tokens map to Tailwind v4's `@theme` directive:

```css
/* src/styles/tokens.css */
@import "tailwindcss";

@theme {
  /* Colors */
  --color-bg: hsl(0, 0%, 6%);
  --color-surface: hsl(0, 0%, 9%);
  --color-border: hsl(0, 0%, 14%);
  --color-text: hsl(0, 0%, 97%);
  --color-muted: hsl(0, 0%, 45%);
  --color-accent: hsl(262, 83%, 68%);
  --color-success: hsl(142, 71%, 45%);
  --color-warning: hsl(38, 92%, 50%);
  --color-danger: hsl(0, 84%, 60%);

  /* Typography */
  --font-sans: 'Geist', system-ui, sans-serif;
  --font-mono: 'Geist Mono', monospace;
  --font-size-xs: 11px;
  --font-size-sm: 12px;
  --font-size-base: 13px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  /* Transitions */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
}
```

---

*Last updated: 2026-07-17*
*Status: Foundation*
