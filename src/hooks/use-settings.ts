import { useEffect } from 'react'

import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/use-auth-store'

export type Settings = {
  currency: string
  theme: 'light' | 'dark' | 'system'
  notificationsEnabled: boolean
}

const DEFAULT_SETTINGS: Settings = {
  currency: 'LKR',
  theme: 'light',
  notificationsEnabled: true,
}

export function settingsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.settings.all,
    queryFn: async () => {
      const user = useAuthStore.getState().user
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no row returned, which is fine for first login, we fallback to default
        throw error
      }

      if (!data) return DEFAULT_SETTINGS

      return {
        currency: data.currency,
        theme: data.theme,
        notificationsEnabled: data.notifications_enabled,
      } as Settings
    },
  })
}

export function useSettings() {
  return useQuery(settingsQueryOptions())
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  return useMutation({
    mutationFn: async (updates: Partial<Settings>) => {
      if (!user) throw new Error('Not authenticated')

      // Get current settings first or use defaults
      const current = queryClient.getQueryData<Settings>(queryKeys.settings.all) || DEFAULT_SETTINGS
      const newSettings = { ...current, ...updates }

      const dbPayload = {
        user_id: user.id,
        currency: newSettings.currency,
        theme: newSettings.theme,
        notifications_enabled: newSettings.notificationsEnabled,
      }

      const { data, error } = await supabase.from('user_settings').upsert(dbPayload).select().single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
    },
  })
}

// Helper hook to apply theme based on settings
export function useApplyTheme() {
  const { data: settings } = useSettings()

  useEffect(() => {
    if (!settings) return

    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(settings.theme)
  }, [settings])
}
