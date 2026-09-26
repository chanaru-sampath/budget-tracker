import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/use-auth-store'

export type Profile = {
  id: string
  fullName: string
  avatarUrl: string | null
  currency: string
}

export function profileQueryOptions() {
  return queryOptions({
    queryKey: ['profile'],
    queryFn: async () => {
      const user = useAuthStore.getState().user
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()

      if (error) throw error

      if (!data) {
        return {
          id: user.id,
          fullName: user.user_metadata?.full_name || '',
          avatarUrl: null,
          currency: 'LKR',
        } as Profile
      }

      return {
        id: data.id,
        fullName: data.full_name,
        avatarUrl: data.avatar_url,
        currency: data.currency,
      } as Profile
    },
  })
}

export function useProfile() {
  return useQuery(profileQueryOptions())
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  return useMutation({
    mutationFn: async (updates: { full_name?: string; avatar_url?: string; currency?: string }) => {
      if (!user) throw new Error('Not authenticated')

      const dbPayload = {
        id: user.id,
        ...updates,
      }

      const { data, error } = await supabase.from('profiles').upsert(dbPayload).select().single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
