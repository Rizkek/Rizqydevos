'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useWidgetStore } from '@/stores/widget.store'
import { TasksWidget } from './widgets/tasks-widget'
import { QuickNotesWidget } from './widgets/quick-notes-widget'
import { ServerHealthWidget } from './widgets/server-health-widget'
import { PomodoroWidget } from './widgets/pomodoro-widget'
import { GithubWidget } from './widgets/github-widget'
import { SnippetsWidget } from './widgets/snippets-widget'
import { EmptyState } from '@/components/shared/empty-state'
import { LayoutDashboard } from 'lucide-react'

// Map of widget types to their React components
const WIDGET_REGISTRY: Record<string, React.ComponentType> = {
  'tasks': TasksWidget,
  'quick-notes': QuickNotesWidget,
  'server-health': ServerHealthWidget,
  'pomodoro': PomodoroWidget,
  'github': GithubWidget,
  'snippets': SnippetsWidget,
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
  if (!mounted) return <div className="h-full min-h-[400px]" />

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
              <WidgetComponent />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
