import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithQuery } from '@/test/render'
import { expectNoA11yViolations } from '@/test/axe'
import { ApiError } from '@/lib/api'
import { AttentionWidget } from './attention-widget'

const mocks = vi.hoisted(() => ({ fetchApi: vi.fn() }))

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  fetchApi: mocks.fetchApi,
}))

const DAY = 24 * 60 * 60 * 1000
const inDays = (days: number) => new Date(Date.now() + days * DAY).toISOString()

const item = (overrides: Record<string, unknown>) => ({
  id: 'i1', title: 'API keys and tokens are rotated', note: null, done: true, doneAt: inDays(-100), dueAt: inDays(-4), repeatDays: 90,
  projectId: 'p1', projectName: 'Blog', secretId: null, secretName: null, ...overrides,
})

function respond({ items = [] as unknown[], projects = [{ id: 'p1', name: 'Blog', deployUrl: 'blog.example.com' }], health = [] as unknown[], ssl = [] as unknown[] } = {}) {
  mocks.fetchApi.mockImplementation((endpoint: string) => {
    if (endpoint === '/checklist') return Promise.resolve(items)
    if (endpoint === '/projects') return Promise.resolve(projects)
    if (endpoint.startsWith('/infrastructure/health')) return Promise.resolve(health)
    if (endpoint.startsWith('/infrastructure/ssl')) return Promise.resolve(ssl)
    return Promise.reject(new Error(`unexpected ${endpoint}`))
  })
}

describe('AttentionWidget', () => {
  beforeEach(() => {
    mocks.fetchApi.mockReset()
  })

  it('lists an overdue item and links to the checklist tab', async () => {
    respond({ items: [item({})] })
    renderWithQuery(<AttentionWidget />)

    const link = await screen.findByRole('link', { name: /API keys and tokens are rotated/ })
    expect(link).toHaveAttribute('href', '/security?tab=checklist')
    expect(link).toHaveTextContent('Blog · Overdue by 4 days')
  })

  it('also flags a site whose certificate is about to expire', async () => {
    respond({
      health: [{ url: 'https://blog.example.com/', online: true, statusCode: 200, latencyMs: 90 }],
      ssl: [{ hostname: 'blog.example.com', status: 'EXPIRING_SOON', daysRemaining: 9 }],
    })
    renderWithQuery(<AttentionWidget />)

    const link = await screen.findByRole('link', { name: /Blog: SSL expires in 9 days/ })
    expect(link).toHaveAttribute('href', '/infrastructure')
  })

  it('says so when nothing needs attention, and mentions items never checked', async () => {
    respond({ items: [item({ id: 'x', done: false, doneAt: null, dueAt: null })] })
    renderWithQuery(<AttentionWidget />)

    expect(await screen.findByText('Nothing needs attention.')).toBeInTheDocument()
    expect(screen.getByText('1 checklist item has not been checked yet.')).toBeInTheDocument()
  })

  it('offers a retry when the checklist cannot be loaded', async () => {
    mocks.fetchApi.mockImplementation((endpoint: string) =>
      endpoint === '/checklist' ? Promise.reject(new ApiError(500, 'boom')) : Promise.resolve([]))
    renderWithQuery(<AttentionWidget />)

    // createQueryOptions retries a plain error once after one second before the error state shows.
    expect(await screen.findByText('Could not load the checklist.', {}, { timeout: 4000 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('announces loading as text for screen readers', () => {
    mocks.fetchApi.mockReturnValue(new Promise(() => {}))
    renderWithQuery(<AttentionWidget />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading items that need attention')
  })

  it('has no axe violations with entries listed', async () => {
    respond({ items: [item({}), item({ id: 'i2', title: 'Domain renewal date is noted', dueAt: inDays(6), repeatDays: null })] })
    const { container } = renderWithQuery(<AttentionWidget />)
    await screen.findByRole('link', { name: /Domain renewal date is noted/ })
    await userEvent.tab()
    await expectNoA11yViolations(container)
  })
})
