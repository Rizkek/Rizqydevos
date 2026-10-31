import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithQuery } from '@/test/render'
import { SitesPanel } from './sites-panel'

const mocks = vi.hoisted(() => ({ fetchApi: vi.fn() }))

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  fetchApi: mocks.fetchApi,
}))

function respond(projects: unknown[], health: unknown[] = [], ssl: unknown[] = []) {
  mocks.fetchApi.mockImplementation((endpoint: string) => {
    if (endpoint === '/projects') return Promise.resolve(projects)
    if (endpoint.startsWith('/infrastructure/health/batch')) return Promise.resolve(health)
    if (endpoint.startsWith('/infrastructure/ssl/batch')) return Promise.resolve(ssl)
    return Promise.reject(new Error(`unexpected ${endpoint}`))
  })
}

describe('SitesPanel', () => {
  beforeEach(() => {
    mocks.fetchApi.mockReset()
  })

  it('asks for a deploy URL when no project has one, and checks nothing', async () => {
    respond([{ id: '1', name: 'Draft' }])
    renderWithQuery(<SitesPanel />)

    expect(await screen.findByRole('link', { name: /open projects/i })).toHaveAttribute('href', '/projects')
    expect(mocks.fetchApi).toHaveBeenCalledTimes(1)
  })

  it('checks the deploy URLs of projects, not third-party sites', async () => {
    respond(
      [{ id: '1', name: 'Blog', deployUrl: 'blog.example.com' }],
      [{ url: 'https://blog.example.com/', online: true, statusCode: 200, latencyMs: 85 }],
      [{ hostname: 'blog.example.com', status: 'EXPIRING_SOON', daysRemaining: 12 }],
    )
    renderWithQuery(<SitesPanel />)

    expect(await screen.findByText('Online, 85 ms')).toBeInTheDocument()
    expect(await screen.findByText('SSL expires in 12 days')).toBeInTheDocument()
    expect(mocks.fetchApi).toHaveBeenCalledWith(`/infrastructure/health/batch?urls=${encodeURIComponent('https://blog.example.com/')}`)
    expect(mocks.fetchApi).toHaveBeenCalledWith(`/infrastructure/ssl/batch?hostnames=${encodeURIComponent('blog.example.com')}`)
  })

  it('skips the SSL check for plain http sites and says so', async () => {
    respond(
      [{ id: '1', name: 'Legacy', deployUrl: 'http://legacy.example.com' }],
      [{ url: 'http://legacy.example.com/', online: false, statusCode: 503 }],
    )
    renderWithQuery(<SitesPanel />)

    expect(await screen.findByText('Offline, HTTP 503')).toBeInTheDocument()
    expect(screen.getByText('No HTTPS')).toBeInTheDocument()
    expect(mocks.fetchApi).not.toHaveBeenCalledWith(expect.stringContaining('/infrastructure/ssl/batch'))
  })
})
