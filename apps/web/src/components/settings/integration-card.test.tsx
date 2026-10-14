import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithQuery } from '@/test/render'
import { ApiError } from '@/lib/api'
import type { IntegrationSummary } from '@/lib/integrations'
import { IntegrationCard } from './integration-card'

const mocks = vi.hoisted(() => ({ fetchApi: vi.fn() }))

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  fetchApi: mocks.fetchApi,
}))

const connected = (overrides: Partial<IntegrationSummary> = {}): IntegrationSummary => ({
  id: 'i1',
  provider: 'github',
  enabled: true,
  metadata: { accountLogin: 'octo' },
  updatedAt: '2026-10-14T00:00:00.000Z',
  ...overrides,
})

const github = (integration?: IntegrationSummary) => (
  <IntegrationCard provider="github" description="Activity feed." tokenHint="Hint text." integration={integration} />
)

describe('IntegrationCard', () => {
  beforeEach(() => {
    mocks.fetchApi.mockReset()
  })

  describe('not connected', () => {
    it('shows a labelled token field and the status as text', () => {
      renderWithQuery(github())
      expect(screen.getByLabelText('GitHub access token')).toHaveAttribute('type', 'password')
      expect(screen.getByText('Not connected')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Disconnect' })).not.toBeInTheDocument()
    })

    it('describes the field with its hint', () => {
      renderWithQuery(github())
      expect(screen.getByLabelText('GitHub access token')).toHaveAccessibleDescription('Hint text.')
    })

    it('rejects an empty token locally, flags the field and moves focus to it', async () => {
      const user = userEvent.setup()
      renderWithQuery(github())

      await user.click(screen.getByRole('button', { name: 'Connect' }))

      const input = screen.getByLabelText('GitHub access token')
      expect(screen.getByRole('alert')).toHaveTextContent('Enter a token.')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAccessibleDescription(/Enter a token\./)
      expect(input).toHaveFocus()
      expect(mocks.fetchApi).not.toHaveBeenCalled()
    })

    it('sends the trimmed token, then clears it and announces who was connected', async () => {
      mocks.fetchApi.mockResolvedValue(connected())
      const user = userEvent.setup()
      const { queryClient } = renderWithQuery(github())
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

      await user.type(screen.getByLabelText('GitHub access token'), '  tok  ')
      await user.click(screen.getByRole('button', { name: 'Connect' }))

      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Connected to GitHub as octo.'))
      expect(mocks.fetchApi).toHaveBeenCalledWith('/integrations/github', {
        method: 'POST',
        body: JSON.stringify({ accessToken: 'tok' }),
      })
      expect(screen.getByLabelText('GitHub access token')).toHaveValue('')
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['integrations'] })
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['github-activity'] })
    })

    it('shows a refused token on the field, keeps what was typed and refocuses', async () => {
      mocks.fetchApi.mockRejectedValue(new ApiError(422, 'GitHub did not accept this token.', 'INTEGRATION_TOKEN_INVALID'))
      const user = userEvent.setup()
      renderWithQuery(github())

      const input = screen.getByLabelText('GitHub access token')
      await user.type(input, 'bad-token')
      await user.click(screen.getByRole('button', { name: 'Connect' }))

      await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('GitHub did not accept this token.'))
      expect(input).toHaveValue('bad-token')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAccessibleDescription(/did not accept/)
      expect(input).toHaveFocus()
    })

    it('clears the field error as soon as the user edits the token', async () => {
      mocks.fetchApi.mockRejectedValue(new ApiError(422, 'GitHub did not accept this token.', 'INTEGRATION_TOKEN_INVALID'))
      const user = userEvent.setup()
      renderWithQuery(github())

      await user.type(screen.getByLabelText('GitHub access token'), 'bad')
      await user.click(screen.getByRole('button', { name: 'Connect' }))
      await screen.findByRole('alert')
      await user.type(screen.getByLabelText('GitHub access token'), 'x')

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('reports a rate limit with the wait time and keeps the token', async () => {
      mocks.fetchApi.mockRejectedValue(new ApiError(429, 'x', 'RATE_LIMITED', 30))
      const user = userEvent.setup()
      renderWithQuery(github())

      await user.type(screen.getByLabelText('GitHub access token'), 'tok')
      await user.click(screen.getByRole('button', { name: 'Connect' }))

      await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('GitHub rate limit reached. Try again in 30 seconds.'))
      expect(screen.getByLabelText('GitHub access token')).toHaveValue('tok')
      expect(screen.getByLabelText('GitHub access token')).not.toHaveAttribute('aria-invalid')
    })

    it('submits only once when the button is pressed repeatedly', async () => {
      let resolve: (value: IntegrationSummary) => void = () => {}
      mocks.fetchApi.mockReturnValue(new Promise<IntegrationSummary>((r) => (resolve = r)))
      const user = userEvent.setup()
      renderWithQuery(github())

      await user.type(screen.getByLabelText('GitHub access token'), 'tok')
      const button = screen.getByRole('button', { name: 'Connect' })
      await user.click(button)
      await user.click(screen.getByRole('button', { name: 'Connecting…' }))
      await user.click(screen.getByRole('button', { name: 'Connecting…' }))

      expect(mocks.fetchApi).toHaveBeenCalledTimes(1)
      resolve(connected())
      await waitFor(() => expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument())
    })

    it('asks for a team ID only for Vercel and sends it', async () => {
      mocks.fetchApi.mockResolvedValue(connected({ provider: 'vercel', metadata: { accountLogin: 'octo', teamId: 'team_1' } }))
      const user = userEvent.setup()
      const { unmount } = renderWithQuery(github())
      expect(screen.queryByLabelText('Team ID (optional)')).not.toBeInTheDocument()
      unmount()

      renderWithQuery(<IntegrationCard provider="vercel" description="d" tokenHint="h" integration={undefined} withTeamId />)
      await user.type(screen.getByLabelText('Vercel access token'), 'tok')
      await user.type(screen.getByLabelText('Team ID (optional)'), ' team_1 ')
      await user.click(screen.getByRole('button', { name: 'Connect' }))

      await waitFor(() => expect(mocks.fetchApi).toHaveBeenCalled())
      expect(mocks.fetchApi).toHaveBeenCalledWith('/integrations/vercel', {
        method: 'POST',
        body: JSON.stringify({ accessToken: 'tok', teamId: 'team_1' }),
      })
    })

    it('points a server validation error at the field', async () => {
      mocks.fetchApi.mockRejectedValue(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR'))
      const user = userEvent.setup()
      renderWithQuery(<IntegrationCard provider="vercel" description="d" tokenHint="h" integration={undefined} withTeamId />)

      await user.type(screen.getByLabelText('Vercel access token'), 'tok')
      await user.type(screen.getByLabelText('Team ID (optional)'), 'bad id!')
      await user.click(screen.getByRole('button', { name: 'Connect' }))

      await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Check the token and team ID/))
      expect(screen.getByLabelText('Vercel access token')).toHaveFocus()
    })
  })

  describe('connected', () => {
    it('shows the account and no token field', () => {
      renderWithQuery(github(connected()))
      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByText('octo')).toBeInTheDocument()
      expect(screen.queryByLabelText('GitHub access token')).not.toBeInTheDocument()
    })

    it('shows the team for Vercel', () => {
      renderWithQuery(
        <IntegrationCard
          provider="vercel"
          description="d"
          tokenHint="h"
          integration={connected({ provider: 'vercel', metadata: { accountLogin: 'octo', teamId: 'team_1' } })}
          withTeamId
        />,
      )
      expect(screen.getByText(/team team_1/)).toBeInTheDocument()
    })

    it('tells the user when the account name is unknown (connected before verification existed)', () => {
      renderWithQuery(github(connected({ metadata: {} })))
      expect(screen.getByText(/Account name unknown/)).toBeInTheDocument()
    })

    it('turns the integration off and announces it', async () => {
      mocks.fetchApi.mockResolvedValue(connected({ enabled: false }))
      const user = userEvent.setup()
      renderWithQuery(github(connected()))

      await user.click(screen.getByRole('button', { name: 'Turn off' }))

      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('GitHub turned off.'))
      expect(mocks.fetchApi).toHaveBeenCalledWith('/integrations/github', { method: 'PATCH', body: JSON.stringify({ enabled: false }) })
    })

    it('labels a disabled integration in text and offers to turn it on', async () => {
      mocks.fetchApi.mockResolvedValue(connected())
      const user = userEvent.setup()
      renderWithQuery(github(connected({ enabled: false })))

      expect(screen.getByText('Turned off')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Turn on' }))
      expect(mocks.fetchApi).toHaveBeenCalledWith('/integrations/github', { method: 'PATCH', body: JSON.stringify({ enabled: true }) })
    })

    it('disconnects and announces it', async () => {
      mocks.fetchApi.mockResolvedValue({})
      const user = userEvent.setup()
      renderWithQuery(github(connected()))

      await user.click(screen.getByRole('button', { name: 'Disconnect' }))

      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('GitHub disconnected.'))
      expect(mocks.fetchApi).toHaveBeenCalledWith('/integrations/github', { method: 'DELETE' })
    })

    it('replaces the token through the same form and can be cancelled', async () => {
      const user = userEvent.setup()
      renderWithQuery(github(connected()))

      await user.click(screen.getByRole('button', { name: 'Replace token' }))
      expect(screen.getByLabelText('GitHub access token')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save new token' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(screen.queryByLabelText('GitHub access token')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Turn off' })).toBeInTheDocument()
    })

    it('shows a failed action as an alert', async () => {
      mocks.fetchApi.mockRejectedValue(new ApiError(502, 'x', 'UPSTREAM_UNAVAILABLE'))
      const user = userEvent.setup()
      renderWithQuery(github(connected()))

      await user.click(screen.getByRole('button', { name: 'Disconnect' }))

      await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('GitHub is not responding.'))
    })
  })
})
