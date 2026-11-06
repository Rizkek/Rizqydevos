import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Pages behind sign-in. These tests are skipped unless a test account is provided, because they need a running
// API and a database. They only read; use a separate account if you do not want test traffic in your audit log.
//
//   PowerShell: $env:E2E_EMAIL = "<email>"; $env:E2E_PASSWORD = "<password>"
//   Then start the API (bun run --cwd apps/api dev), build the web app (bun run build), and run bun run test:e2e.
//   The web app must be built with API_URL pointing to that API.
const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

test.skip(!email || !password, 'Set E2E_EMAIL and E2E_PASSWORD to run the signed-in page checks')

const APP_PAGES = [
  { name: 'dashboard', path: '/' },
  { name: 'projects', path: '/projects' },
  { name: 'workspace', path: '/workspace' },
  { name: 'knowledge', path: '/knowledge' },
  { name: 'links', path: '/links' },
  { name: 'developer', path: '/developer' },
  { name: 'infrastructure', path: '/infrastructure' },
  { name: 'security', path: '/security' },
  { name: 'security checklist', path: '/security?tab=checklist' },
  { name: 'settings', path: '/settings' },
]

async function signIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email ?? '')
  await page.getByLabel('Password', { exact: true }).fill(password ?? '')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))
}

test.beforeEach(async ({ page }) => {
  await signIn(page)
})

for (const { name, path } of APP_PAGES) {
  test(`${name}: has a main landmark and one heading`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('main')).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  })

  test(`${name}: no axe violations`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze()
    const report = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
    expect(report).toEqual([])
  })

  test(`${name}: fits a 320 px wide screen without sideways scrolling`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('keyboard: the skip link is the first stop and moves focus to the main content', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: /skip to/i })
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
})
