import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithQuery } from '@/test/render'
import { expectNoA11yViolations } from '@/test/axe'
import { LinksLibrary } from './links-library'

const mocks = vi.hoisted(() => ({ fetchApi: vi.fn() }))

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  fetchApi: mocks.fetchApi,
}))

const saved = [
  { id: '1', title: 'Next.js docs', url: 'https://nextjs.org/docs', tags: ['dev'], pinned: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: '2', title: 'Pasta recipe', url: 'https://food.example.com/pasta', tags: ['read-later'], pinned: false, createdAt: '2026-01-02T00:00:00.000Z' },
]

function respond(bookmarks: unknown[]) {
  mocks.fetchApi.mockImplementation((endpoint: string, options?: RequestInit) => {
    if (endpoint === '/workspace/bookmarks/all') return Promise.resolve(bookmarks)
    if (endpoint === '/workspace/bookmarks/import') {
      const { items } = JSON.parse(String(options?.body)) as { items: unknown[] }
      return Promise.resolve({ created: items.length, skipped: 0 })
    }
    return Promise.resolve({ id: 'new', ...JSON.parse(String(options?.body ?? '{}')) })
  })
}

const calls = (endpoint: string) => mocks.fetchApi.mock.calls.filter(([url]) => url === endpoint)

describe('LinksLibrary', () => {
  beforeEach(() => {
    mocks.fetchApi.mockReset()
  })

  it('lists links and filters them by tag and by search', async () => {
    respond(saved)
    renderWithQuery(<LinksLibrary />)

    expect(await screen.findByRole('link', { name: /next\.js docs/i })).toHaveAttribute('href', 'https://nextjs.org/docs')
    await userEvent.click(screen.getByRole('button', { name: 'read-later' }))
    expect(screen.queryByRole('link', { name: /next\.js docs/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /pasta recipe/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'All' }))
    await userEvent.type(screen.getByRole('textbox', { name: /search links/i }), 'nextjs')
    expect(screen.getByRole('link', { name: /next\.js docs/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /pasta recipe/i })).not.toBeInTheDocument()
  })

  it('shows an empty state that explains how to add links', async () => {
    respond([])
    renderWithQuery(<LinksLibrary />)
    expect(await screen.findByText('No links yet')).toBeInTheDocument()
  })

  it('rejects a URL that is not a web address, then saves a typed domain as https', async () => {
    respond(saved)
    renderWithQuery(<LinksLibrary />)
    await screen.findByRole('link', { name: /next\.js docs/i })

    await userEvent.click(screen.getByRole('button', { name: /add link/i }))
    const dialog = await screen.findByRole('dialog')
    const urlField = within(dialog).getByLabelText('URL')

    await userEvent.type(urlField, 'javascript:alert(1)')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save link' }))
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/web address/i)
    expect(calls('/workspace/bookmarks')).toHaveLength(0)

    await userEvent.clear(urlField)
    await userEvent.type(urlField, 'example.com/article')
    await userEvent.click(within(dialog).getByLabelText('Read later'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save link' }))

    await waitFor(() => expect(calls('/workspace/bookmarks')).toHaveLength(1))
    const body = JSON.parse(String((calls('/workspace/bookmarks')[0]![1] as RequestInit).body))
    expect(body).toMatchObject({ url: 'https://example.com/article', title: 'example.com', tags: ['read-later'], pinned: false })
  })

  it('previews an imported file, skips links already saved, and imports the rest', async () => {
    respond(saved)
    renderWithQuery(<LinksLibrary />)
    await screen.findByRole('link', { name: /next\.js docs/i })

    await userEvent.click(screen.getByRole('button', { name: /^import$/i }))
    const dialog = await screen.findByRole('dialog')
    const file = new File(
      ['<DL><DT><A HREF="https://nextjs.org/docs/">dup</A><DT><A HREF="https://new.example.com">New one</A><DT><A HREF="chrome://x">bad</A></DL>'],
      'bookmarks.html',
      { type: 'text/html' },
    )
    await userEvent.upload(within(dialog).getByLabelText('Bookmark file'), file)

    expect(await within(dialog).findByText(/1 already saved, 1 skipped/)).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Import 1 links' }))

    expect(await within(dialog).findByText('Imported 1 links; 0 were already saved.')).toBeInTheDocument()
    const body = JSON.parse(String((calls('/workspace/bookmarks/import')[0]![1] as RequestInit).body))
    expect(body.items).toEqual([{ title: 'New one', url: 'https://new.example.com/', tags: [] }])
  })

  it('has no axe violations in the list and in the add form', async () => {
    respond(saved)
    const { container } = renderWithQuery(<LinksLibrary />)
    await screen.findByRole('link', { name: /next\.js docs/i })
    await expectNoA11yViolations(container)

    await userEvent.click(screen.getByRole('button', { name: /add link/i }))
    await expectNoA11yViolations(await screen.findByRole('dialog'))
  })

  it('toggles pin with a pressed state for assistive technology', async () => {
    respond(saved)
    renderWithQuery(<LinksLibrary />)
    const pin = await screen.findByRole('button', { name: 'Unpin Next.js docs' })
    expect(pin).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(pin)
    await waitFor(() => expect(calls('/workspace/bookmarks/1')).toHaveLength(1))
    expect(JSON.parse(String((calls('/workspace/bookmarks/1')[0]![1] as RequestInit).body))).toEqual({ pinned: false })
  })
})
