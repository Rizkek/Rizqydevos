import { describe, expect, it } from 'vitest'
import { ApiError } from './api'
import { describeIntegrationError, shouldRetryIntegration } from './integrations'

describe('describeIntegrationError', () => {
  it.each([
    ['INTEGRATION_NOT_CONFIGURED', 'not-connected', 'settings'],
    ['INTEGRATION_DISABLED', 'disabled', 'settings'],
    ['TOKEN_UNREADABLE', 'reconnect', 'settings'],
    ['TOKEN_REJECTED', 'token-rejected', 'settings'],
    ['RATE_LIMITED', 'rate-limited', 'retry'],
    ['UPSTREAM_UNAVAILABLE', 'unavailable', 'retry'],
  ] as const)('maps %s to %s with action %s', (code, kind, action) => {
    const issue = describeIntegrationError(new ApiError(424, 'server text', code), 'github')
    expect(issue).toMatchObject({ kind, action })
  })

  it('names the provider in the message', () => {
    expect(describeIntegrationError(new ApiError(404, 'x', 'INTEGRATION_NOT_CONFIGURED'), 'vercel').message).toContain('Vercel')
  })

  it('carries retryAfter for rate limits', () => {
    const issue = describeIntegrationError(new ApiError(429, 'x', 'RATE_LIMITED', 42), 'github')
    expect(issue.retryAfter).toBe(42)
  })

  it('reports an unreachable API (fetch TypeError) as unavailable with a retry', () => {
    expect(describeIntegrationError(new TypeError('Failed to fetch'), 'github')).toMatchObject({ kind: 'unavailable', action: 'retry' })
  })

  it('keeps the server message for unknown API errors', () => {
    expect(describeIntegrationError(new ApiError(500, 'Boom'), 'github')).toMatchObject({ kind: 'unknown', message: 'Boom' })
  })

  it('does not leak raw messages for non-API errors', () => {
    expect(describeIntegrationError(new Error('internal detail'), 'github').message).toBe('Something went wrong.')
  })
})

describe('shouldRetryIntegration', () => {
  it.each([
    ['INTEGRATION_NOT_CONFIGURED'],
    ['INTEGRATION_DISABLED'],
    ['TOKEN_UNREADABLE'],
    ['TOKEN_REJECTED'],
    ['RATE_LIMITED'],
  ])('never retries %s', (code) => {
    expect(shouldRetryIntegration(0, new ApiError(409, 'x', code))).toBe(false)
  })

  it('does not retry an expired session', () => {
    expect(shouldRetryIntegration(0, new ApiError(401, 'x'))).toBe(false)
  })

  it('retries a transient failure once', () => {
    expect(shouldRetryIntegration(0, new ApiError(502, 'x', 'UPSTREAM_UNAVAILABLE'))).toBe(true)
    expect(shouldRetryIntegration(1, new ApiError(502, 'x', 'UPSTREAM_UNAVAILABLE'))).toBe(false)
    expect(shouldRetryIntegration(0, new TypeError('Failed to fetch'))).toBe(true)
  })
})
