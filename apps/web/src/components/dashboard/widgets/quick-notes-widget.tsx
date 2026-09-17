'use client'

import * as React from 'react'
import { WidgetCard } from '../widget-card'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WidgetConfig } from '@/stores/widget.store'
import { Loader2 } from 'lucide-react'
import { fetchApi } from '@/lib/api'

type Note = {
  id: string
  title: string
  content: string
}

// Simple debounce hook for local state
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export function QuickNotesWidget({ config }: { config?: WidgetConfig }) {
  const queryClient = useQueryClient()
  const [localNote, setLocalNote] = React.useState<string>('')
  const [isTyping, setIsTyping] = React.useState(false)
  
  // Fetch the scratchpad note
  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: async () => {
      return fetchApi('/workspace/notes')
    }
  })

  // Find the scratchpad note
  const scratchpadNote = React.useMemo(() => {
    return notes.find((note) => note.title === 'Scratchpad')
  }, [notes])

  // Sync server data to local state when loaded
  React.useEffect(() => {
    if (scratchpadNote && !isTyping) {
      setLocalNote(scratchpadNote.content)
    }
  }, [scratchpadNote, isTyping])

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      setIsTyping(false)
    }
  })

  const debouncedContent = useDebounce(localNote, 1000)

  // Trigger save when debounced content changes
  React.useEffect(() => {
    if (isTyping && debouncedContent !== scratchpadNote?.content) {
      saveMutation.mutate(debouncedContent)
    }
  }, [debouncedContent])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsTyping(true)
    setLocalNote(e.target.value)
  }

  return (
    <WidgetCard
      id="w-quick-notes"
      type="quick-notes"
      title="Scratchpad"
      contentClassName="p-0 relative"
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-2)] gap-2 text-[12px]">
          <Loader2 size={14} className="animate-spin" /> Loading...
        </div>
      ) : (
        <>
          <textarea
            value={localNote}
            onChange={handleChange}
            placeholder="Jot down quick thoughts, markdown supported..."
            className="w-full h-full p-4 bg-transparent resize-none outline-none text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] font-mono leading-relaxed"
            spellCheck={false}
          />
          {saveMutation.isPending && (
            <div className="absolute bottom-2 right-3 text-[10px] text-[var(--color-text-muted)] italic flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> Saving...
            </div>
          )}
        </>
      )}
    </WidgetCard>
  )
}
