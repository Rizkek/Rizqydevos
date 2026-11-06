import { describe, expect, it } from 'vitest'
import {
  attentionItems,
  dateInputToIso,
  describeDue,
  describeItem,
  isoToDateInput,
  itemState,
  progress,
  type ChecklistItem,
} from './checklist'

const NOW = new Date('2026-11-01T10:00:00.000Z')
const inDays = (days: number) => new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString()

const item = (overrides: Partial<ChecklistItem>): ChecklistItem => ({
  id: '1', title: 'Rotate keys', note: null, done: false, doneAt: null, dueAt: null, repeatDays: null,
  projectId: 'p1', projectName: 'Blog', secretId: null, secretName: null, ...overrides,
})

describe('itemState', () => {
  it('never checked and no date is open', () => {
    expect(itemState(item({}), NOW)).toBe('open')
  })

  it('checked with no date, or a date far away, is ok', () => {
    expect(itemState(item({ done: true }), NOW)).toBe('ok')
    expect(itemState(item({ done: true, dueAt: inDays(90) }), NOW)).toBe('ok')
  })

  it('checked and due within two weeks is due-soon', () => {
    expect(itemState(item({ done: true, dueAt: inDays(14) }), NOW)).toBe('due-soon')
    expect(itemState(item({ done: true, dueAt: inDays(15) }), NOW)).toBe('ok')
  })

  it('a date in the past is overdue whether or not the item was checked', () => {
    expect(itemState(item({ done: true, dueAt: inDays(-3) }), NOW)).toBe('overdue')
    expect(itemState(item({ done: false, dueAt: inDays(-3) }), NOW)).toBe('overdue')
  })

  it('an open item with a future date stays open', () => {
    expect(itemState(item({ dueAt: inDays(5) }), NOW)).toBe('open')
  })
})

describe('progress and attention', () => {
  const items = [
    item({ id: 'a', done: true, dueAt: inDays(60) }),
    item({ id: 'b', done: true, dueAt: inDays(-10) }),
    item({ id: 'c' }),
    item({ id: 'd', done: true, dueAt: inDays(5) }),
    item({ id: 'e', done: true, dueAt: inDays(-2) }),
  ]

  it('counts only checked items that are not overdue as in order', () => {
    expect(progress(items, NOW)).toEqual({ inOrder: 2, total: 5 })
  })

  it('lists overdue items first, longest overdue first, then due soon, and skips open items', () => {
    expect(attentionItems(items, NOW).map((i) => i.id)).toEqual(['b', 'e', 'd'])
  })
})

describe('text', () => {
  it('says how overdue or how far away a date is', () => {
    expect(describeDue(inDays(-1), NOW)).toBe('Overdue by 1 day')
    expect(describeDue(inDays(-12), NOW)).toBe('Overdue by 12 days')
    expect(describeDue(NOW.toISOString(), NOW)).toBe('Due today')
    expect(describeDue('2026-11-04T10:00:00.000Z', NOW)).toBe('Due in 3 days (4 Nov 2026)')
  })

  it('summarises an item without relying on colour', () => {
    expect(describeItem(item({}), NOW)).toBe('Not checked yet')
    expect(describeItem(item({ done: true, doneAt: '2026-10-20T00:00:00.000Z', dueAt: inDays(-1), repeatDays: 90 }), NOW))
      .toBe('Checked 20 Oct 2026 · Overdue by 1 day · repeats every 90 days')
  })
})

describe('date input', () => {
  it('converts between the date field and the API', () => {
    expect(dateInputToIso('2027-01-15')).toBe('2027-01-15T00:00:00.000Z')
    expect(isoToDateInput('2027-01-15T00:00:00.000Z')).toBe('2027-01-15')
    expect(dateInputToIso('15/01/2027')).toBeNull()
    expect(dateInputToIso('')).toBeNull()
    expect(isoToDateInput(null)).toBe('')
  })
})
