'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/text-field'
import { Textarea } from '@/components/ui/textarea'
import { ApiError, fetchApi } from '@/lib/api'
import { queryKeys } from '@/lib/query'
import { READ_LATER_TAG, hostOf, parseTags, toHttpUrl, type Bookmark } from '@/lib/bookmarks'

export interface LinkFormValues {
  id?: string
  url: string
  title: string
  description?: string | null
  tags: string[]
  pinned: boolean
}

interface LinkFormProps {
  initial: LinkFormValues
  onSaved: (bookmark: Bookmark) => void
  onCancel?: () => void
}

interface FieldErrors {
  url?: string
  form?: string
}

export function LinkForm({ initial, onSaved, onCancel }: LinkFormProps) {
  const queryClient = useQueryClient()
  const urlRef = React.useRef<HTMLInputElement>(null)
  const [url, setUrl] = React.useState(initial.url)
  const [title, setTitle] = React.useState(initial.title)
  const [tags, setTags] = React.useState(initial.tags.filter((t) => t !== READ_LATER_TAG).join(', '))
  const [readLater, setReadLater] = React.useState(initial.tags.includes(READ_LATER_TAG))
  const [pinned, setPinned] = React.useState(initial.pinned)
  const [description, setDescription] = React.useState(initial.description ?? '')
  const [errors, setErrors] = React.useState<FieldErrors>({})

  const save = useMutation({
    mutationFn: (body: Omit<LinkFormValues, 'id'>) =>
      fetchApi<Bookmark>(initial.id ? `/workspace/bookmarks/${initial.id}` : '/workspace/bookmarks', {
        method: initial.id ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: async (bookmark) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks })
      onSaved(bookmark)
    },
    onError: (error) => {
      const message = error instanceof ApiError && error.code === 'VALIDATION_ERROR'
        ? 'The server rejected the link. Check the URL and the field lengths.'
        : 'Could not save the link. Try again.'
      setErrors({ form: message })
    },
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (save.isPending) return
    const normalized = toHttpUrl(url)
    if (!normalized) {
      setErrors({ url: 'Enter a web address starting with http:// or https://, or a domain such as example.com.' })
      urlRef.current?.focus()
      return
    }
    setErrors({})
    const tagList = parseTags(tags)
    save.mutate({
      url: normalized,
      title: title.trim() || hostOf(normalized),
      description: description.trim(),
      tags: readLater ? Array.from(new Set([...tagList, READ_LATER_TAG])) : tagList,
      pinned,
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <TextField ref={urlRef} label="URL" value={url} onChange={(e) => setUrl(e.target.value)} error={errors.url} placeholder="https://example.com/article" inputMode="url" autoFocus />
      <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} hint="Leave empty to use the site name." maxLength={500} />
      <TextField label="Tags" value={tags} onChange={(e) => setTags(e.target.value)} hint="Separate tags with commas." />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="link-description" className="text-[13px] font-medium text-[var(--color-text)]">Note</label>
        <Textarea id="link-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} className="min-h-[80px]" />
      </div>
      <label className="flex items-center gap-2 text-[13px] text-[var(--color-text)]">
        <input type="checkbox" checked={readLater} onChange={(e) => setReadLater(e.target.checked)} className="h-4 w-4" />
        Read later
      </label>
      <label className="flex items-center gap-2 text-[13px] text-[var(--color-text)]">
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4" />
        Pin to the top
      </label>
      {errors.form && <p role="alert" className="text-[13px] text-[var(--color-danger)]">{errors.form}</p>}
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : initial.id ? 'Save changes' : 'Save link'}</Button>
      </div>
    </form>
  )
}
