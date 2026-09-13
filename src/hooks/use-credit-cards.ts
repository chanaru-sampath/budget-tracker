import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { mapFields } from '@/lib/db-utils'
import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/use-auth-store'

import type { Bank } from './use-banks'

export type CreditCard = {
  id: string
  bankId: string
  name: string
  lastFour: string | null
  color: string
  sortOrder: number
  createdAt: string
  /** Populated when fetched with bank join */
  bank?: Pick<Bank, 'id' | 'name' | 'color'>
}

export type NewCreditCard = Pick<CreditCard, 'bankId' | 'name' | 'lastFour' | 'color' | 'sortOrder'>

function mapRow(row: Record<string, unknown>): CreditCard {
  const bankRow = row.banks as Record<string, unknown> | null

  return {
    id: row.id as string,
    bankId: row.bank_id as string,
    name: row.name as string,
    lastFour: row.last_four as string | null,
    color: row.color as string,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
    bank: bankRow
      ? { id: bankRow.id as string, name: bankRow.name as string, color: bankRow.color as string }
      : undefined,
  }
}

export function creditCardsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.creditCards.list(),
    queryFn: async () => {
      const user = useAuthStore.getState().user
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('credit_cards')
        .select('*, banks(id, name, color)')
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data.map(mapRow)
    },
  })
}

export function useCreditCards() {
  return useQuery(creditCardsQueryOptions())
}

export function useAddCreditCard() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  return useMutation({
    mutationFn: async (card: NewCreditCard) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('credit_cards')
        .insert([
          {
            user_id: user.id,
            bank_id: card.bankId,
            name: card.name,
            last_four: card.lastFour,
            color: card.color,
            sort_order: card.sortOrder,
          },
        ])
        .select('*, banks(id, name, color)')
        .single()

      if (error) throw error
      return mapRow(data as Record<string, unknown>)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all })
    },
  })
}

export function useUpdateCreditCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NewCreditCard> & { id: string }) => {
      const dbUpdates = mapFields(updates, {
        bankId: 'bank_id',
        name: 'name',
        lastFour: 'last_four',
        color: 'color',
        sortOrder: 'sort_order',
      })

      const { data, error } = await supabase
        .from('credit_cards')
        .update(dbUpdates)
        .eq('id', id)
        .select('*, banks(id, name, color)')
        .single()

      if (error) throw error
      return mapRow(data as Record<string, unknown>)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all })
    },
  })
}

export function useDeleteCreditCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('credit_cards').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.creditCards.all })
    },
  })
}
