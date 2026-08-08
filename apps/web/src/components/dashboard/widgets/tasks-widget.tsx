'use client'

import * as React from 'react'
import { WidgetCard } from '../widget-card'
import { CheckCircle2, Circle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const mockTasks = [
  { id: '1', title: 'Review ADR-005', completed: false, priority: 'HIGH' },
  { id: '2', title: 'Merge PR #42 for Dashboard', completed: false, priority: 'URGENT' },
  { id: '3', title: 'Update dependencies', completed: true, priority: 'MEDIUM' },
]

export function TasksWidget() {
  const [tasks, setTasks] = React.useState(mockTasks)

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  return (
    <WidgetCard
      id="w-tasks"
      type="tasks"
      title="Tasks"
      headerAction={
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-[var(--radius-sm)] text-[var(--color-text-2)] hover:text-[var(--color-text)]">
          <Plus size={14} />
        </Button>
      }
      contentClassName="p-3"
    >
      <div className="flex flex-col gap-1 overflow-y-auto h-full pr-1">
        {tasks.map(task => (
          <div 
            key={task.id} 
            className="group flex items-start gap-3 p-2 rounded-md hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
            onClick={() => toggleTask(task.id)}
          >
            <button className="mt-0.5 shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors">
              {task.completed ? (
                <CheckCircle2 size={16} className="text-[var(--color-success)]" />
              ) : (
                <Circle size={16} />
              )}
            </button>
            <div className={`flex-1 text-[13px] leading-tight ${task.completed ? 'text-[var(--color-text-disabled)] line-through' : 'text-[var(--color-text)]'}`}>
              {task.title}
            </div>
          </div>
        ))}
        {tasks.filter(t => !t.completed).length === 0 && (
          <div className="flex-1 flex items-center justify-center text-[12px] text-[var(--color-text-muted)] italic">
            All tasks completed.
          </div>
        )}
      </div>
    </WidgetCard>
  )
}
