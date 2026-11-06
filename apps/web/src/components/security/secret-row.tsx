'use client'

import * as React from 'react'
import { Copy, Eye, EyeOff, Key, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchApi } from '@/lib/api'

export type Secret = {
  id: string
  name: string
  key: string
  username?: string
  url?: string | null
  tags?: string[]
  category: string | null
}

// A revealed value disappears from the screen, and a copied one from the clipboard, after this long.
export const VISIBLE_MS = 30_000

const CATEGORY_COLORS: Record<string, string> = {
  'password': 'text-[var(--color-text)] bg-[var(--color-surface-3)] border-[var(--color-border-strong)]',
  'api-key': 'text-[var(--color-accent)] bg-[var(--color-accent-muted)] border-[var(--color-accent)]/30',
  'oauth': 'text-[var(--color-info)] bg-[var(--color-info-muted)] border-[var(--color-info)]/30',
  'database': 'text-[var(--color-success)] bg-[var(--color-success-muted)] border-[var(--color-success)]/30',
  'ssh': 'text-[var(--color-warning)] bg-[var(--color-warning-muted)] border-[var(--color-warning)]/30',
}

// Only http and https addresses become links: a stored value like javascript:... must stay text.
function isWebAddress(value: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

interface SecretRowProps {
  secret: Secret
  onDelete: (id: string) => void
  runWithReauth: (action: () => Promise<void>, onError: (error: unknown) => void) => Promise<void>
}

export function SecretRow({ secret, onDelete, runWithReauth }: SecretRowProps) {
  const [value, setValue] = React.useState<string | null>(null)
  const [revealing, setRevealing] = React.useState(false)
  const [status, setStatus] = React.useState('')
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const clipboardTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (clipboardTimer.current) clearTimeout(clipboardTimer.current)
  }, [])

  const hide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setValue(null)
  }

  const reveal = async () => {
    if (value !== null) {
      hide()
      return
    }
    setRevealing(true)
    setStatus('')
    await runWithReauth(async () => {
      const data = await fetchApi<{ value: string }>(`/secrets/${secret.id}/reveal`)
      setValue(data.value)
      hideTimer.current = setTimeout(() => setValue(null), VISIBLE_MS)
    }, () => setStatus('Could not reveal the value. Try again.'))
    setRevealing(false)
  }

  const copy = async () => {
    if (value === null) return
    try {
      await navigator.clipboard.writeText(value)
      setStatus('Copied. The clipboard is cleared in 30 seconds.')
      if (clipboardTimer.current) clearTimeout(clipboardTimer.current)
      // Overwrites whatever is on the clipboard by then; reading it first would need a browser permission.
      clipboardTimer.current = setTimeout(() => { void navigator.clipboard.writeText('').catch(() => undefined) }, VISIBLE_MS)
    } catch {
      setStatus('Copy failed. Select the value and copy it manually.')
    }
  }

  const categoryClass = (secret.category && CATEGORY_COLORS[secret.category]) || 'text-[var(--color-text-2)] bg-[var(--color-surface-3)] border-[var(--color-border)]'

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/50 p-3 transition-colors hover:border-[var(--color-border)]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-3)]">
        <Key size={14} aria-hidden="true" className="text-[var(--color-text-2)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-[var(--color-text)]">{secret.name}</span>
          {secret.category && <span className={`rounded border px-1.5 py-0.5 font-mono text-[12px] ${categoryClass}`}>{secret.category}</span>}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
          <code className="font-mono text-[12px] text-[var(--color-text-muted)]">{secret.key}</code>
          {secret.username && (
            <>
              <span aria-hidden="true" className="text-[var(--color-border-strong)]">·</span>
              <span className="text-[12px] text-[var(--color-text-2)]">{secret.username}</span>
            </>
          )}
          <span aria-hidden="true" className="text-[var(--color-border-strong)]">·</span>
          <code className="break-all font-mono text-[12px] tracking-widest text-[var(--color-text-muted)]">{value ?? '••••••••••••'}</code>
        </div>
        {(secret.url || (secret.tags && secret.tags.length > 0)) && (
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-[var(--color-text-2)]">
            {secret.url && (isWebAddress(secret.url)
              ? <a href={secret.url} target="_blank" rel="noopener noreferrer" className="break-all text-[var(--color-accent-text)] underline-offset-2 hover:underline">{secret.url}</a>
              : <span className="break-all">{secret.url}</span>)}
            {secret.tags?.map((tag) => <span key={tag} className="rounded border border-[var(--color-border)] px-1.5">{tag}</span>)}
          </p>
        )}
        <p role="status" className="text-[12px] text-[var(--color-text-2)]">{status}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        {value !== null && (
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Copy value of ${secret.name}`} onClick={() => void copy()}>
            <Copy aria-hidden="true" size={13} />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={value !== null ? `Hide value of ${secret.name}` : `Reveal value of ${secret.name}`}
          aria-busy={revealing}
          onClick={() => void reveal()}
          disabled={revealing}
        >
          {value !== null ? <EyeOff aria-hidden="true" size={13} /> : <Eye aria-hidden="true" size={13} />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)]" aria-label={`Delete ${secret.name}`} onClick={() => onDelete(secret.id)}>
          <Trash2 aria-hidden="true" size={13} />
        </Button>
      </div>
    </div>
  )
}
