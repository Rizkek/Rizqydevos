import axe from 'axe-core'
import { expect } from 'vitest'

// jsdom has no layout engine, so rules that need rendered geometry or colors cannot run here:
// contrast is covered by globals.contrast.test.ts and target size by the browser test in e2e/.
// Page-level rules are skipped because components are rendered in isolation, not as whole pages.
const SKIPPED_IN_JSDOM = ['color-contrast', 'target-size', 'region', 'landmark-one-main', 'page-has-heading-one', 'scrollable-region-focusable']

export async function expectNoA11yViolations(root: Element | Document = document.body): Promise<void> {
  const results = await axe.run(root as Element, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    rules: Object.fromEntries(SKIPPED_IN_JSDOM.map((id) => [id, { enabled: false }])),
  })

  const report = results.violations.map(
    (violation) => `${violation.id} (${violation.impact}): ${violation.help} -> ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`,
  )
  expect(report, 'accessibility violations').toEqual([])
}
