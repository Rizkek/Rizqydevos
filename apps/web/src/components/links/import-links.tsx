'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { fetchApi } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { MAX_IMPORT_ITEMS, parseBookmarkHtml, previewImport, type Bookmark, type ImportPreview } from '@/lib/bookmarks'

interface ImportResult {
  created: number
  skipped: number
}

interface ImportLinksProps {
  existing: Bookmark[]
  onDone: () => void
}

// Browser export file in, preview, then one request per 2000 links (the API limit).
export function ImportLinks({ existing, onDone }: ImportLinksProps) {
  const queryClient = useQueryClient()
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [preview, setPreview] = React.useState<ImportPreview | null>(null)
  const [readError, setReadError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<ImportResult | null>(null)

  const importLinks = useMutation({
    mutationFn: async (items: ImportPreview['newItems']) => {
      const total: ImportResult = { created: 0, skipped: 0 }
      for (let start = 0; start < items.length; start += MAX_IMPORT_ITEMS) {
        const chunk = items.slice(start, start + MAX_IMPORT_ITEMS)
        const res = await fetchApi<ImportResult>('/workspace/bookmarks/import', { method: 'POST', body: JSON.stringify({ items: chunk }) })
        total.created += res.created
        total.skipped += res.skipped
      }
      return total
    },
    onSuccess: async (total) => {
      setResult(total)
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks })
    },
  })

  const readFile = async (file: File) => {
    setFileName(file.name)
    setResult(null)
    setReadError(null)
    try {
      const { items, invalid } = parseBookmarkHtml(await file.text())
      if (items.length === 0 && invalid === 0) {
        setPreview(null)
        setReadError('No links found. Export your bookmarks as an HTML file from the browser and choose that file.')
        return
      }
      setPreview(previewImport(items, invalid, existing))
    } catch {
      setPreview(null)
      setReadError('The file could not be read.')
    }
  }

  return (
    <div className="flex flex-col gap-4 text-[13px] text-[var(--color-text)]">
      <p className="text-[var(--color-text-2)]">
        Export bookmarks from Chrome, Edge, Firefox, or Safari as an HTML file, then choose it here. Folders become tags; links you already saved are skipped.
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bookmark-file" className="font-medium">Bookmark file</label>
        <input
          id="bookmark-file"
          type="file"
          accept=".html,.htm,text/html"
          onChange={(e) => { const file = e.target.files?.[0]; if (file) void readFile(file) }}
          className="text-[13px]"
        />
      </div>

      <div role="status" className="flex flex-col gap-2">
        {readError && <p className="text-[var(--color-danger)]">{readError}</p>}
        {preview && !result && (
          <>
            <p>
              {fileName}: <strong>{preview.newItems.length}</strong> new, {preview.duplicates} already saved, {preview.invalid} skipped (not a web link).
            </p>
            {preview.newItems.length > 0 && (
              <ul className="max-h-48 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border)] p-2 text-[12px] text-[var(--color-text-2)]">
                {preview.newItems.slice(0, 50).map((item) => (
                  <li key={item.url} className="truncate">{item.title} — {item.url}</li>
                ))}
                {preview.newItems.length > 50 && <li>and {preview.newItems.length - 50} more</li>}
              </ul>
            )}
          </>
        )}
        {importLinks.isError && (
          <p className="text-[var(--color-danger)]">Import stopped with an error. Links saved before the error are kept; import the same file again to add the rest.</p>
        )}
        {result && <p>Imported {result.created} links; {result.skipped} were already saved.</p>}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>{result ? 'Close' : 'Cancel'}</Button>
        {!result && (
          <Button
            type="button"
            disabled={!preview || preview.newItems.length === 0 || importLinks.isPending}
            onClick={() => preview && importLinks.mutate(preview.newItems)}
          >
            {importLinks.isPending ? 'Importing…' : `Import ${preview?.newItems.length ?? 0} links`}
          </Button>
        )}
      </div>
    </div>
  )
}
