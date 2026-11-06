import { describe, expect, it } from 'vitest'
import { buildAttention, countOpenItems } from './attention'
import type { ChecklistItem } from './checklist'
import type { HealthResult, Site, SslResult } from './sites'

const NOW = new Date('2026-11-01T10:00:00.000Z')
const inDays = (days: number) => new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString()

const item = (overrides: Partial<ChecklistItem>): ChecklistItem => ({
  id: '1', title: 'Rotate keys', note: null, done: true, doneAt: inDays(-30), dueAt: null, repeatDays: null,
  projectId: 'p1', projectName: 'Blog', secretId: null, secretName: null, ...overrides,
})
const site = (name: string, host: string, https = true): Site => ({ projectId: name, name, url: `${https ? 'https' : 'http'}://${host}/`, hostname: host, https })
const up = (s: Site): HealthResult => ({ url: s.url, online: true, statusCode: 200, latencyMs: 80 })
const ssl = (hostname: string, status: SslResult['status'], daysRemaining: number): SslResult => ({ hostname, status, daysRemaining })

describe('buildAttention', () => {
  it('returns nothing when everything is in order', () => {
    const blog = site('Blog', 'blog.example.com')
    expect(buildAttention({ items: [item({ dueAt: inDays(60) })], sites: [blog], health: [up(blog)], ssl: [ssl('blog.example.com', 'VALID', 80)], now: NOW })).toEqual([])
  })

  it('flags overdue items as danger and items due soon as warning', () => {
    const entries = buildAttention({ items: [item({ id: 'a', dueAt: inDays(5) }), item({ id: 'b', title: 'Renew domain', dueAt: inDays(-2) })], sites: [], health: [], ssl: [], now: NOW })
    expect(entries.map((e) => [e.key, e.tone])).toEqual([['item-b', 'danger'], ['item-a', 'warning']])
    expect(entries[0]).toMatchObject({ title: 'Renew domain', detail: 'Blog · Overdue by 2 days', href: '/security?tab=checklist' })
  })

  it('flags an offline site and expiring or expired certificates, and sends them to Infrastructure', () => {
    const down = site('Docs', 'docs.example.com')
    const soon = site('Shop', 'shop.example.com')
    const gone = site('Old', 'old.example.com')
    const entries = buildAttention({
      items: [],
      sites: [down, soon, gone],
      health: [{ url: down.url, online: false, statusCode: 503 }, up(soon), up(gone)],
      ssl: [ssl('docs.example.com', 'VALID', 90), ssl('shop.example.com', 'EXPIRING_SOON', 9), ssl('old.example.com', 'EXPIRED', -1)],
      now: NOW,
    })
    expect(entries.map((e) => [e.title, e.tone])).toEqual([
      ['Docs is offline', 'danger'],
      ['Old: SSL expired', 'danger'],
      ['Shop: SSL expires in 9 days', 'warning'],
    ])
    expect(entries.every((e) => e.href === '/infrastructure')).toBe(true)
  })

  it('does not flag a site as offline before its check has returned, or read SSL for plain http', () => {
    const plain = site('Legacy', 'legacy.example.com', false)
    expect(buildAttention({ items: [], sites: [plain], health: undefined, ssl: [ssl('legacy.example.com', 'EXPIRED', -5)], now: NOW })).toEqual([])
  })

  it('puts danger entries before warnings across groups', () => {
    const shop = site('Shop', 'shop.example.com')
    const entries = buildAttention({ items: [item({ dueAt: inDays(3) })], sites: [shop], health: [{ url: shop.url, online: false }], ssl: [], now: NOW })
    expect(entries.map((e) => e.tone)).toEqual(['danger', 'warning'])
  })
})

describe('countOpenItems', () => {
  it('counts items that were never checked and are not overdue', () => {
    expect(countOpenItems([item({ done: false, doneAt: null }), item({ done: false, doneAt: null, dueAt: inDays(-1) }), item({})], NOW)).toBe(1)
  })
})
