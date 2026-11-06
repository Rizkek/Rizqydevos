'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Edit2, Link2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { fetchApi } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { cn } from '@/lib/utils'
import { describeItem, itemState, progress, type ChecklistItem } from '@/lib/checklist'
import { ChecklistItemForm } from './checklist-item-form'

interface ProjectChecklistProps {
  project: { id: string; name: string }
  items: ChecklistItem[]
  secrets: Array<{ id: string; name: string }>
  now: Date
}

export function ProjectChecklist({ project, items, secrets, now }: ProjectChecklistProps) {
  const queryClient = useQueryClient()
  const [adding, setAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState('')
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.checklist })

  const toggle = useMutation({
    mutationFn: ({ item, done }: { item: ChecklistItem; done: boolean }) =>
      fetchApi(`/checklist/${item.id}`, { method: 'PATCH', body: JSON.stringify({ done }) }),
    onSuccess: invalidate,
    onError: () => setStatus('Could not update the item. Try again.'),
  })
  const remove = useMutation({
    mutationFn: (id: string) => fetchApi(`/checklist/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
    onError: () => setStatus('Could not delete the item. Try again.'),
  })
  const addTemplates = useMutation({
    mutationFn: () => fetchApi<{ created: number }>('/checklist/templates', { method: 'POST', body: JSON.stringify({ projectId: project.id }) }),
    onSuccess: async ({ created }) => {
      setStatus(created === 0 ? 'All recommended items are already in the list.' : `Added ${created} recommended items.`)
      await invalidate()
    },
    onError: () => setStatus('Could not add the recommended items. Try again.'),
  })

  const { inOrder, total } = progress(items, now)

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-text)]">{project.name}</h2>
          <p className="text-[12px] text-[var(--color-text-2)]">{total === 0 ? 'No items yet' : `${inOrder} of ${total} in order`}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={addTemplates.isPending} onClick={() => addTemplates.mutate()}>Add recommended items</Button>
          <Button size="sm" onClick={() => { setAdding(true); setEditingId(null) }}><Plus size={14} aria-hidden="true" /> Add item</Button>
        </div>
      </div>

      <p role="status" className="text-[12px] text-[var(--color-text-2)]">{status}</p>

      {adding && <ChecklistItemForm projectId={project.id} secrets={secrets} onDone={() => setAdding(false)} />}

      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            if (editingId === item.id) {
              return <li key={item.id}><ChecklistItemForm projectId={project.id} item={item} secrets={secrets} onDone={() => setEditingId(null)} /></li>
            }
            const state = itemState(item, now)
            const checked = item.done && state !== 'overdue'
            return (
              <li key={item.id} className="flex items-start gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/50 p-3">
                <button
                  type="button"
                  aria-pressed={checked}
                  aria-label={checked ? `Mark ${item.title} as not checked` : `Mark ${item.title} as checked`}
                  onClick={() => toggle.mutate({ item, done: !checked })}
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                    checked ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-on-solid)]' : 'border-[var(--color-input-border)]',
                  )}
                >
                  {checked && <Check size={12} aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-[var(--color-text)]">{item.title}</p>
                  <p className={cn('text-[12px]', state === 'overdue' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-2)]')}>{describeItem(item, now)}</p>
                  {item.secretName && (
                    <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[var(--color-text-2)]"><Link2 size={12} aria-hidden="true" /> Vault: {item.secretName}</p>
                  )}
                  {item.note && <p className="mt-1 text-[12px] text-[var(--color-text-2)]">{item.note}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" aria-label={`Edit ${item.title}`} onClick={() => { setEditingId(item.id); setAdding(false) }}><Edit2 size={14} aria-hidden="true" /></Button>
                  <Button variant="ghost" size="icon" aria-label={`Delete ${item.title}`} className="hover:text-[var(--color-danger)]" onClick={() => { if (confirm(`Delete ${item.title}?`)) remove.mutate(item.id) }}><Trash2 size={14} aria-hidden="true" /></Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
