import { create } from 'zustand'

// Not persisted: a drawer that reopens on reload would cover the page.
interface MobileNavState {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export const useMobileNavStore = create<MobileNavState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}))
