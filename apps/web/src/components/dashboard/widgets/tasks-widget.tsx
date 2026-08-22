'use client'

import * as React from 'react'
import { WidgetCard } from '../widget-card'
import { CheckCircle2, Circle, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WidgetConfig } from '@/stores/widget.store'
import { fetchApi } from '@/lib/api'

export function TasksWidget({ config }: { config?: WidgetConfig }) {
  const queryClient = useQueryClient()

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      return fetchApi<any[]>('/workspace/todos')
    }
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      return fetchApi(`/workspace/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    }
  })

  const toggleTask = (id: string, currentStatus: boolean) => {
    toggleMutation.mutate({ id, completed: !currentStatus })
  }

  const activeTasks = tasks?.filter((t: any) => !t.completed) || []
  const completedTasks = tasks?.filter((t: any) => t.completed) || []

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
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-2)] gap-2 text-[12px]">
            <Loader2 size={14} className="animate-spin" /> Fetching...
          </div>
        ) : (
          <>
            {activeTasks.map((task: any) => (
              <div 
                key={task.id} 
                className="group flex items-start gap-3 p-2 rounded-md hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
                onClick={() => toggleTask(task.id, task.completed)}
              >
                <button className="mt-0.5 shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors">
                  <Circle size={16} />
                </button>
                <div className="flex-1 text-[13px] leading-tight text-[var(--color-text)]">
                  {task.title}
                </div>
              </div>
            ))}
            
            {completedTasks.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[var(--color-border-subtle)]">
                <span className="text-[10px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider ml-2 mb-1 block">Completed</span>
                {completedTasks.map((task: any) => (
                  <div 
                    key={task.id} 
                    className="group flex items-start gap-3 p-2 rounded-md hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
                    onClick={() => toggleTask(task.id, task.completed)}
                  >
                    <button className="mt-0.5 shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors">
                      <CheckCircle2 size={16} className="text-[var(--color-success)]" />
                    </button>
                    <div className="flex-1 text-[13px] leading-tight text-[var(--color-text-disabled)] line-through">
                      {task.title}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tasks?.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-[12px] text-[var(--color-text-muted)] italic">
                No tasks found.
              </div>
            )}
          </>
        )}
      </div>
    </WidgetCard>
  )
}
