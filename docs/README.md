# DevOS Documentation

Index of the documents in this folder. Each one describes the code as it is; when they disagree with the code, the code wins and the document is fixed.

---

## Start here

| Need | Document |
|---|---|
| What DevOS is, modules, business flows, non-goals | [product/overview.md](./product/overview.md) |
| System picture, API modules, data flow, security layers | [architecture/overview.md](./architecture/overview.md) |
| How to deploy (Vercel and Render) | [deployment.md](./deployment.md) |
| Current plan and phases | [plans/ROADMAP.md](./plans/ROADMAP.md) |
| Current state, pitfalls, how to verify | [plans/HANDOFF.md](./plans/HANDOFF.md) |
| Rules for AI agents | [../AGENTS.md](../AGENTS.md) |

## All documents

```
docs/
├── product/
│   └── overview.md            Scope, constraints, principles, modules, business flows, non-goals, known gaps
├── architecture/
│   ├── overview.md            System diagram, API modules, data flow, security, dev vs production
│   ├── frontend.md            apps/web: routes, auth, data fetching, client state, testing
│   ├── backend.md             apps/api: request flow, error codes, module rules, testing
│   ├── database.md            Models, conventions, encryption at rest, migrations
│   └── adr/                   Decision records ADR-000 (template) to ADR-006
├── deployment.md              Vercel and Render setup, environment, smoke test, troubleshooting
├── design/
│   └── design-system.md       Tokens, components, UI patterns, accessibility rules
├── engineering/
│   └── standards.md           Tooling, git, naming, TypeScript, React, tests, security
└── plans/
    ├── ROADMAP.md             Phases S, A to H, and P, with owner decisions
    ├── HANDOFF.md             State for the next session, pitfalls, file map
    └── baseline.md            Measured lint, test, and Lighthouse numbers
```

App-level guides: [apps/web/README.md](../apps/web/README.md), [apps/api/README.md](../apps/api/README.md).

---

*Last updated: 2026-11-01*
*Status: Active*
