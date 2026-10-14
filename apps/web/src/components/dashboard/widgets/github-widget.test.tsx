import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithQuery } from '@/test/render'
import { ApiError } from '@/lib/api'
import { GithubWidget } from './github-widget'

const mocks = vi.hoisted(() => ({ fetchApi: vi.fn() }))

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  fetchApi: mocks.fetchApi,
}))

const config = { id: '4', type: 'github', enabled: true, order: 3 } as const

const event = (id: string, type = 'PushEvent') => ({
  id,
  type,
  actor: { login: 'octo', avatarUrl: 'https://example.test/a.png' },
  repo: { name: `octo/repo-${id}`, url: `https://github.com/octo/repo-${id}` },
  createdAt: '2026-10-14T09:30:00Z',
})

describe('GithubWidget', () => {
  beforeEach(() => {
    mocks.fetchApi.mockReset()
  })

  it('announces loading as text for screen readers', () => {
    mocks.fetchApi.mockReturnValue(new Promise(() => {}))
    renderWithQuery(<GithubWidget config={config} />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading GitHub activity')
  })

  it('lists at most five events as a list with times', async () => {
    mocks.fetchApi.mockResolvedValue(Array.from({ length: 7 }, (_, i) => event(String(i + 1))))
    renderWithQuery(<GithubWidget config={config} />)

    expect(await screen.findAllByRole('listitem')).toHaveLength(5)
    expect(screen.getByText('repo-1')).toBeInTheDocument()
    expect(screen.queryByText('repo-6')).not.toBeInTheDocument()
    expect(screen.getAllByText('Push')).toHaveLength(5)
    expect(document.querySelector('time')).toHaveAttribute('datetime', '2026-10-14T09:30:00Z')
  })

  it('links to the account profile with a descriptive name', async () => {
    mocks.fetchApi.mockResolvedValue([event('1')])
    renderWithQuery(<GithubWidget config={config} />)

    const link = await screen.findByRole('link', { name: /open octo on github/i })
    expect(link).toHaveAttribute('href', 'https://github.com/octo')
  })

  it('shows an empty state without a profile link', async () => {
    mocks.fetchApi.mockResolvedValue([])
    renderWithQuery(<GithubWidget config={config} />)

    expect(await screen.findByText('No recent activity.')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('sends a user who has not connected GitHub to Settings', async () => {
    mocks.fetchApi.mockRejectedValue(new ApiError(404, 'x', 'INTEGRATION_NOT_CONFIGURED'))
    renderWithQuery(<GithubWidget config={config} />)

    expect(await screen.findByText('GitHub is not connected.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Settings' })).toHaveAttribute('href', '/settings')
    expect(mocks.fetchApi).toHaveBeenCalledTimes(1)
  })

  it('says the saved token was rejected instead of "not configured"', async () => {
    mocks.fetchApi.mockRejectedValue(new ApiError(424, 'x', 'TOKEN_REJECTED'))
    renderWithQuery(<GithubWidget config={config} />)

    expect(await screen.findByText(/rejected the saved token/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Settings' })).toBeInTheDocument()
  })

  it('shows the rate limit wait and lets the user retry', async () => {
    mocks.fetchApi.mockRejectedValueOnce(new ApiError(429, 'x', 'RATE_LIMITED', 30)).mockResolvedValueOnce([event('1')])
    const user = userEvent.setup()
    renderWithQuery(<GithubWidget config={config} />)

    expect(await screen.findByText('GitHub rate limit reached.')).toBeInTheDocument()
    expect(screen.getByText('Try again in 30 seconds.')).toBeInTheDocument()
    expect(mocks.fetchApi).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('repo-1')).toBeInTheDocument()
    expect(mocks.fetchApi).toHaveBeenCalledTimes(2)
  })

  it('reports an unreachable GitHub with a retry button', async () => {
    mocks.fetchApi.mockRejectedValue(new ApiError(502, 'x', 'UPSTREAM_UNAVAILABLE'))
    renderWithQuery(<GithubWidget config={config} />)

    await waitFor(() => expect(screen.getByText('GitHub is not responding.')).toBeInTheDocument(), { timeout: 4000 })
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
