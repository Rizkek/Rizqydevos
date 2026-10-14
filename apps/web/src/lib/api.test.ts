import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, fetchApi } from './api'

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init })

describe('fetchApi', () => {
  const fetchMock = vi.fn()
  const assign = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    assign.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('location', { origin: 'http://localhost:3000', pathname: '/settings', search: '?tab=integrations', assign })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('unwraps the success envelope', async () => {
    fetchMock.mockResolvedValue(json({ success: true, data: [{ id: 1 }] }))
    await expect(fetchApi('/things')).resolves.toEqual([{ id: 1 }])
  })

  it('sends credentials so the session cookie travels with the request', async () => {
    fetchMock.mockResolvedValue(json({ success: true, data: null }))
    await fetchApi('/things')
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ credentials: 'include' })
  })

  it('returns an empty object for 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    await expect(fetchApi('/things', { method: 'DELETE' })).resolves.toEqual({})
  })

  it('exposes the error code and retryAfter from the API error body', async () => {
    fetchMock.mockResolvedValue(
      json({ success: false, error: { code: 'RATE_LIMITED', message: 'slow down', retryAfter: 30 } }, { status: 429 }),
    )
    const error = await fetchApi('/things').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 429, code: 'RATE_LIMITED', message: 'slow down', retryAfter: 30 })
  })

  it('falls back to a generic message when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>', { status: 502 }))
    const error = await fetchApi('/things').catch((e: unknown) => e)
    expect(error).toMatchObject({ status: 502, message: 'API request failed' })
    expect((error as ApiError).code).toBeUndefined()
  })

  describe('401', () => {
    it('sends the user to login and remembers where they were', async () => {
      fetchMock.mockResolvedValue(json({ success: false, error: { code: 'UNAUTHORIZED', message: 'x' } }, { status: 401 }))
      await expect(fetchApi('/things')).rejects.toBeInstanceOf(ApiError)
      expect(assign).toHaveBeenCalledTimes(1)
      expect(assign).toHaveBeenCalledWith('http://localhost:3000/login?redirectTo=%2Fsettings%3Ftab%3Dintegrations')
    })

    it('does not redirect when already on the login page', async () => {
      vi.stubGlobal('location', { origin: 'http://localhost:3000', pathname: '/login', search: '', assign })
      fetchMock.mockResolvedValue(json({}, { status: 401 }))
      await expect(fetchApi('/things')).rejects.toBeInstanceOf(ApiError)
      expect(assign).not.toHaveBeenCalled()
    })

    it.each([403, 404, 409, 424, 429, 502])('does not redirect for %i', async (status) => {
      fetchMock.mockResolvedValue(json({}, { status }))
      await expect(fetchApi('/things')).rejects.toBeInstanceOf(ApiError)
      expect(assign).not.toHaveBeenCalled()
    })
  })
})
