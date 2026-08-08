import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light' | 'system'
export type AccentColor = 'violet' | 'emerald' | 'cyan' | 'amber' | 'rose'
export type Density = 'compact' | 'normal' | 'spacious'

interface UIState {
  sidebarOpen: boolean
  theme: Theme
  accentColor: AccentColor
  density: Density
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: Theme) => void
  setAccentColor: (color: AccentColor) => void
  setDensity: (density: Density) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'dark',
      accentColor: 'violet',
      density: 'normal',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setDensity: (density) => set({ density }),
    }),
    { name: 'devos-ui' }
  )
)
