import { describe, expect, it } from 'vitest'
import { ApiError } from './api'
import { retryDelay, shouldRetryQuery } from './query'

const unavailable = new ApiError(504, 'starting', 'API_UNAVAILABLE')

describe('shouldRetryQuery', () => {
  it('keeps retrying while the API wakes up, then gives up', () => {
    expect([0, 1, 2, 3, 4].every((count) => shouldRetryQuery(count, unavailable))).toBe(true)
    expect(shouldRetryQuery(5, unavailable)).toBe(false)
  })

  it('retries other errors once', () => {
    const error = new ApiError(500, 'boom')
    expect(shouldRetryQuery(0, error)).toBe(true)
    expect(shouldRetryQuery(1, error)).toBe(false)
    expect(shouldRetryQuery(0, new TypeError('network'))).toBe(true)
  })

  it('never retries an expired session', () => {
    expect(shouldRetryQuery(0, new ApiError(401, 'expired', 'UNAUTHORIZED'))).toBe(false)
  })
})

describe('retryDelay', () => {
  it('doubles up to a 15 second cap', () => {
    expect([0, 1, 2, 3, 4, 5].map(retryDelay)).toEqual([1000, 2000, 4000, 8000, 15000, 15000])
  })
})
