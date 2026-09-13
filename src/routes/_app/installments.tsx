import { useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { InstallmentFormDialog } from '@/components/installment-form-dialog'
import { InstallmentList } from '@/components/installment-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type ViewMode, ViewToggle } from '@/components/view-toggle'
import { categoriesQueryOptions } from '@/hooks/use-categories'
import { creditCardsQueryOptions } from '@/hooks/use-credit-cards'
import {
  type InstallmentPlan,
  getRemainingAmount,
  installmentsQueryOptions,
  useAddInstallment,
  useDeleteInstallment,
  useMarkInstallmentPaid,
  useUpdateInstallment,
} from '@/hooks/use-installments'
import type { InstallmentFormData } from '@/lib/schemas'

export const Route = createFileRoute('/_app/installments')({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(installmentsQueryOptions()),
      queryClient.ensureQueryData(categoriesQueryOptions()),
      queryClient.ensureQueryData(creditCardsQueryOptions()),
    ])
  },
  component: InstallmentsPage,
})

function InstallmentsPage() {
  const { data: plans = [] } = useSuspenseQuery(installmentsQueryOptions())
  const { data: categories = [] } = useSuspenseQuery(categoriesQueryOptions())
  const { data: creditCards = [] } = useSuspenseQuery(creditCardsQueryOptions())
  const { mutate: addInstallment } = useAddInstallment()
  const { mutate: updateInstallment } = useUpdateInstallment()
  const { mutate: deleteInstallment } = useDeleteInstallment()
  const { mutate: markPaid } = useMarkInstallmentPaid()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<InstallmentPlan | null>(null)
  const [view, setView] = useState<ViewMode>('card')

  const active = plans.filter((p) => p.isActive && p.paidInstallments < p.totalInstallments)
  const completed = plans.filter((p) => !p.isActive || p.paidInstallments >= p.totalInstallments)
  const totalMonthlyCommitment = active.reduce((sum, p) => sum + p.monthlyAmount, 0)
  const totalRemainingDebt = active.reduce((sum, p) => sum + getRemainingAmount(p), 0)

  const openDialog = (plan?: InstallmentPlan) => {
    setEditingPlan(plan ?? null)
    setIsDialogOpen(true)
  }

  const onSubmit = (data: InstallmentFormData) => {
    const payload = {
      label: data.label,
      categoryId: data.categoryId || null,
      cardId: data.cardId || null,
      totalAmount: data.totalAmount,
      monthlyAmount: data.monthlyAmount,
      totalInstallments: data.totalInstallments,
      startDate: data.startDate,
      notes: data.notes || null,
    }
    if (editingPlan) {
      updateInstallment({ id: editingPlan.id, ...payload })
    } else {
      addInstallment(payload)
    }
    setIsDialogOpen(false)
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-bold tracking-tight">Installments</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Track credit card &amp; loan installments with a fixed payment period
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Installment
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {active.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">Active Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{active.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">Monthly Commitment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-500">
                {totalMonthlyCommitment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                <span className="text-muted-foreground ml-1 text-sm font-normal">LKR/mo</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">Total Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive text-2xl font-bold">
                {totalRemainingDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                <span className="text-muted-foreground ml-1 text-sm font-normal">LKR</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Form dialog */}
      <InstallmentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingPlan={editingPlan}
        categories={categories}
        creditCards={creditCards}
        onSubmit={onSubmit}
      />

      {/* List */}
      <InstallmentList
        plans={plans}
        active={active}
        completed={completed}
        categories={categories}
        creditCards={creditCards}
        view={view}
        onEdit={openDialog}
        onDelete={(id) => deleteInstallment(id)}
        onMarkPaid={(id, paid) => markPaid({ id, paidInstallments: paid })}
      />
    </div>
  )
}
