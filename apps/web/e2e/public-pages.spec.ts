import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Pages that do not need a session. Pages behind login need a database and are not covered here.
const PAGES = [
  { name: 'sign in', path: '/login' },
  { name: 'reset password', path: '/reset-password?token=test-token' },
]
const THEMES = ['dark', 'light'] as const
const ACCENTS = ['violet', 'emerald', 'cyan', 'amber', 'rose'] as const

async function setAppearance(page: Page, theme: (typeof THEMES)[number], accent: (typeof ACCENTS)[number]) {
  // Same shape zustand's persist middleware writes for the UI store.
  await page.addInitScript(
    ([t, a]) => localStorage.setItem('devos-ui', JSON.stringify({ state: { theme: t, accentColor: a }, version: 0 })),
    [theme, accent] as const,
  )
}

for (const { name, path } of PAGES) {
  for (const theme of THEMES) {
    for (const accent of ACCENTS) {
      test(`${name}: no axe violations (${theme} theme, ${accent} accent)`, async ({ page }) => {
        await setAppearance(page, theme, accent)
        await page.goto(path)
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await expect(page.locator('html')).toHaveAttribute('data-accent', accent)

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
          .analyze()

        const report = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
        expect(report).toEqual([])
        // "incomplete" means axe could not decide; contrast must not hide there.
        expect(results.incomplete.filter((v) => v.id === 'color-contrast').map((v) => v.nodes.map((n) => n.target.join(' ')))).toEqual([])
      })
    }
  }
}

test.describe('reflow and zoom (WCAG 1.4.10)', () => {
  for (const { name, path } of PAGES) {
    test(`${name}: no horizontal scrolling at 320px wide`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 })
      await page.goto(path)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })

    test(`${name}: still usable at 200% zoom on a small laptop`, async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 400 })
      await page.goto(path)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      await expect(page.getByRole('button', { name: /sign in|update password|request a new link/i }).or(page.getByRole('link', { name: /request a new link/i })).first()).toBeVisible()
    })
  }
})

test('sign in: keyboard order reaches every control and focus is visible', async ({ page }) => {
  await page.goto('/login')
  const stops: { name: string; outline: boolean }[] = []
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab')
    stops.push(
      await page.evaluate(() => {
        const el = document.activeElement as HTMLInputElement | null
        if (!el || el === document.body) return { name: 'body', outline: false }
        const style = getComputedStyle(el)
        const name = el.labels?.[0]?.textContent ?? el.getAttribute('aria-label') ?? el.textContent?.trim() ?? ''
        return { name, outline: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2 }
      }),
    )
  }
  expect(stops.map((stop) => stop.name)).toEqual(['Email', 'Forgot password?', 'Password', 'Show password', 'Sign in'])
  expect(stops.filter((stop) => !stop.outline).map((stop) => stop.name)).toEqual([])
})

test('sign in: a failed submit moves focus to the first invalid field and announces the error', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByLabel('Email')).toBeFocused()
  await expect(page.getByRole('alert').filter({ hasText: 'Enter your email address.' })).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: 'Enter your password.' })).toBeVisible()
  await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true')
})
