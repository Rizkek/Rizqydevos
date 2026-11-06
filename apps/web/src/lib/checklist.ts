export interface ChecklistItem {
  id: string
  title: string
  note: string | null
  done: boolean
  doneAt: string | null
  dueAt: string | null
  repeatDays: number | null
  projectId: string
  projectName: string
  secretId: string | null
  secretName: string | null
}

// open: never checked. overdue: past its due date, checked or not. due-soon: checked, due within the window. ok: checked.
export type ItemState = 'open' | 'overdue' | 'due-soon' | 'ok'

export const DUE_SOON_DAYS = 14
const DAY_MS = 24 * 60 * 60 * 1000

// Whole days from now until the date; negative once it has passed (a date earlier today counts as 0 days).
export function daysUntil(iso: string, now: Date): number {
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / DAY_MS)
}

export function itemState(item: Pick<ChecklistItem, 'done' | 'dueAt'>, now: Date): ItemState {
  const days = item.dueAt ? daysUntil(item.dueAt, now) : null
  if (days !== null && days < 0) return 'overdue'
  if (!item.done) return 'open'
  if (days !== null && days <= DUE_SOON_DAYS) return 'due-soon'
  return 'ok'
}

// Checked and not overdue: counts toward "in order".
export function isInOrder(state: ItemState): boolean {
  return state === 'ok' || state === 'due-soon'
}

export function progress(items: ChecklistItem[], now: Date): { inOrder: number; total: number } {
  return { inOrder: items.filter((item) => isInOrder(itemState(item, now))).length, total: items.length }
}

// Overdue first (longest overdue first), then due soon (soonest first). Open items are not listed:
// a project with six unchecked recommended items would bury the dates that actually matter.
export function attentionItems(items: ChecklistItem[], now: Date): ChecklistItem[] {
  const days = (item: ChecklistItem) => (item.dueAt ? daysUntil(item.dueAt, now) : 0)
  return items
    .filter((item) => {
      const state = itemState(item, now)
      return state === 'overdue' || state === 'due-soon'
    })
    .sort((a, b) => days(a) - days(b))
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function describeDue(dueAt: string, now: Date): string {
  const days = daysUntil(dueAt, now)
  if (days < 0) return `Overdue by ${plural(-days, 'day')}`
  if (days === 0) return 'Due today'
  return `Due in ${plural(days, 'day')} (${formatDay(dueAt)})`
}

export function describeItem(item: ChecklistItem, now: Date): string {
  const parts: string[] = []
  parts.push(item.doneAt ? `Checked ${formatDay(item.doneAt)}` : 'Not checked yet')
  if (item.dueAt) parts.push(describeDue(item.dueAt, now))
  if (item.repeatDays) parts.push(`repeats every ${plural(item.repeatDays, 'day')}`)
  return parts.join(' · ')
}

// <input type="date"> works with YYYY-MM-DD; the API stores a full ISO date at midnight UTC.
export function dateInputToIso(value: string): string | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00.000Z`).toISOString() : null
}

export function isoToDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : ''
}
