'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/text-field'
import { Textarea } from '@/components/ui/textarea'
import { fetchApi } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { dateInputToIso, isoToDateInput, type ChecklistItem } from '@/lib/checklist'

// Must match CHECKLIST_LIMITS in apps/api/src/modules/checklist/dto/checklist.dto.ts.
const MAX_REPEAT_DAYS = 3650

interface ChecklistItemFormProps {
  projectId: string
  item?: ChecklistItem
  secrets: Array<{ id: string; name: string }>
  onDone: () => void
}

interface FieldErrors {
  title?: string
  dueAt?: string
  repeatDays?: string
  form?: string
}

export function ChecklistItemForm({ projectId, item, secrets, onDone }: ChecklistItemFormProps) {
  const queryClient = useQueryClient()
  const titleRef = React.useRef<HTMLInputElement>(null)
  const [title, setTitle] = React.useState(item?.title ?? '')
  const [dueAt, setDueAt] = React.useState(isoToDateInput(item?.dueAt ?? null))
  const [repeatDays, setRepeatDays] = React.useState(item?.repeatDays ? String(item.repeatDays) : '')
  const [secretId, setSecretId] = React.useState(item?.secretId ?? '')
  const [note, setNote] = React.useState(item?.note ?? '')
  const [errors, setErrors] = React.useState<FieldErrors>({})

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetchApi(item ? `/checklist/${item.id}` : '/checklist', { method: item ? 'PATCH' : 'POST', body: JSON.stringify(body) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.checklist })
      onDone()
    },
    onError: () => setErrors({ form: 'Could not save the item. Try again.' }),
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (save.isPending) return

    const next: FieldErrors = {}
    const days = repeatDays.trim() === '' ? null : Number(repeatDays)
    const due = dueAt === '' ? null : dateInputToIso(dueAt)
    if (!title.trim()) next.title = 'Enter a title.'
    if (dueAt !== '' && due === null) next.dueAt = 'Choose a valid date.'
    if (days !== null && (!Number.isInteger(days) || days < 1 || days > MAX_REPEAT_DAYS)) {
      next.repeatDays = `Enter a whole number from 1 to ${MAX_REPEAT_DAYS}, or leave it empty.`
    }
    setErrors(next)
    if (next.title) return void titleRef.current?.focus()
    if (next.dueAt || next.repeatDays) return

    // When editing, an emptied field sends null so the API clears it; when creating, it is left out.
    const optional = (value: string | number | null) => (item ? value : value ?? undefined)
    save.mutate({
      ...(item ? {} : { projectId }),
      title: title.trim(),
      note: optional(note.trim() || null),
      dueAt: optional(due),
      repeatDays: optional(days),
      secretId: optional(secretId || null),
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
      <TextField ref={titleRef} label="Title" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} maxLength={300} autoFocus />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Due date" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} error={errors.dueAt} />
        <TextField label="Check again every (days)" type="number" inputMode="numeric" min={1} max={MAX_REPEAT_DAYS} value={repeatDays} onChange={(e) => setRepeatDays(e.target.value)} error={errors.repeatDays} hint="Checking the item sets the next due date." />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`secret-${item?.id ?? 'new'}`} className="text-[13px] font-medium text-[var(--color-text)]">Linked secret</label>
        <select
          id={`secret-${item?.id ?? 'new'}`}
          value={secretId}
          onChange={(e) => setSecretId(e.target.value)}
          className="h-9 rounded-md border border-[var(--color-input-border)] bg-[var(--color-surface)] px-2 text-[13px] text-[var(--color-text)]"
        >
          <option value="">None</option>
          {secrets.map((secret) => <option key={secret.id} value={secret.id}>{secret.name}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`note-${item?.id ?? 'new'}`} className="text-[13px] font-medium text-[var(--color-text)]">Note</label>
        <Textarea id={`note-${item?.id ?? 'new'}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} className="min-h-[60px]" />
      </div>
      {errors.form && <p role="alert" className="text-[13px] text-[var(--color-danger)]">{errors.form}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : item ? 'Save changes' : 'Add item'}</Button>
      </div>
    </form>
  )
}
