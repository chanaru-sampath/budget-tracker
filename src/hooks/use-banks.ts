import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { mapFields } from '@/lib/db-utils'
import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/use-auth-store'

export type Bank = {
  id: string
  name: string
  isSalaryAccount: boolean
  color: string
  sortOrder: number
  createdAt: string
}

export type NewBank = Pick<Bank, 'name' | 'isSalaryAccount' | 'color' | 'sortOrder'>

function mapRow(row: Record<string, unknown>): Bank {
  return {
    id: row.id as string,
    name: row.name as string,
    isSalaryAccount: row.is_salary_account as boolean,
    color: row.color as string,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  }
}

export function banksQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.banks.list(),
    queryFn: async () => {
      const user = useAuthStore.getState().user
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.from('banks').select('*').order('sort_order', { ascending: true })

      if (error) throw error
      return data.map(mapRow)
    },
  })
}

export function useBanks() {
  return useQuery(banksQueryOptions())
}

export function useAddBank() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  return useMutation({
    mutationFn: async (bank: NewBank) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('banks')
        .insert([
          {
            user_id: user.id,
            name: bank.name,
            is_salary_account: bank.isSalaryAccount,
            color: bank.color,
            sort_order: bank.sortOrder,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return mapRow(data as Record<string, unknown>)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banks.all })
    },
  })
}

export function useUpdateBank() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NewBank> & { id: string }) => {
      const dbUpdates = mapFields(updates, {
        name: 'name',
        isSalaryAccount: 'is_salary_account',
        color: 'color',
        sortOrder: 'sort_order',
      })

      const { data, error } = await supabase.from('banks').update(dbUpdates).eq('id', id).select().single()

      if (error) throw error
      return mapRow(data as Record<string, unknown>)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banks.all })
      // Credit cards depend on banks, invalidate them too
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all })
    },
  })
}

export function useDeleteBank() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('banks').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banks.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all })
    },
  })
}
