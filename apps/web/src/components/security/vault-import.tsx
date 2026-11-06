'use client'

import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { fetchApi } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { IMPORT_LIMITS, parsePasswordCsv, summariseSkipped, type ImportItem, type SkippedRow } from '@/lib/vault-csv'

interface ImportCounts {
  created: number
  restored: number
  skipped: number
}

interface Preview {
  fileName: string
  items: ImportItem[]
  skippedRows: SkippedRow[]
  counts: ImportCounts
}

const FORMAT_PROBLEM = {
  empty: 'The file is empty.',
  unrecognised: 'This does not look like a password export. It needs a password column and a url or name column, as in Chrome, Edge, Firefox, Bitwarden, 1Password, and LastPass exports.',
} as const

function post(items: ImportItem[], dryRun: boolean) {
  return fetchApi<ImportCounts>('/secrets/import', { method: 'POST', body: JSON.stringify({ items, dryRun }) })
}

// Import from a CSV file of a browser or password manager. The file is read here; only rows go to the API,
// first as a dry run for the preview and then for real.
export function VaultImport() {
  const queryClient = useQueryClient()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [preview, setPreview] = React.useState<Preview | null>(null)
  const [error, setError] = React.useState('')
  const [status, setStatus] = React.useState('')
  const [pending, setPending] = React.useState(false)

  const reset = () => {
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const choose = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setPreview(null)
    setError('')
    setStatus('')
    if (!file) return

    setPending(true)
    try {
      const parsed = parsePasswordCsv(await file.text())
      if (parsed.format !== 'recognised') {
        setError(FORMAT_PROBLEM[parsed.format])
        return
      }
      if (parsed.items.length === 0) {
        setError('No rows can be imported from this file.')
        return
      }
      if (parsed.items.length > IMPORT_LIMITS.rows) {
        setError(`The file has ${parsed.items.length} usable rows. At most ${IMPORT_LIMITS.rows} can be imported at once: split the file and import the parts one by one.`)
        return
      }
      const counts = await post(parsed.items, true)
      setPreview({ fileName: file.name, items: parsed.items, skippedRows: parsed.skipped, counts })
    } catch {
      setError('Could not read or check the file. Try again.')
    } finally {
      setPending(false)
    }
  }

  const confirm = async () => {
    if (!preview || pending) return
    setPending(true)
    setError('')
    try {
      const counts = await post(preview.items, false)
      await queryClient.invalidateQueries({ queryKey: queryKeys.secrets })
      await queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs })
      setStatus(`Imported ${counts.created + counts.restored} secrets. ${counts.skipped} were already in the vault. Delete the CSV file now: it holds your passwords in plain text.`)
      reset()
    } catch {
      setError('The import failed. Nothing was changed. Try again.')
    } finally {
      setPending(false)
    }
  }

  const skippedSummary = preview ? summariseSkipped(preview.skippedRows) : []

  return (
    <section className="flex flex-col gap-3" aria-labelledby="vault-import-title">
      <h3 id="vault-import-title" className="text-[13px] font-semibold text-[var(--color-text)]">Import from a password manager</h3>
      <p className="text-[12px] text-[var(--color-text-2)]">
        Export your passwords as CSV from Chrome, Edge, Firefox, Bitwarden, 1Password, or LastPass and choose the file. It is read in this browser; only the rows are sent, encrypted before they are stored. Secrets already in the vault are never overwritten.
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="vault-import-file" className="text-[13px] font-medium text-[var(--color-text)]">CSV file</label>
        <input
          ref={inputRef}
          id="vault-import-file"
          type="file"
          accept=".csv,text/csv"
          disabled={pending}
          onChange={(event) => void choose(event)}
          className="text-[13px] text-[var(--color-text-2)] file:mr-3 file:rounded-md file:border file:border-[var(--color-input-border)] file:bg-[var(--color-surface-2)] file:px-3 file:py-1.5 file:text-[13px] file:text-[var(--color-text)]"
        />
      </div>

      {error && <p role="alert" className="text-[13px] text-[var(--color-danger)]">{error}</p>}
      <p role="status" className="text-[13px] text-[var(--color-text-2)]">{pending && !preview ? 'Checking the file…' : status}</p>

      {preview && (
        <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-3">
          <p className="text-[13px] text-[var(--color-text)]">
            <span className="font-medium">{preview.fileName}</span>: {preview.counts.created + preview.counts.restored} new, {preview.counts.skipped} already in the vault or repeated in the file
            {preview.skippedRows.length > 0 && `, ${preview.skippedRows.length} rows cannot be imported`}.
          </p>
          {skippedSummary.length > 0 && (
            <ul className="list-disc pl-5 text-[12px] text-[var(--color-text-2)]">
              {skippedSummary.map(({ reason, count }) => (
                <li key={reason}>{reason}: {count}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => void confirm()} disabled={pending || preview.counts.created + preview.counts.restored === 0}>
              {pending ? 'Importing…' : `Import ${preview.counts.created + preview.counts.restored}`}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={pending}>Cancel</Button>
          </div>
        </div>
      )}
    </section>
  )
}
