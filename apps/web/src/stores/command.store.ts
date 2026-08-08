import { create } from 'zustand'

interface CommandState {
  isOpen: boolean
  query: string
  setIsOpen: (isOpen: boolean) => void
  setQuery: (query: string) => void
  toggle: () => void
}

export const useCommandStore = create<CommandState>((set) => ({
  isOpen: false,
  query: '',
  setIsOpen: (isOpen) => set({ isOpen }),
  setQuery: (query) => set({ query }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))
