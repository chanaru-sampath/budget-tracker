import { type User } from '@supabase/supabase-js'
import { create } from 'zustand'

type AuthState = {
  user: User | null
  isInitialized: boolean
  setUser: (user: User | null) => void
  setInitialized: (isInitialized: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isInitialized: false,
  setUser: (user) => set({ user }),
  setInitialized: (isInitialized) => set({ isInitialized }),
}))
