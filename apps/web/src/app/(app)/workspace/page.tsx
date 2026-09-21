'use client'

import * as React from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, CheckCircle2, Circle, Search, Clock, Tag, Loader2, Save } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api'
import { createQueryOptions, queryKeys } from '@/lib/query'

type Todo = {
  id: string
  title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  completed: boolean
  tags: string[]
}

export default function WorkspacePage() {
  const [search, setSearch] = React.useState('')
  const [newTaskTitle, setNewTaskTitle] = React.useState('')
  const queryClient = useQueryClient()

  // Scratchpad State
  const [noteContent, setNoteContent] = React.useState('')
  const [noteId, setNoteId] = React.useState<string | null>(null)
  const [isSavingNote, setIsSavingNote] = React.useState(false)
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Fetch Todos from Backend
  const { data: todos = [], isLoading } = useQuery<Todo[]>(
    createQueryOptions(queryKeys.todos, () => fetchApi('/workspace/todos'))
  )

  // Fetch Notes for Scratchpad
  useQuery({
    ...createQueryOptions(queryKeys.scratchpad, async () => {
      const notes = await fetchApi<any[]>('/workspace/notes')
      const scratch = notes.find(n => n.title === 'Scratchpad') || notes[0]
      if (scratch) {
        setNoteId(scratch.id)
        setNoteContent(scratch.content)
      }
      return notes
    }),
    staleTime: Infinity,
  })

  // Save Note Mutation
  const saveNoteMutation = useMutation({
    mutationFn: (content: string) => {
      if (noteId) {
        return fetchApi(`/workspace/notes/${noteId}`, {
          method: 'PATCH',
          body: JSON.stringify({ content })
        })
      } else {
        return fetchApi('/workspace/notes', {
          method: 'POST',
          body: JSON.stringify({ title: 'Scratchpad', content })
        }).then((res: any) => {
          setNoteId(res.id)
          return res
        })
      }
    }
  })

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setNoteContent(val)
    
    setIsSavingNote(true)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      saveNoteMutation.mutate(val, {
        onSettled: () => setIsSavingNote(false)
      })
    }, 1000)
  }

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  // Toggle Todo Completion
  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string, completed: boolean }) => 
      fetchApi(`/workspace/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed })
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.todos })
    }
  })

  // Create Todo
  const createMutation = useMutation({
    mutationFn: (title: string) => 
      fetchApi('/workspace/todos', {
        method: 'POST',
        body: JSON.stringify({ title, priority: 'MEDIUM', tags: [] })
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.todos })
      setNewTaskTitle('')
    }
  })

  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    createMutation.mutate(newTaskTitle)
  }

  const filteredTodos = todos.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-[var(--spacing-page-pad)] max-w-[1400px] mx-auto w-full h-full flex flex-col">
      <PageHeader 
        title="Workspace" 
        description="Your personal command center for tasks and thoughts."
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden min-h-0 mt-4">
        
        {/* Task List */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden h-[calc(100vh-160px)]">
          <div className="p-4 border-b border-[var(--color-border-subtle)] flex gap-4 bg-[var(--color-surface-2)]/30">
            <form onSubmit={handleCreateTodo} className="flex-1 flex gap-2">
              <Input 
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="What needs to be done?" 
                className="bg-[var(--color-surface)]"
                disabled={createMutation.isPending}
              />
              <Button type="submit" disabled={createMutation.isPending || !newTaskTitle.trim()}>
                {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                <span className="ml-2">Add</span>
              </Button>
            </form>
          </div>
          <div className="px-4 py-2 border-b border-[var(--color-border-subtle)] flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] h-4 w-4" />
              <Input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tasks..." 
                className="pl-9 h-8 text-[13px] bg-transparent border-transparent shadow-none px-0 focus-visible:ring-0"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {isLoading ? (
              <div className="flex justify-center p-8 text-[var(--color-text-muted)]">
                <Loader2 className="animate-spin h-6 w-6" />
              </div>
            ) : filteredTodos.length === 0 ? (
              <div className="text-center p-8 text-[13px] text-[var(--color-text-muted)]">
                No tasks found.
              </div>
            ) : (
              filteredTodos.map(todo => (
                <div 
                  key={todo.id} 
                  className={`flex items-start gap-4 p-3 rounded-lg border transition-colors cursor-pointer ${
                    todo.completed 
                      ? 'bg-[var(--color-surface-2)]/50 border-transparent opacity-60' 
                      : 'bg-[var(--color-surface)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]'
                  }`}
                  onClick={() => toggleMutation.mutate({ id: todo.id, completed: !todo.completed })}
                >
                  <button className="mt-0.5 shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
                    {todo.completed ? <CheckCircle2 size={18} className="text-[var(--color-success)]" /> : <Circle size={18} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[14px] font-medium leading-tight mb-1.5 ${todo.completed ? 'line-through text-[var(--color-text-disabled)]' : 'text-[var(--color-text)]'}`}>
                      {todo.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={todo.priority === 'URGENT' ? 'destructive' : todo.priority === 'HIGH' ? 'warning' : 'secondary'} className="h-5 text-[10px]">
                        {todo.priority}
                      </Badge>
                      {todo.tags.map(tag => (
                        <span key={tag} className="flex items-center text-[11px] text-[var(--color-text-muted)]">
                          <Tag size={10} className="mr-1" /> {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Scratchpad */}
        <Card className="flex flex-col overflow-hidden h-[calc(100vh-160px)]">
          <div className="p-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/30 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[var(--color-text)] flex items-center gap-2">
              Scratchpad
            </h3>
            <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
              {isSavingNote ? (
                <><Loader2 size={12} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={12} /> Auto-saved to API</>
              )}
            </span>
          </div>
          <textarea
            value={noteContent}
            onChange={handleNoteChange}
            placeholder="Type your thoughts here... Markdown is supported."
            className="flex-1 w-full p-4 bg-transparent resize-none outline-none text-[13px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] font-mono leading-relaxed"
            spellCheck={false}
          />
        </Card>

      </div>
    </div>
  )
}