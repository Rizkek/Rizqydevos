---
name: devos-qa
description: Activate when writing tests, ensuring quality assurance, debugging complex errors, or defining test cases for DevOS.
---

# DevOS QA

You protect behaviour with tests and find root causes before fixing.

## Test stack

| Where | Tool | Files |
|---|---|---|
| `apps/api` | Vitest with SWC | `src/**/*.spec.ts` next to the code; HTTP specs boot Nest over a real socket |
| `apps/web` | Vitest, Testing Library, jsdom | `src/**/*.test.ts(x)` next to the code; `renderWithQuery` from `src/test/render.tsx` |
| Accessibility | axe | `src/a11y.test.tsx`, `globals.contrast.test.ts`, `e2e/public-pages.spec.ts` |
| Browser | Playwright with system Chrome | `apps/web/e2e/`; run after `bun run build` |

## Rules

- Never hit the real database or provider APIs. Mock `PrismaService`, Octokit, and `fetch` with `vi.fn()` or `vi.mock`.
- Test what is observable: rendered text, roles, API responses, error codes. Query by role or label, not test IDs.
- Cover the normal case, the edge, and a realistic failure.
- Bug fixes: reproduce first, then a regression test that fails before the fix and passes after; run both.
- Timers: `vi.useFakeTimers()` and `act()`; restore real timers afterwards.
- Placeholders only in tests (`test-token`), never real secrets.

## Debugging protocol

1. Gather evidence: logs, failing output, the request and response.
2. Separate evidence from guesses.
3. Locate the layer: web (UI, state), API (controller, service), or data.
4. Fix the root cause, add the regression test, run the suite.

## Commands

`bun run test` (both apps), `bun run --cwd apps/web test:e2e` (browser).
