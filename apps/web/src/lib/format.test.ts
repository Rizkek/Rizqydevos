import { describe, expect, it } from 'vitest'
import { formatTimestamp } from './format'

describe('formatTimestamp', () => {
  const now = new Date(2026, 9, 14, 15, 0, 0)

  it('shows only the time for today', () => {
    const result = formatTimestamp(new Date(2026, 9, 14, 9, 5).toISOString(), now)
    expect(result).toMatch(/\d{1,2}[:.]\d{2}/)
    expect(result).not.toMatch(/Oct/)
  })

  it('includes the date for earlier days', () => {
    expect(formatTimestamp(new Date(2026, 9, 3, 9, 5).toISOString(), now)).toMatch(/Oct/)
  })

  it('accepts epoch milliseconds', () => {
    expect(formatTimestamp(new Date(2026, 8, 1, 9, 5).getTime(), now)).toMatch(/Sep/)
  })

  it.each([null, undefined, 'not a date'])('returns an empty string for %s', (value) => {
    expect(formatTimestamp(value, now)).toBe('')
  })
})
