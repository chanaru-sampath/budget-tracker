import { format } from 'date-fns'
import { create } from 'zustand'

type UIState = {
  selectedMonth: string // format: 'yyyy-MM'
  sidebarOpen: boolean
  setSelectedMonth: (month: string) => void
  setSidebarOpen: (isOpen: boolean) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedMonth: format(new Date(), 'yyyy-MM'),
  sidebarOpen: false,
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
