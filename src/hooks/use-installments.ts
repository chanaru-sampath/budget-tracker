import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { mapFields } from '@/lib/db-utils'
import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/use-auth-store'

export type InstallmentPlan = {
  id: string
  categoryId: string | null
  /** FK to credit_cards.id — installments are always on a CC */
  cardId: string | null
  label: string
  totalAmount: number
  monthlyAmount: number
  totalInstallments: number
  paidInstallments: number
  startDate: string
  notes: string | null
  isActive: boolean
  createdAt: string
}

type NewInstallmentPlan = Omit<InstallmentPlan, 'id' | 'paidInstallments' | 'isActive' | 'createdAt'>

function mapRow(row: Record<string, unknown>): InstallmentPlan {
  return {
    id: row.id as string,
    categoryId: row.category_id as string | null,
    cardId: row.card_id as string | null,
    label: row.label as string,
    totalAmount: row.total_amount as number,
    monthlyAmount: row.monthly_amount as number,
    totalInstallments: row.total_installments as number,
    paidInstallments: row.paid_installments as number,
    startDate: row.start_date as string,
    notes: row.notes as string | null,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
  }
}

export function installmentsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.installments.list(),
    queryFn: async () => {
      const user = useAuthStore.getState().user
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('installment_plans')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data.map(mapRow)
    },
  })
}

export function useInstallments() {
  return useQuery(installmentsQueryOptions())
}

export function useAddInstallment() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  return useMutation({
    mutationFn: async (plan: NewInstallmentPlan) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('installment_plans')
        .insert([
          {
            user_id: user.id,
            category_id: plan.categoryId,
            card_id: plan.cardId,
            label: plan.label,
            total_amount: plan.totalAmount,
            monthly_amount: plan.monthlyAmount,
            total_installments: plan.totalInstallments,
            start_date: plan.startDate,
            notes: plan.notes,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return mapRow(data as Record<string, unknown>)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.installments.all })
    },
  })
}

export function useUpdateInstallment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NewInstallmentPlan> & { id: string }) => {
      const dbUpdates = mapFields(updates, {
        categoryId: 'category_id',
        cardId: 'card_id',
        label: 'label',
        totalAmount: 'total_amount',
        monthlyAmount: 'monthly_amount',
        totalInstallments: 'total_installments',
        startDate: 'start_date',
        notes: 'notes',
      })

      const { data, error } = await supabase.from('installment_plans').update(dbUpdates).eq('id', id).select().single()

      if (error) throw error
      return mapRow(data as Record<string, unknown>)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.installments.all })
    },
  })
}

export function useMarkInstallmentPaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, paidInstallments }: { id: string; paidInstallments: number }) => {
      const { data, error } = await supabase
        .from('installment_plans')
        .update({ paid_installments: paidInstallments, is_active: true })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return mapRow(data as Record<string, unknown>)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.installments.all })
    },
  })
}

export function useDeleteInstallment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('installment_plans').delete().eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.installments.all })
    },
  })
}

/** Returns the end date of an installment plan (date of last payment) */
export function getInstallmentEndDate(plan: InstallmentPlan): Date {
  const start = new Date(plan.startDate)
  const end = new Date(start)
  end.setMonth(end.getMonth() + plan.totalInstallments - 1)
  return end
}

/** Returns remaining installments */
export function getRemainingInstallments(plan: InstallmentPlan): number {
  return plan.totalInstallments - plan.paidInstallments
}

/** Returns total amount remaining to pay */
export function getRemainingAmount(plan: InstallmentPlan): number {
  return plan.monthlyAmount * getRemainingInstallments(plan)
}
