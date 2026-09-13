import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { mapFields } from '@/lib/db-utils'
import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/use-auth-store'

export type TransactionType = 'income' | 'expense'

export type Transaction = {
  id: string
  amount: number
  categoryId: string
  type: TransactionType
  date: string
  notes?: string
}

export function transactionsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.transactions.list(),
    queryFn: async () => {
      const user = useAuthStore.getState().user
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false })

      if (error) throw error
      // Map snake_case from DB to camelCase for UI if necessary
      // Here we map category_id to categoryId
      return data.map((t) => ({
        id: t.id,
        amount: t.amount,
        categoryId: t.category_id,
        type: t.type,
        date: t.date,
        notes: t.notes,
      })) as Transaction[]
    },
  })
}

export function useTransactions() {
  return useQuery(transactionsQueryOptions())
}

export function useAddTransaction() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  return useMutation({
    mutationFn: async (newTx: Omit<Transaction, 'id'>) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            amount: newTx.amount,
            category_id: newTx.categoryId,
            type: newTx.type,
            date: newTx.date,
            notes: newTx.notes,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const dbUpdates = mapFields(updates, {
        amount: 'amount',
        categoryId: 'category_id',
        type: 'type',
        date: 'date',
        notes: 'notes',
      })

      const { data, error } = await supabase.from('transactions').update(dbUpdates).eq('id', id).select().single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
    },
  })
}
