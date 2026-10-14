// Events from the previous days would be ambiguous with a time-only label.
export function formatTimestamp(value: string | number | null | undefined, now: Date = new Date()): string {
  if (value === null || value === undefined) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const time = { hour: '2-digit', minute: '2-digit' } as const
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], time)
  return date.toLocaleString([], { month: 'short', day: 'numeric', ...time })
}
