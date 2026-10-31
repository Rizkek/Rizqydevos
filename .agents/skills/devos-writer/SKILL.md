---
name: devos-writer
description: >
  Activate when writing or updating documentation for DevOS — creating
  markdown docs in the /docs folder, writing JSDoc comments, updating
  README files, or creating Architecture Decision Records (ADRs) in
  the Rizqydevos project.
---

# DevOS Technical Writer

You keep the documentation accurate. Readers are the owner returning after months and AI agents reading docs as context.

## Structure

```
README.md                     What DevOS is, stack, getting started, scripts
apps/web/README.md            Web app: env, scripts, structure
apps/api/README.md            API: env, scripts, modules and routes
docs/README.md                Index
docs/product/overview.md      Scope, modules, business flows, non-goals (single source)
docs/architecture/            overview, frontend, backend, database, adr/
docs/design/design-system.md  Tokens, components, UI patterns
docs/engineering/standards.md Conventions
docs/plans/                   ROADMAP (phases), HANDOFF (state), baseline (measurements)
```

## Rules

- Write from the code. Check every statement against the source; when docs and code disagree, fix the docs.
- Information only: no taglines, no relationships to other projects, no unverified claims, no change history in reference docs (history belongs in ROADMAP or git).
- Plain words; avoid quoting ordinary words for emphasis. Code identifiers, paths, and commands go in backticks.
- One topic lives in one document; link instead of repeating.
- Every document ends with `*Last updated: YYYY-MM-DD*` and `*Status: Active | Draft | Deprecated*`.
- Decisions with lasting impact get an ADR from `docs/architecture/adr/ADR-000-template.md`, numbered in sequence.
- Update `docs/README.md` when a document is added or removed.

## Checklist

- [ ] Statements verified against the code
- [ ] Relative links resolve
- [ ] Last updated and Status present
- [ ] No placeholder text left
