import { HttpStatus } from '@nestjs/common'
import { describe, expect, it } from 'vitest'
import { IntegrationProvider } from './integration-provider'
import { fromUpstream, IntegrationException, notConfigured, tokenUnreadable } from './integration.errors'

describe('fromUpstream', () => {
  const github = IntegrationProvider.Github

  it('never maps an upstream failure to 401, which is reserved for the app session', () => {
    const statuses = [401, 403, 404, 422, 429, 500, 502, undefined]
    for (const status of statuses) {
      expect(fromUpstream(github, { status }).getStatus()).not.toBe(HttpStatus.UNAUTHORIZED)
    }
  })

  it('maps provider 401 and 403 to TOKEN_REJECTED', () => {
    for (const status of [401, 403]) {
      const error = fromUpstream(github, { status })
      expect(error.code).toBe('TOKEN_REJECTED')
      expect(error.getStatus()).toBe(HttpStatus.FAILED_DEPENDENCY)
    }
  })

  it('maps 429 and the rateLimited flag to RATE_LIMITED and keeps retryAfter', () => {
    const byStatus = fromUpstream(github, { status: 429, retryAfterSeconds: 30 })
    const byFlag = fromUpstream(github, { status: 403, rateLimited: true })
    expect(byStatus.code).toBe('RATE_LIMITED')
    expect(byStatus.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS)
    expect(byStatus.retryAfterSeconds).toBe(30)
    expect(byFlag.code).toBe('RATE_LIMITED')
  })

  it('maps 5xx, unknown 4xx and missing status to UPSTREAM_UNAVAILABLE', () => {
    for (const status of [500, 503, 404, undefined]) {
      const error = fromUpstream(github, { status })
      expect(error.code).toBe('UPSTREAM_UNAVAILABLE')
      expect(error.getStatus()).toBe(HttpStatus.BAD_GATEWAY)
    }
  })

  it('uses 504 when the request timed out', () => {
    expect(fromUpstream(github, { timedOut: true }).getStatus()).toBe(HttpStatus.GATEWAY_TIMEOUT)
  })

  it('names the provider in the message', () => {
    expect(fromUpstream(IntegrationProvider.Vercel, { status: 401 }).message).toContain('Vercel')
  })
})

describe('credential errors', () => {
  it('uses stable codes and non-401 statuses', () => {
    const missing = notConfigured(IntegrationProvider.Github)
    const unreadable = tokenUnreadable(IntegrationProvider.Vercel)
    expect(missing).toBeInstanceOf(IntegrationException)
    expect(missing.code).toBe('INTEGRATION_NOT_CONFIGURED')
    expect(missing.getStatus()).toBe(HttpStatus.NOT_FOUND)
    expect(unreadable.code).toBe('TOKEN_UNREADABLE')
    expect(unreadable.getStatus()).toBe(HttpStatus.CONFLICT)
  })

  it('exposes error as the code so the global filter can surface it', () => {
    const response = notConfigured(IntegrationProvider.Github).getResponse() as Record<string, unknown>
    expect(response['error']).toBe('INTEGRATION_NOT_CONFIGURED')
  })
})
