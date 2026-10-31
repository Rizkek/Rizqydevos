import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { renderWithQuery } from '@/test/render'
import { QuickNotesWidget } from './quick-notes-widget'

const mocks = vi.hoisted(() => ({ fetchApi: vi.fn() }))

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  fetchApi: mocks.fetchApi,
}))

const scratchpad = { id: 'n1', title: 'Scratchpad', content: 'saved text' }

function respond(notes: unknown[]) {
  mocks.fetchApi.mockImplementation((endpoint: string, options?: RequestInit) => {
    if (endpoint === '/workspace/notes' && !options?.method) return Promise.resolve(notes)
    return Promise.resolve({ ...scratchpad, content: JSON.parse(String(options?.body ?? '{}')).content })
  })
}

const savesTo = (endpoint: string) =>
  mocks.fetchApi.mock.calls.filter(([url, options]) => url === endpoint && (options as RequestInit | undefined)?.method)

describe('QuickNotesWidget', () => {
  beforeEach(() => {
    mocks.fetchApi.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the saved scratchpad note', async () => {
    respond([scratchpad])
    renderWithQuery(<QuickNotesWidget />)
    expect(await screen.findByDisplayValue('saved text')).toBeInTheDocument()
  })

  it('saves once, after the user stops typing for a second', async () => {
    respond([scratchpad])
    renderWithQuery(<QuickNotesWidget />)
    const textarea = await screen.findByDisplayValue('saved text')
    vi.useFakeTimers()

    fireEvent.change(textarea, { target: { value: 'saved text!' } })
    act(() => { vi.advanceTimersByTime(500) })
    fireEvent.change(textarea, { target: { value: 'saved text!!' } })
    expect(textarea).toHaveValue('saved text!!')
    expect(savesTo('/workspace/notes/n1')).toHaveLength(0)

    await act(async () => { vi.advanceTimersByTime(1_000) })

    const saves = savesTo('/workspace/notes/n1')
    expect(saves).toHaveLength(1)
    expect(saves[0]?.[1]).toMatchObject({ method: 'PATCH', body: JSON.stringify({ content: 'saved text!!' }) })
  })

  it('does not save when the text ends up unchanged', async () => {
    respond([scratchpad])
    renderWithQuery(<QuickNotesWidget />)
    const textarea = await screen.findByDisplayValue('saved text')
    vi.useFakeTimers()

    fireEvent.change(textarea, { target: { value: 'saved text?' } })
    fireEvent.change(textarea, { target: { value: 'saved text' } })
    await act(async () => { vi.advanceTimersByTime(1_500) })

    expect(savesTo('/workspace/notes/n1')).toHaveLength(0)
  })

  it('creates the scratchpad note when none exists yet', async () => {
    respond([])
    renderWithQuery(<QuickNotesWidget />)
    const textarea = await screen.findByRole('textbox')
    vi.useFakeTimers()

    fireEvent.change(textarea, { target: { value: 'first note' } })
    await act(async () => { vi.advanceTimersByTime(1_000) })

    expect(savesTo('/workspace/notes')[0]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ title: 'Scratchpad', content: 'first note' }),
    })
  })
})
