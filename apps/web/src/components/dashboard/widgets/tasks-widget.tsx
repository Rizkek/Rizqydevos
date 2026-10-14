'use client'

import * as React from 'react'
import { WidgetCard } from '../widget-card'
import { CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WidgetConfig } from '@/stores/widget.store'
import { fetchApi } from '@/lib/api'
import { createQueryOptions, queryKeys } from '@/lib/query'

interface Task {
  id: string
  title: string
  completed: boolean
}

interface TaskRowProps {
  task: Task
  onToggle: (task: Task) => void
}

// The whole row is one button, so the task can be toggled with Space or Enter as well as a click.
function TaskRow({ task, onToggle }: TaskRowProps) {
  const Icon = task.completed ? CheckCircle2 : Circle
  return (
    <li>
      <button
        type="button"
        aria-pressed={task.completed}
        onClick={() => onToggle(task)}
        className="group flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors hover:bg-[var(--color-surface-2)]"
      >
        <Icon
          aria-hidden="true"
          size={16}
          className={task.completed ? 'mt-0.5 shrink-0 text-[var(--color-success)]' : 'mt-0.5 shrink-0 text-[var(--color-text-2)] group-hover:text-[var(--color-accent)]'}
        />
        <span className={task.completed ? 'flex-1 text-[13px] leading-tight text-[var(--color-text-2)] line-through' : 'flex-1 text-[13px] leading-tight text-[var(--color-text)]'}>
          {task.title}
        </span>
      </button>
    </li>
  )
}

export function TasksWidget({ config }: { config?: WidgetConfig }) {
  const queryClient = useQueryClient()

  const { data: tasks, isLoading, error, refetch } = useQuery(
    createQueryOptions(queryKeys.todos, () => fetchApi<Task[]>('/workspace/todos'))
  )

  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      return fetchApi(`/workspace/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.todos })
    }
  })

  const toggleTask = (task: Task) => {
    toggleMutation.mutate({ id: task.id, completed: !task.completed })
  }

  const activeTasks = tasks?.filter((t) => !t.completed) ?? []
  const completedTasks = tasks?.filter((t) => t.completed) ?? []

  return (
    <WidgetCard id="w-tasks" type="tasks" title="Tasks" contentClassName="p-3">
      <div className="flex flex-col gap-1 overflow-y-auto h-full pr-1">
        {isLoading ? (
          <ListSkeleton label="Loading tasks" />
        ) : error ? (
          <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p className="text-[13px] text-[var(--color-text-2)]">Tasks could not be loaded.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            {activeTasks.length > 0 && (
              <ul className="flex flex-col gap-1" aria-label="Open tasks">
                {activeTasks.map((task) => (
                  <TaskRow key={task.id} task={task} onToggle={toggleTask} />
                ))}
              </ul>
            )}

            {completedTasks.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[var(--color-border-subtle)]">
                <h3 className="text-[12px] text-[var(--color-text-2)] font-medium uppercase tracking-wider ml-2 mb-1">Completed</h3>
                <ul className="flex flex-col gap-1" aria-label="Completed tasks">
                  {completedTasks.map((task) => (
                    <TaskRow key={task.id} task={task} onToggle={toggleTask} />
                  ))}
                </ul>
              </div>
            )}

            {tasks?.length === 0 && (
              <p className="flex flex-1 items-center justify-center text-[13px] text-[var(--color-text-2)]">No tasks yet.</p>
            )}
          </>
        )}
      </div>
    </WidgetCard>
  )
}
