import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { mapFields } from '@/lib/db-utils'
import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/use-auth-store'

export type RecurringTemplate = {
  id: string
  categoryId: string | null
  bankId: string | null
  cardId: string | null
  label: string
  amount: number
  startDate: string
  endDate: string | null
  isActive: boolean
  createdAt: string
}

export type NewRecurringTemplate = Pick<
  RecurringTemplate,
  'categoryId' | 'bankId' | 'cardId' | 'label' | 'amount' | 'startDate' | 'endDate'
>

function mapRow(row: Record<string, unknown>): RecurringTemplate {
  return {
    id: row.id as string,
    categoryId: row.category_id as string | null,
    bankId: row.bank_id as string | null,
    cardId: row.card_id as string | null,
    label: row.label as string,
    amount: row.amount as number,
    startDate: row.start_date as string,
    endDate: row.end_date as string | null,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
  }
}

export function recurringQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.recurring.list(),
    queryFn: async () => {
      const user = useAuthStore.getState().user
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('recurring_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data.map(mapRow)
    },
  })
}

export function useRecurring() {
  return useQuery(recurringQueryOptions())
}

export function useAddRecurring() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  return useMutation({
    mutationFn: async (template: NewRecurringTemplate) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('recurring_templates')
        .insert([
          {
            user_id: user.id,
            category_id: template.categoryId,
            bank_id: template.bankId,
            card_id: template.cardId,
            label: template.label,
            amount: template.amount,
            start_date: template.startDate,
            end_date: template.endDate,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return mapRow(data as Record<string, unknown>)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all })
    },
  })
}

export function useUpdateRecurring() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NewRecurringTemplate> & { id: string; isActive?: boolean }) => {
      const dbUpdates = mapFields(updates, {
        categoryId: 'category_id',
        bankId: 'bank_id',
        cardId: 'card_id',
        label: 'label',
        amount: 'amount',
        startDate: 'start_date',
        endDate: 'end_date',
        isActive: 'is_active',
      })

      const { data, error } = await supabase
        .from('recurring_templates')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return mapRow(data as Record<string, unknown>)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all })
    },
  })
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_templates').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all })
    },
  })
}
