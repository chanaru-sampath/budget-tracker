import { useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Repeat } from 'lucide-react'

import { RecurringFormDialog } from '@/components/recurring-form-dialog'
import { RecurringList } from '@/components/recurring-list'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type ViewMode, ViewToggle } from '@/components/view-toggle'
import { banksQueryOptions } from '@/hooks/use-banks'
import { categoriesQueryOptions } from '@/hooks/use-categories'
import { creditCardsQueryOptions } from '@/hooks/use-credit-cards'
import {
  type RecurringTemplate,
  recurringQueryOptions,
  useAddRecurring,
  useDeleteRecurring,
  useUpdateRecurring,
} from '@/hooks/use-recurring'
import type { RecurringFormData } from '@/lib/schemas'

export const Route = createFileRoute('/_app/recurring')({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(recurringQueryOptions()),
      queryClient.ensureQueryData(categoriesQueryOptions()),
      queryClient.ensureQueryData(banksQueryOptions()),
      queryClient.ensureQueryData(creditCardsQueryOptions()),
    ])
  },
  component: RecurringPage,
})

function RecurringPage() {
  const { data: templates = [] } = useSuspenseQuery(recurringQueryOptions())
  const { data: categories = [] } = useSuspenseQuery(categoriesQueryOptions())
  const { data: banks = [] } = useSuspenseQuery(banksQueryOptions())
  const { data: creditCards = [] } = useSuspenseQuery(creditCardsQueryOptions())
  const { mutate: addRecurring } = useAddRecurring()
  const { mutate: updateRecurring } = useUpdateRecurring()
  const { mutate: deleteRecurring } = useDeleteRecurring()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null)
  const [view, setView] = useState<ViewMode>('card')

  const activeTemplates = templates.filter((t) => t.isActive)
  const inactiveTemplates = templates.filter((t) => !t.isActive)
  const totalMonthly = activeTemplates.reduce((sum, t) => sum + t.amount, 0)

  const openDialog = (template?: RecurringTemplate) => {
    setEditingTemplate(template ?? null)
    setIsDialogOpen(true)
  }

  const onSubmit = (data: RecurringFormData) => {
    const isBank = data.paymentSource.startsWith('bank:')
    const sourceId = data.paymentSource.split(':')[1]
    const payload = {
      label: data.label,
      categoryId: data.categoryId || null,
      bankId: isBank ? sourceId : null,
      cardId: !isBank ? sourceId : null,
      amount: data.amount,
      startDate: data.startDate,
      endDate: data.endDate || null,
    }
    if (editingTemplate) {
      updateRecurring({ id: editingTemplate.id, ...payload })
    } else {
      addRecurring(payload)
    }
    setIsDialogOpen(false)
  }

  const onToggle = (id: string, currentStatus: boolean) => {
    updateRecurring({ id, isActive: !currentStatus })
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-bold tracking-tight">Recurring Expenses</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your monthly bills, subscriptions, and standing orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          <Button onClick={() => openDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Recurring
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Commitment</CardTitle>
            <Repeat className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(totalMonthly)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">Total of all active recurring expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Form dialog */}
      <RecurringFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingTemplate={editingTemplate}
        categories={categories}
        banks={banks}
        creditCards={creditCards}
        onSubmit={onSubmit}
      />

      {/* List */}
      <RecurringList
        templates={templates}
        activeTemplates={activeTemplates}
        inactiveTemplates={inactiveTemplates}
        categories={categories}
        banks={banks}
        creditCards={creditCards}
        view={view}
        onEdit={openDialog}
        onToggle={onToggle}
        onDelete={(id) => deleteRecurring(id)}
      />
    </div>
  )
}
