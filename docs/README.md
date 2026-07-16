# DevOS Documentation

> **A personal command center for software engineers.**

---

## What is DevOS?

DevOS is a self-hosted developer operating system. It is a Mission Control
for a software engineer — one URL where every tool, workflow, and piece of
context lives together.

Not a SaaS. Not a productivity app. Not a career platform. A personal
operating system for the developer who wants full control over their
environment.

→ Read the full vision: [docs/vision/01-vision.md](./vision/01-vision.md)

---

## Documentation Structure

```
docs/
│
├── vision/                    ← Identity and direction
│   ├── 01-vision.md           ← What DevOS is
│   ├── 02-mission.md          ← Why DevOS exists
│   ├── 03-principles.md       ← The 10 guiding rules
│   ├── 04-goals.md            ← Phased development goals
│   └── 05-non-goals.md        ← Explicit scope boundaries
│
├── product/                   ← Product structure and scope
│   ├── information-architecture.md   ← Full nav and widget catalog
│   └── module-breakdown.md           ← All 12 modules in detail
│
├── architecture/              ← Technical architecture (coming next)
│   ├── frontend.md
│   ├── backend.md
│   ├── database.md
│   └── adr/                   ← Architecture Decision Records
│       └── ADR-000-template.md
│
├── engineering/               ← Standards and conventions (coming next)
│   ├── naming-convention.md
│   ├── git-convention.md
│   ├── folder-structure.md
│   └── code-standards.md
│
├── design/                    ← Design system (coming next)
│   ├── tokens.md
│   ├── typography.md
│   ├── color.md
│   └── components.md
│
└── agents/                    ← AI agent specifications (coming next)
    ├── agent-spec.md
    └── skills/
```

---

## Current Status

| Phase | Document | Status |
|-------|----------|--------|
| Phase 0 | Vision | ✅ Done |
| Phase 0 | Mission | ✅ Done |
| Phase 0 | Principles | ✅ Done |
| Phase 0 | Goals | ✅ Done |
| Phase 0 | Non-Goals | ✅ Done |
| Phase 0 | Information Architecture | ✅ Done |
| Phase 0 | Module Breakdown | ✅ Done |
| Phase 0 | Frontend Architecture | ✅ Done |
| Phase 0 | Engineering Standards | ✅ Done |
| Phase 0 | AI Agent Specs | ✅ Done |
| Phase 0 | AI Agent Skills (Antigravity) | ✅ Done |
| Phase 0 | Backend Architecture | 🔲 Not started |
| Phase 0 | Design System | 🔲 Not started |
| Phase 1 | Repository Setup | 🔲 Not started |
| Phase 1 | Development | 🔲 Not started |

---

## Relationship with TRASON

| Dimension | TRASON | DevOS |
|-----------|--------|-------|
| Type | SaaS Product | Personal Operating System |
| Audience | Public users | Rizky (developer) |
| Core | Career management | Developer workspace |
| Scope | Job search, ATS, resume | Code, infra, knowledge, AI |

These projects are complementary. They do not compete.

---

## Key Decisions

All major architectural decisions are recorded as Architecture Decision
Records (ADRs) in [docs/architecture/adr/](./architecture/adr/).

---

*Last updated: 2026-07-17*
*Project started: 2026-07-17*
