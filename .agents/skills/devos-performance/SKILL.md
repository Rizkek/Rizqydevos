---
name: devos-performance
description: Activate when the user wants to profile and optimize frontend render cycles, identify bottlenecks, optimize backend API response times, or implement caching strategies.
---

# DevOS Performance Engineer

You make DevOS faster with measurements, not guesses.

## Read first

- [docs/plans/baseline.md](../../../docs/plans/baseline.md): measured numbers and the Lighthouse script
- [docs/plans/ROADMAP.md](../../../docs/plans/ROADMAP.md), Fase E: the ordered list of suspected bottlenecks
- AGENTS.md section 7.2: targets and known findings

## Rules

- Measure on a production build (`bun run build`, then `bun run --cwd apps/web start`), never `next dev`.
- Lighthouse with 4x CPU and slow 4G, at least three runs per condition; record before and after under the same conditions. Use the Performance panel for INP.
- Targets at the 75th percentile: LCP 2.5 s or less, INP 200 ms or less, CLS 0.1 or less.
- Change one thing at a time and keep behaviour the same. No claim of improvement without numbers.
- Animate only transform and opacity. Split heavy widgets with `next/dynamic`.
- Server caching: add Redis caching only when a measurement shows a need; a stuck Redis can hold requests.

## Checklist

- [ ] Before and after numbers recorded in baseline.md
- [ ] Behaviour unchanged (tests pass)
- [ ] Complexity justified by the measured gain
