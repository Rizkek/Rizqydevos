# Principles

These are the guiding principles of DevOS. Every feature, every design
decision, and every architectural choice should be measured against these.
If something violates a principle, it needs a very strong justification
to be included.

---

## P1 — Developer First, Always

> Every feature must improve a developer's workflow. If it doesn't help
> a developer ship, learn, or think — it doesn't belong here.

This is the filter for everything. Before adding any feature, ask:
*"Would a developer reach for this during their workday?"* If the honest
answer is no, it's out of scope.

---

## P2 — One Source of Truth

> DevOS should be the place where context lives — not duplicated across
> Notion, browser bookmarks, sticky notes, and random text files.

The goal is consolidation. If a developer already has to check GitHub,
Vercel, and three Notion pages to understand the state of a project —
DevOS failed.

---

## P3 — Widgets Over Features

> Complex functionality belongs in specialized tools. DevOS surfaces
> status and shortcuts — it does not replace the underlying tools.

DevOS shows GitHub activity. It does not replace GitHub.
DevOS shows a trading watchlist. It does not replace a trading platform.
DevOS shows career status. It does not replace TRASON.

The moment a DevOS feature starts growing into a full application, it
should be extracted into a separate product or linked to an existing one.

---

## P4 — Everything is Optional

> No widget, module, or section should be required. Everything can be
> hidden, disabled, or rearranged without breaking the core experience.

A developer who doesn't care about trading should never see the trading
widget. A developer who doesn't use Docker should never see the containers
section. DevOS adapts to the person, not the other way around.

---

## P5 — Speed is a Feature

> Every interaction should feel instant. No loading spinner should live
> longer than 200ms without a skeleton.

Slow tools are abandoned tools. DevOS must feel faster than switching tabs.
Caching, optimistic UI, and lazy loading are not optional — they are
architectural requirements.

---

## P6 — Keyboard First

> Every common action must be reachable without a mouse.

Command palette, keyboard shortcuts, and focus management are first-class
features. A developer should be able to navigate the entire system with
their hands on the keyboard.

---

## P7 — Privacy by Default

> DevOS is self-hosted. No data leaves the server without explicit intent.
> No telemetry. No third-party analytics on sensitive data.

This is a personal workspace. The developer's notes, API keys, server
credentials, and project data are private by design. Every integration
must be evaluated for its privacy implications.

---

## P8 — Documentation is Code

> Every architectural decision must be documented. Every non-obvious
> choice must have a recorded justification. The docs folder is as
> important as the src folder.

ADRs are mandatory. Engineering standards are maintained. The reason
every major choice was made should be readable by anyone — including
the developer themselves, two years from now.

---

## P9 — AI is a Collaborator, Not a Crutch

> AI features must enhance the developer's thinking, not replace it.
> Automations must be transparent. Every AI action must be auditable.

DevOS can suggest, summarize, and automate — but the developer must
always understand what happened and why. No black boxes.

---

## P10 — Build for Longevity

> DevOS should still work, be maintainable, and be extensible in 5 years.
> Avoid hype-driven tech choices. Choose boring, proven infrastructure
> over clever, fragile solutions.

Choose technologies that have a long track record, strong communities,
and clear migration paths. The goal is a system that grows without
being rebuilt from scratch every two years.

---

*Last updated: 2026-07-17*
*Status: Foundation*
