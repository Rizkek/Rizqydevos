'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useWidgetStore } from '@/stores/widget.store'
import dynamic from 'next/dynamic'
import { EmptyState } from '@/components/shared/empty-state'
import { LayoutDashboard } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

function WidgetSkeleton() {
  return <Skeleton className="w-full h-full rounded-xl bg-[var(--color-surface-2)]" />
}

// Map of widget types to their React components
const WIDGET_REGISTRY: Record<string, React.ComponentType<{ config: any }>> = {
  'tasks': dynamic(() => import('./widgets/tasks-widget').then((mod) => mod.TasksWidget), { loading: () => <WidgetSkeleton /> }),
  'quick-notes': dynamic(() => import('./widgets/quick-notes-widget').then((mod) => mod.QuickNotesWidget), { loading: () => <WidgetSkeleton /> }),
  'server-health': dynamic(() => import('./widgets/server-health-widget').then((mod) => mod.ServerHealthWidget), { loading: () => <WidgetSkeleton /> }),
  'pomodoro': dynamic(() => import('./widgets/pomodoro-widget').then((mod) => mod.PomodoroWidget), { loading: () => <WidgetSkeleton /> }),
  'github': dynamic(() => import('./widgets/github-widget').then((mod) => mod.GithubWidget), { loading: () => <WidgetSkeleton /> }),
  'snippets': dynamic(() => import('./widgets/snippets-widget').then((mod) => mod.SnippetsWidget), { loading: () => <WidgetSkeleton /> }),
}

export function WidgetGrid() {
  const widgets = useWidgetStore((state) => state.widgets)
  
  // Only show enabled widgets, sorted by order
  const activeWidgets = React.useMemo(() => {
    return widgets
      .filter((w) => w.enabled)
      .sort((a, b) => a.order - b.order)
  }, [widgets])

  // Hydration safety
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[var(--widget-gap)] auto-rows-[minmax(300px,auto)]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[300px]">
            <Skeleton className="w-full h-full rounded-xl bg-[var(--color-surface-2)]" />
          </div>
        ))}
      </div>
    )
  }

  if (activeWidgets.length === 0) {
    return (
      <div className="pt-12">
        <EmptyState 
          icon={LayoutDashboard}
          title="Clean Slate"
          description="You've hidden all your widgets. Enable some from settings or use the command palette."
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[var(--widget-gap)] auto-rows-[minmax(300px,auto)]">
      <AnimatePresence mode="popLayout">
        {activeWidgets.map((widgetConfig) => {
          const WidgetComponent = WIDGET_REGISTRY[widgetConfig.type]
          
          if (!WidgetComponent) return null

          return (
            <motion.div
              layout
              key={widgetConfig.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="h-[300px]" // Fixed height for MVP
            >
              <WidgetComponent config={widgetConfig} />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
