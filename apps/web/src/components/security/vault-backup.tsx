'use client'

import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { PasswordField } from '@/components/ui/text-field'
import { ApiError, fetchApi } from '@/lib/api'
import { queryKeys } from '@/lib/query'

// Must match MIN_PASSPHRASE in apps/api/src/modules/secrets/dto/secret.dto.ts.
const MIN_PASSPHRASE = 12

interface RestoreResult {
  created: number
  restored: number
  skipped: number
}

type RunWithReauth = (action: () => Promise<void>, onError: (error: unknown) => void) => Promise<void>

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.code === 'INVALID_BACKUP' ? error.message : fallback
}

function ExportBackup({ runWithReauth }: { runWithReauth: RunWithReauth }) {
  const [passphrase, setPassphrase] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [revealed, setRevealed] = React.useState(false)
  const [errors, setErrors] = React.useState<{ passphrase?: string; confirm?: string }>({})
  const [status, setStatus] = React.useState('')
  const [pending, setPending] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (pending) return
    const next: typeof errors = {}
    if (passphrase.length < MIN_PASSPHRASE) next.passphrase = `Use at least ${MIN_PASSPHRASE} characters.`
    else if (passphrase !== confirm) next.confirm = 'The two passphrases do not match.'
    setErrors(next)
    if (next.passphrase || next.confirm) return

    setPending(true)
    setStatus('')
    await runWithReauth(async () => {
      const backup = await fetchApi<unknown>('/secrets/backup', { method: 'POST', body: JSON.stringify({ passphrase }) })
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
      Object.assign(document.createElement('a'), { href: url, download: `devos-secrets-${new Date().toISOString().slice(0, 10)}.json` }).click()
      URL.revokeObjectURL(url)
      setPassphrase('')
      setConfirm('')
      setStatus('Backup downloaded. Keep the file and the passphrase in separate places.')
    }, () => setStatus('Could not create the backup. Try again.'))
    setPending(false)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <h3 className="text-[13px] font-semibold text-[var(--color-text)]">Export an encrypted backup</h3>
      <p className="text-[12px] text-[var(--color-text-2)]">
        The file is encrypted with this passphrase, not with the server key, so it can restore the vault anywhere. Without the passphrase it cannot be opened.
      </p>
      <PasswordField label="Passphrase" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} error={errors.passphrase} revealed={revealed} onRevealedChange={setRevealed} autoComplete="new-password" />
      <PasswordField label="Repeat passphrase" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} revealed={revealed} onRevealedChange={setRevealed} autoComplete="new-password" />
      <div className="flex items-center justify-between gap-2">
        <p role="status" className="text-[12px] text-[var(--color-text-2)]">{status}</p>
        <Button type="submit" variant="outline" disabled={pending}>{pending ? 'Exporting…' : 'Export backup'}</Button>
      </div>
    </form>
  )
}

function RestoreBackup({ runWithReauth }: { runWithReauth: RunWithReauth }) {
  const queryClient = useQueryClient()
  const [file, setFile] = React.useState<File | null>(null)
  const [passphrase, setPassphrase] = React.useState('')
  const [error, setError] = React.useState<string | undefined>()
  const [status, setStatus] = React.useState('')
  const [pending, setPending] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (pending) return
    if (!file || !passphrase) {
      setError(!file ? 'Choose a backup file.' : 'Enter the passphrase of this backup.')
      return
    }
    setError(undefined)
    setPending(true)
    setStatus('')

    let backup: unknown
    try {
      backup = JSON.parse(await file.text())
    } catch {
      setPending(false)
      setError('This file is not a DevOS secrets backup.')
      return
    }

    await runWithReauth(async () => {
      const result = await fetchApi<RestoreResult>('/secrets/restore', { method: 'POST', body: JSON.stringify({ passphrase, backup }) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.secrets })
      setPassphrase('')
      setStatus(`Restored: ${result.created} added, ${result.restored} recovered after deletion, ${result.skipped} already in the vault.`)
    }, (err) => setError(messageFor(err, 'Could not restore the backup. Try again.')))
    setPending(false)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <h3 className="text-[13px] font-semibold text-[var(--color-text)]">Restore from a backup</h3>
      <p className="text-[12px] text-[var(--color-text-2)]">Secrets already in the vault are kept as they are; only missing keys are added.</p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="backup-file" className="text-[13px] font-medium text-[var(--color-text)]">Backup file</label>
        <input id="backup-file" type="file" accept=".json,application/json" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-[13px]" />
      </div>
      <PasswordField label="Backup passphrase" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} error={error} autoComplete="off" />
      <div className="flex items-center justify-between gap-2">
        <p role="status" className="text-[12px] text-[var(--color-text-2)]">{status}</p>
        <Button type="submit" variant="outline" disabled={pending}>{pending ? 'Restoring…' : 'Restore'}</Button>
      </div>
    </form>
  )
}

export function VaultBackup({ runWithReauth }: { runWithReauth: RunWithReauth }) {
  return (
    <div className="grid gap-6 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 md:grid-cols-2">
      <ExportBackup runWithReauth={runWithReauth} />
      <RestoreBackup runWithReauth={runWithReauth} />
    </div>
  )
}
