import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WidgetType } from '@devos/types'

export interface WidgetConfig {
  id: string
  type: WidgetType
  enabled: boolean
  order: number
}

interface WidgetState {
  widgets: WidgetConfig[]
  toggleWidget: (type: WidgetType) => void
  reorderWidgets: (startIndex: number, endIndex: number) => void
  setWidgets: (widgets: WidgetConfig[]) => void
}

const defaultWidgets: WidgetConfig[] = [
  { id: '1', type: 'tasks', enabled: true, order: 0 },
  { id: '2', type: 'quick-notes', enabled: true, order: 1 },
  { id: '3', type: 'server-health', enabled: true, order: 2 },
  { id: '4', type: 'github', enabled: true, order: 3 },
  { id: '5', type: 'pomodoro', enabled: true, order: 4 },
  { id: '6', type: 'snippets', enabled: true, order: 5 },
]

export const useWidgetStore = create<WidgetState>()(
  persist(
    (set) => ({
      widgets: defaultWidgets,
      toggleWidget: (type) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.type === type ? { ...w, enabled: !w.enabled } : w
          ),
        })),
      reorderWidgets: (startIndex, endIndex) =>
        set((state) => {
          const result = Array.from(state.widgets)
          const [removed] = result.splice(startIndex, 1)
          if (removed) {
            result.splice(endIndex, 0, removed)
          }
          return {
            widgets: result.map((w, index) => ({ ...w, order: index })),
          }
        }),
      setWidgets: (widgets) => set({ widgets }),
    }),
    { name: 'devos-widgets' }
  )
)
