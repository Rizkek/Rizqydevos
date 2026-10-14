'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError, fetchApi } from '@/lib/api'
import {
  PROVIDER_LABEL,
  describeIntegrationError,
  type IntegrationProvider,
  type IntegrationSummary,
} from '@/lib/integrations'
import { queryKeys } from '@/lib/query'

interface IntegrationCardProps {
  provider: IntegrationProvider
  description: string
  tokenHint: string
  integration: IntegrationSummary | undefined
  withTeamId?: boolean
}

const dataKeys: Record<IntegrationProvider, readonly unknown[]> = {
  github: queryKeys.githubActivity,
  vercel: queryKeys.vercelDeployments,
}

export function IntegrationCard({ provider, description, tokenHint, integration, withTeamId = false }: IntegrationCardProps) {
  const label = PROVIDER_LABEL[provider]
  const queryClient = useQueryClient()
  const baseId = React.useId()
  const tokenId = `${baseId}-token`
  const tokenHelpId = `${baseId}-token-help`
  const tokenErrorId = `${baseId}-token-error`
  const teamId = `${baseId}-team`
  const teamHelpId = `${baseId}-team-help`
  const tokenInput = React.useRef<HTMLInputElement>(null)

  const [token, setToken] = React.useState('')
  const [team, setTeam] = React.useState('')
  const [replacing, setReplacing] = React.useState(false)
  const [fieldError, setFieldError] = React.useState<string>()
  const [formError, setFormError] = React.useState<string>()
  const [status, setStatus] = React.useState<string>()

  const isConnected = integration !== undefined
  const showForm = !isConnected || replacing
  const statusLabel = !isConnected ? 'Not connected' : integration.enabled ? 'Connected' : 'Turned off'

  // Cached widget data holds the old failure (or old account) until it is refetched.
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations }),
      queryClient.invalidateQueries({ queryKey: dataKeys[provider] }),
    ])

  const reportFailure = (error: unknown) => {
    const issue = describeIntegrationError(error, provider)
    const wait = issue.retryAfter !== undefined ? ` Try again in ${Math.max(1, Math.ceil(issue.retryAfter))} seconds.` : ''
    setFormError(`${issue.message}${wait}`)
  }

  const connect = useMutation({
    mutationFn: () =>
      fetchApi<IntegrationSummary>(`/integrations/${provider}`, {
        method: 'POST',
        body: JSON.stringify({
          accessToken: token.trim(),
          ...(withTeamId && team.trim() && { teamId: team.trim() }),
        }),
      }),
    onSuccess: async (summary) => {
      setToken('')
      setTeam('')
      setReplacing(false)
      const login = summary.metadata?.accountLogin
      setStatus(login ? `Connected to ${label} as ${login}.` : `Connected to ${label}.`)
      await refresh()
    },
    onError: (error) => {
      // The typed token stays in the field so the user can correct it instead of retyping.
      if (error instanceof ApiError && error.code === 'INTEGRATION_TOKEN_INVALID') {
        setFieldError(error.message)
        tokenInput.current?.focus()
      } else if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        setFieldError('Check the token and team ID. Spaces and special characters are not allowed in the team ID.')
        tokenInput.current?.focus()
      } else {
        reportFailure(error)
      }
    },
  })

  const toggle = useMutation({
    mutationFn: (enabled: boolean) =>
      fetchApi<IntegrationSummary>(`/integrations/${provider}`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
    onSuccess: async (summary) => {
      setStatus(`${label} turned ${summary.enabled ? 'on' : 'off'}.`)
      await refresh()
    },
    onError: reportFailure,
  })

  const disconnect = useMutation({
    mutationFn: () => fetchApi(`/integrations/${provider}`, { method: 'DELETE' }),
    onSuccess: async () => {
      setStatus(`${label} disconnected.`)
      setReplacing(false)
      await refresh()
    },
    onError: reportFailure,
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (connect.isPending) return

    setFormError(undefined)
    setStatus(undefined)
    if (!token.trim()) {
      setFieldError('Enter a token.')
      tokenInput.current?.focus()
      return
    }
    setFieldError(undefined)
    connect.mutate()
  }

  const clearMessages = () => {
    setFormError(undefined)
    setStatus(undefined)
  }

  const describedBy = fieldError ? `${tokenHelpId} ${tokenErrorId}` : tokenHelpId

  return (
    <section aria-labelledby={`${baseId}-title`} className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 id={`${baseId}-title`} className="text-[13px] font-semibold text-[var(--color-text)]">
            {label}
          </h3>
          <p className="text-[13px] text-[var(--color-text-2)]">{description}</p>
        </div>
        <Badge variant="outline" className="shrink-0">
          {statusLabel}
        </Badge>
      </div>

      {isConnected && (
        <p className="text-[13px] text-[var(--color-text-2)]">
          {integration.metadata.accountLogin ? (
            <>
              Account: <span className="font-medium text-[var(--color-text)]">{integration.metadata.accountLogin}</span>
            </>
          ) : (
            'Account name unknown. Replace the token to refresh it.'
          )}
          {integration.metadata.teamId && <> (team {integration.metadata.teamId})</>}
        </p>
      )}

      {showForm && (
        <form noValidate onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={tokenId} className="text-[13px] font-medium text-[var(--color-text)]">
              {label} access token
            </label>
            <Input
              ref={tokenInput}
              id={tokenId}
              name={`${provider}-token`}
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={token}
              onChange={(event) => {
                setToken(event.target.value)
                setFieldError(undefined)
              }}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={describedBy}
            />
            <p id={tokenHelpId} className="text-[12px] text-[var(--color-text-2)]">
              {tokenHint}
            </p>
            {fieldError && (
              <p id={tokenErrorId} role="alert" className="text-[13px] text-[var(--color-danger)]">
                {fieldError}
              </p>
            )}
          </div>

          {withTeamId && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={teamId} className="text-[13px] font-medium text-[var(--color-text)]">
                Team ID (optional)
              </label>
              <Input
                id={teamId}
                name={`${provider}-team`}
                autoComplete="off"
                spellCheck={false}
                value={team}
                onChange={(event) => setTeam(event.target.value)}
                aria-describedby={teamHelpId}
              />
              <p id={teamHelpId} className="text-[12px] text-[var(--color-text-2)]">
                Only for team projects. It looks like team_abc123.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" aria-disabled={connect.isPending}>
              {connect.isPending ? 'Connecting…' : isConnected ? 'Save new token' : 'Connect'}
            </Button>
            {replacing && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReplacing(false)
                  setToken('')
                  setTeam('')
                  setFieldError(undefined)
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}

      {isConnected && !replacing && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-disabled={toggle.isPending}
            onClick={() => {
              if (toggle.isPending) return
              clearMessages()
              toggle.mutate(!integration.enabled)
            }}
          >
            {integration.enabled ? 'Turn off' : 'Turn on'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              clearMessages()
              setReplacing(true)
            }}
          >
            Replace token
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-disabled={disconnect.isPending}
            onClick={() => {
              if (disconnect.isPending) return
              clearMessages()
              disconnect.mutate()
            }}
          >
            Disconnect
          </Button>
        </div>
      )}

      <p role="status" className="min-h-[1.25rem] text-[13px] text-[var(--color-text-2)]">
        {status}
      </p>
      {formError && (
        <p role="alert" className="text-[13px] text-[var(--color-danger)]">
          {formError}
        </p>
      )}
    </section>
  )
}
