'use client'

import * as React from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, CheckCircle2, Circle, Search, Clock, Tag } from 'lucide-react'

// Dummy Data
const mockTodos = [
  { id: '1', title: 'Write tests for Dashboard', priority: 'HIGH', tags: ['frontend', 'tests'], completed: false },
  { id: '2', title: 'Review ADR-005', priority: 'MEDIUM', tags: ['architecture'], completed: false },
  { id: '3', title: 'Fix production DB memory leak', priority: 'URGENT', tags: ['backend', 'bug'], completed: false },
  { id: '4', title: 'Update README', priority: 'LOW', tags: ['docs'], completed: true },
]

export default function WorkspacePage() {
  const [todos, setTodos] = React.useState(mockTodos)
  const [search, setSearch] = React.useState('')
  const [note, setNote] = React.useState('')

  React.useEffect(() => {
    const saved = localStorage.getItem('devos-workspace-note')
    if (saved) setNote(saved)
  }, [])

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value)
    localStorage.setItem('devos-workspace-note', e.target.value)
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const filteredTodos = todos.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-[var(--spacing-page-pad)] max-w-[1400px] mx-auto w-full h-full flex flex-col">
      <PageHeader 
        title="Workspace" 
        description="Your personal command center for tasks and thoughts."
        actions={
          <Button><Plus size={16} /> New Task</Button>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden min-h-0">
        
        {/* Task List */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden h-[calc(100vh-160px)]">
          <div className="p-4 border-b border-[var(--color-border-subtle)] flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] h-4 w-4" />
              <Input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tasks..." 
                className="pl-9 bg-[var(--color-surface-2)]"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {filteredTodos.map(todo => (
              <div 
                key={todo.id} 
                className={`flex items-start gap-4 p-3 rounded-lg border transition-colors cursor-pointer ${
                  todo.completed 
                    ? 'bg-[var(--color-surface-2)]/50 border-transparent opacity-60' 
                    : 'bg-[var(--color-surface)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]'
                }`}
                onClick={() => toggleTodo(todo.id)}
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
            ))}
          </div>
        </Card>

        {/* Scratchpad */}
        <Card className="flex flex-col overflow-hidden h-[calc(100vh-160px)]">
          <div className="p-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/30 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[var(--color-text)] flex items-center gap-2">
              Scratchpad
            </h3>
            <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
              <Clock size={12} /> Auto-saved
            </span>
          </div>
          <textarea
            value={note}
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