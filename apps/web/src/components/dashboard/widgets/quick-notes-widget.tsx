'use client'

import * as React from 'react'
import { WidgetCard } from '../widget-card'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WidgetConfig } from '@/stores/widget.store'
import { fetchApi } from '@/lib/api'
import { LoadingState } from '@/components/shared/loading-state'
import { createQueryOptions, queryKeys } from '@/lib/query'

type Note = {
  id: string
  title: string
  content: string
}

const SAVE_DELAY_MS = 1000

export function QuickNotesWidget({ config }: { config?: WidgetConfig }) {
  const queryClient = useQueryClient()
  const [localNote, setLocalNote] = React.useState<string>('')
  const [isTyping, setIsTyping] = React.useState(false)
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch the scratchpad note
  const { data: notes = [], isLoading } = useQuery<Note[]>(
    createQueryOptions(queryKeys.notes, async () => fetchApi('/workspace/notes'))
  )

  // Find the scratchpad note
  const scratchpadNote = React.useMemo(() => {
    return notes.find((note) => note.title === 'Scratchpad')
  }, [notes])

  // While the user is typing their own text wins; otherwise show the saved note.
  const value = isTyping ? localNote : (scratchpadNote?.content ?? localNote)

  React.useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
  }, [])

  // Mutation to create or update note
  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      if (scratchpadNote) {
        // Update existing
        return fetchApi(`/workspace/notes/${scratchpadNote.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ content }),
        })
      } else {
        // Create new
        return fetchApi('/workspace/notes', {
          method: 'POST',
          body: JSON.stringify({ title: 'Scratchpad', content }),
        })
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notes })
      setIsTyping(false)
    }
  })

  // Save once the user pauses typing for SAVE_DELAY_MS.
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value
    setIsTyping(true)
    setLocalNote(next)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (next !== scratchpadNote?.content) saveMutation.mutate(next)
    }, SAVE_DELAY_MS)
  }

  return (
    <WidgetCard
      id="w-quick-notes"
      type="quick-notes"
      title="Scratchpad"
      contentClassName="p-0 relative"
    >
      {isLoading ? (
        <LoadingState text="Loading notes…" className="h-full p-0" />
      ) : (
        <>
          <textarea
            value={value}
            onChange={handleChange}
            placeholder="Jot down quick thoughts, markdown supported..."
            className="w-full h-full p-4 bg-transparent resize-none outline-none text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] font-mono leading-relaxed"
            spellCheck={false} aria-label="Jot down quick thoughts, markdown supported" />
          {saveMutation.isPending && (
            <div className="absolute bottom-2 right-3 text-[12px] text-[var(--color-text-muted)] italic flex items-center gap-1">
              <span role="status">Saving...</span>
            </div>
          )}
        </>
      )}
    </WidgetCard>
  )
}
