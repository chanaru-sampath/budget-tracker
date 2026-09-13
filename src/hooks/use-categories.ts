import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/use-auth-store'

export type Category = {
  id: string
  name: string
  color: string
  type: 'income' | 'expense'
}

export function categoriesQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.categories.list(),
    queryFn: async () => {
      const user = useAuthStore.getState().user
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: true })

      if (error) throw error
      return data as Category[]
    },
  })
}

export function useCategories() {
  return useQuery(categoriesQueryOptions())
}

export function useAddCategory() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  return useMutation({
    mutationFn: async (newCategory: Omit<Category, 'id'>) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...newCategory, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      return data as Category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single()

      if (error) throw error
      return data as Category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    },
  })
}
