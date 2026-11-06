import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithQuery } from '@/test/render'
import { expectNoA11yViolations } from '@/test/axe'
import SecurityPage from '@/app/(app)/security/page'

const mocks = vi.hoisted(() => ({ fetchApi: vi.fn(), search: 'tab=checklist' }))

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(mocks.search) }))
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  fetchApi: mocks.fetchApi,
}))
vi.mock('@/lib/auth-client', () => ({ signIn: { email: vi.fn() }, useSession: () => ({ data: { user: { email: 'owner@example.com' } } }) }))

const DAY = 24 * 60 * 60 * 1000
const inDays = (days: number) => new Date(Date.now() + days * DAY).toISOString()

const item = (overrides: Record<string, unknown>) => ({
  id: 'i1', title: 'API keys and tokens are rotated', note: null, done: false, doneAt: null, dueAt: null, repeatDays: 90,
  projectId: 'p1', projectName: 'Blog', secretId: null, secretName: null, ...overrides,
})

function respond({ projects = [{ id: 'p1', name: 'Blog', status: 'ACTIVE' }], items = [] as unknown[] } = {}) {
  mocks.fetchApi.mockImplementation((endpoint: string, options?: RequestInit) => {
    if (endpoint === '/projects') return Promise.resolve(projects)
    if (endpoint === '/checklist' && !options?.method) return Promise.resolve(items)
    if (endpoint === '/secrets') return Promise.resolve([{ id: 's1', name: 'GitHub token', key: 'GITHUB_TOKEN', category: 'api-key' }])
    if (endpoint === '/audit-log') return Promise.resolve([])
    if (endpoint === '/checklist/templates') return Promise.resolve({ created: 6 })
    return Promise.resolve({})
  })
}

const calls = (endpoint: string) => mocks.fetchApi.mock.calls.filter(([url, options]) => url === endpoint && (options as RequestInit | undefined)?.method)
const body = (call: unknown[]) => JSON.parse(String((call[1] as RequestInit).body))

describe('Security checklist', () => {
  beforeEach(() => {
    mocks.fetchApi.mockReset()
    mocks.search = 'tab=checklist'
  })

  it('opens on the checklist tab when the link says so, and shows progress per project', async () => {
    respond({ items: [item({ id: 'a', done: true, dueAt: inDays(60) }), item({ id: 'b', title: 'Domain renewal date is noted', repeatDays: null })] })
    renderWithQuery(<SecurityPage />)

    expect(await screen.findByRole('heading', { name: 'Blog' })).toBeInTheDocument()
    expect(screen.getByText('1 of 2 in order')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Checklist' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('says in words when an item is overdue, and lets it be checked again', async () => {
    respond({ items: [item({ done: true, doneAt: inDays(-100), dueAt: inDays(-3) })] })
    renderWithQuery(<SecurityPage />)

    expect(await screen.findByText(/Overdue by 3 days/)).toBeInTheDocument()
    expect(screen.getByText('Blog')).toBeInTheDocument()
    expect(screen.getByText('0 of 1 in order')).toBeInTheDocument()

    const check = screen.getByRole('button', { name: 'Mark API keys and tokens are rotated as checked' })
    expect(check).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(check)
    await waitFor(() => expect(calls('/checklist/i1')).toHaveLength(1))
    expect(body(calls('/checklist/i1')[0]!)).toEqual({ done: true })
  })

  it('unchecks an item that is checked and in order', async () => {
    respond({ items: [item({ done: true, doneAt: inDays(-1), dueAt: inDays(89) })] })
    renderWithQuery(<SecurityPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Mark API keys and tokens are rotated as not checked' }))
    await waitFor(() => expect(calls('/checklist/i1')).toHaveLength(1))
    expect(body(calls('/checklist/i1')[0]!)).toEqual({ done: false })
  })

  it('adds the recommended items and reports how many were new', async () => {
    respond()
    renderWithQuery(<SecurityPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Add recommended items' }))
    expect(await screen.findByText('Added 6 recommended items.')).toBeInTheDocument()
    expect(body(calls('/checklist/templates')[0]!)).toEqual({ projectId: 'p1' })
  })

  it('validates the form before sending and links a secret from the vault', async () => {
    respond()
    renderWithQuery(<SecurityPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Add item' }))
    const form = screen.getByRole('textbox', { name: 'Title' }).closest('form')!
    await userEvent.click(within(form).getByRole('button', { name: 'Add item' }))
    expect(await screen.findByText('Enter a title.')).toBeInTheDocument()
    expect(calls('/checklist')).toHaveLength(0)

    await userEvent.type(within(form).getByLabelText('Title'), 'Rotate the GitHub token')
    await userEvent.type(within(form).getByLabelText('Check again every (days)'), '0')
    await userEvent.click(within(form).getByRole('button', { name: 'Add item' }))
    expect(await within(form).findByText(/from 1 to 3650/)).toBeInTheDocument()

    await userEvent.clear(within(form).getByLabelText('Check again every (days)'))
    await userEvent.type(within(form).getByLabelText('Check again every (days)'), '90')
    await userEvent.selectOptions(within(form).getByLabelText('Linked secret'), 's1')
    await userEvent.click(within(form).getByRole('button', { name: 'Add item' }))

    await waitFor(() => expect(calls('/checklist')).toHaveLength(1))
    expect(body(calls('/checklist')[0]!)).toEqual({ projectId: 'p1', title: 'Rotate the GitHub token', repeatDays: 90, secretId: 's1' })
  })

  it('explains that projects come first when there are none', async () => {
    respond({ projects: [] })
    renderWithQuery(<SecurityPage />)
    expect(await screen.findByText('No projects yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Projects' })).toHaveAttribute('href', '/projects')
  })

  it('has no axe violations with items and the add form open', async () => {
    respond({ items: [item({ done: true, dueAt: inDays(-3), secretId: 's1', secretName: 'GitHub token' })] })
    const { container } = renderWithQuery(<SecurityPage />)
    await screen.findByRole('heading', { name: 'Blog' })
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }))
    await expectNoA11yViolations(container)
  })
})
