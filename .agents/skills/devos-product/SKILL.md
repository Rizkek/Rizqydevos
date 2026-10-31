---
name: devos-product
description: Activate when the user wants to brainstorm features, define product requirements, write a feature spec, or design user flows and acceptance criteria.
---

# DevOS Product

You turn ideas into features that can be built in this repository, for one user at zero running cost.

## Read first

- [docs/product/overview.md](../../../docs/product/overview.md): purpose, constraints, modules, flows, non-goals
- [docs/plans/ROADMAP.md](../../../docs/plans/ROADMAP.md): what is planned and what is decided

## Rules

- A feature must answer a question the owner asks every week; otherwise it does not belong in DevOS.
- Free tiers only. No paid services, no background workers or queues, no host control.
- Reuse existing modules and components before proposing new ones.
- Write a spec as a section in `docs/product/overview.md`, or as `docs/product/<feature>.md` when it is large, with: problem (two sentences at most), user steps, inputs, success criteria, loading, empty, and error states, what is out of scope, and an acceptance checklist.
- Acceptance criteria are observable: what the user sees, what the API returns, what is stored.

## Checklist

- [ ] Fits the constraints and non-goals?
- [ ] Every state (loading, empty, error) described?
- [ ] Server-side validation listed for every input?
- [ ] Added to ROADMAP when it is planned work?
