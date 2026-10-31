import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithQuery } from '@/test/render'
import { ApiError } from '@/lib/api'
import DeveloperPage from './page'

const mocks = vi.hoisted(() => ({ fetchApi: vi.fn() }))

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  fetchApi: mocks.fetchApi,
}))

const pullRequest = {
  id: 1,
  title: 'Fix login redirect',
  url: 'https://github.com/octo/app/pull/7',
  state: 'open',
  repo: { fullName: 'octo/app', url: 'https://github.com/octo/app' },
  createdAt: '2026-10-14T09:30:00Z',
  updatedAt: '2026-10-14T10:00:00Z',
  author: { login: 'octo' },
}

const repository = {
  id: 2,
  name: 'vault',
  fullName: 'octo/vault',
  description: 'Private notes',
  private: true,
  url: 'https://github.com/octo/vault',
  language: 'TypeScript',
  stargazersCount: 3,
  forksCount: 0,
  updatedAt: '2026-10-14T10:00:00Z',
}

function respond(byEndpoint: Record<string, unknown>) {
  mocks.fetchApi.mockImplementation((endpoint: string) => {
    const value = byEndpoint[endpoint]
    return value instanceof Error ? Promise.reject(value) : Promise.resolve(value ?? [])
  })
}

describe('DeveloperPage', () => {
  beforeEach(() => {
    mocks.fetchApi.mockReset()
  })

  it('no longer offers a Docker tab', () => {
    respond({})
    renderWithQuery(<DeveloperPage />)
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent?.trim())).toEqual(['Activity', 'Pull requests', 'Repositories'])
  })

  it('lists open pull requests with a link to GitHub', async () => {
    respond({ '/integrations/github/prs': [pullRequest] })
    renderWithQuery(<DeveloperPage />)

    await userEvent.click(screen.getByRole('tab', { name: /pull requests/i }))

    const link = await screen.findByRole('link', { name: /fix login redirect/i })
    expect(link).toHaveAttribute('href', 'https://github.com/octo/app/pull/7')
    expect(link).toHaveTextContent('octo/app')
    expect(mocks.fetchApi).toHaveBeenCalledWith('/integrations/github/prs')
  })

  it('marks private repositories with text, not only an icon', async () => {
    respond({ '/integrations/github/repos': [repository] })
    renderWithQuery(<DeveloperPage />)

    await userEvent.click(screen.getByRole('tab', { name: /repositories/i }))

    const link = await screen.findByRole('link', { name: /octo\/vault/i })
    expect(link).toHaveAttribute('href', 'https://github.com/octo/vault')
    expect(link).toHaveTextContent('Private')
    expect(link).toHaveTextContent('TypeScript · 3 stars')
  })

  it('points to Settings when GitHub is not connected', async () => {
    respond({ '/integrations/github/prs': new ApiError(404, 'Not configured', 'INTEGRATION_NOT_CONFIGURED') })
    renderWithQuery(<DeveloperPage />)

    await userEvent.click(screen.getByRole('tab', { name: /pull requests/i }))

    expect(await screen.findByRole('link', { name: /open settings/i })).toHaveAttribute('href', '/settings')
  })
})
