'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, ArrowLeft, Loader2 } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function NoteEditorPage() {
  const router = useRouter()
  const params = useParams()
  const isNew = !params.id || params.id === 'new'
  const id = params.id as string

  const [title, setTitle] = React.useState('Untitled Note')
  const [content, setContent] = React.useState('# New Note\n\nWrite something brilliant...')
  const [isPreview, setIsPreview] = React.useState(false)

  const queryClient = useQueryClient()

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: async () => {
      if (isNew) return null
      const res = await fetch(`http://localhost:3001/api/v1/knowledge/notes/${id}`)
      if (!res.ok) throw new Error('Note not found')
      return res.json()
    },
    enabled: !isNew
  })

  React.useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
    }
  }, [note])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = isNew 
        ? 'http://localhost:3001/api/v1/knowledge/notes'
        : `http://localhost:3001/api/v1/knowledge/notes/${id}`
      
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      })

      if (!res.ok) throw new Error('Failed to save note')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      if (isNew) {
        router.replace(`/knowledge/notes/${data.id}`)
      }
    }
  })

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-[var(--color-text-muted)]" /></div>
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-bg)]">
      {/* Editor Header */}
      <div className="h-14 border-b border-[var(--color-border-subtle)] flex items-center justify-between px-4 shrink-0 bg-[var(--color-surface)]">
        <div className="flex items-center gap-3 w-1/2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-[var(--color-text-2)]">
            <ArrowLeft size={16} />
          </Button>
          <Input 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            className="h-8 border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-accent)] bg-transparent font-medium text-[15px] px-2 shadow-none"
            placeholder="Note Title..."
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-[var(--color-surface-2)] p-1 rounded-md flex items-center gap-1 border border-[var(--color-border-subtle)]">
            <button 
              onClick={() => setIsPreview(false)}
              className={`px-3 py-1 text-[12px] font-medium rounded-sm transition-colors ${!isPreview ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
            >
              Write
            </button>
            <button 
              onClick={() => setIsPreview(true)}
              className={`px-3 py-1 text-[12px] font-medium rounded-sm transition-colors ${isPreview ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
            >
              Preview
            </button>
          </div>
          <Button 
            size="sm" 
            onClick={() => saveMutation.mutate()} 
            disabled={saveMutation.isPending}
            className="h-8 gap-2 px-4 shadow-sm"
          >
            {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Note
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {!isPreview ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-8 resize-none bg-transparent outline-none text-[15px] font-mono leading-relaxed text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
            placeholder="Start writing..."
            spellCheck={false}
          />
        ) : (
          <div className="w-full h-full p-8 overflow-y-auto prose prose-invert max-w-4xl mx-auto prose-pre:bg-[var(--color-surface-2)] prose-pre:border prose-pre:border-[var(--color-border-subtle)]">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
