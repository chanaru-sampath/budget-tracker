import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Repeat } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { TemplateCard } from '@/components/template-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

const recurringSchema = z.object({
  label: z.string().min(2, 'Label must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  paymentSource: z.string().min(1, 'Payment source is required'), // Format: 'bank:ID' or 'card:ID'
  amount: z.number().positive('Amount must be greater than 0'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
})

type RecurringForm = z.infer<typeof recurringSchema>

function RecurringPage() {
  const { data: templates = [] } = useSuspenseQuery(recurringQueryOptions())
  const { data: categories = [] } = useSuspenseQuery(categoriesQueryOptions())
  const { data: banks = [] } = useSuspenseQuery(banksQueryOptions())
  const { data: creditCards = [] } = useSuspenseQuery(creditCardsQueryOptions())
  const { mutate: addRecurring } = useAddRecurring()
  const { mutate: updateRecurring } = useUpdateRecurring()
  const { mutate: deleteRecurring } = useDeleteRecurring()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const form = useForm<RecurringForm>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      label: '',
      categoryId: '',
      paymentSource: '',
      amount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    },
  })

  const openDialog = (template?: RecurringTemplate) => {
    if (template) {
      setEditingId(template.id)
      let paymentSource = ''
      if (template.bankId) paymentSource = `bank:${template.bankId}`
      if (template.cardId) paymentSource = `card:${template.cardId}`

      form.reset({
        label: template.label,
        categoryId: template.categoryId ?? '',
        paymentSource,
        amount: Number(template.amount),
        startDate: template.startDate,
        endDate: template.endDate ?? '',
      })
    } else {
      setEditingId(null)
      form.reset({
        label: '',
        categoryId: '',
        paymentSource: '',
        amount: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      })
    }
    setIsDialogOpen(true)
  }

  const onSubmit = (data: RecurringForm) => {
    const isBank = data.paymentSource.startsWith('bank:')
    const sourceId = data.paymentSource.split(':')[1]

    const payload = {
      label: data.label,
      categoryId: data.categoryId || null,
      bankId: isBank ? sourceId : null,
      cardId: !isBank ? sourceId : null,
      amount: Number(data.amount),
      startDate: data.startDate,
      endDate: data.endDate || null,
    }

    if (editingId) {
      updateRecurring({ id: editingId, ...payload })
    } else {
      addRecurring(payload)
    }
    setIsDialogOpen(false)
  }

  const toggleStatus = (id: string, currentStatus: boolean) => {
    updateRecurring({ id, isActive: !currentStatus })
  }

  const activeTemplates = templates.filter((t) => t.isActive)
  const inactiveTemplates = templates.filter((t) => !t.isActive)
  const totalMonthly = activeTemplates.reduce((sum, t) => sum + t.amount, 0)

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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Recurring
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Recurring Expense' : 'New Recurring Expense'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Netflix, Electricity Bill" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {expenseCategories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                                  {c.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="paymentSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Source</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select bank or card" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <optgroup
                            label="Bank Accounts"
                            className="text-muted-foreground px-2 py-1.5 text-sm font-semibold"
                          >
                            Bank Accounts
                          </optgroup>
                          {banks.map((bank) => (
                            <SelectItem key={`bank:${bank.id}`} value={`bank:${bank.id}`}>
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: bank.color }} />
                                {bank.name}
                              </div>
                            </SelectItem>
                          ))}
                          <optgroup
                            label="Credit Cards"
                            className="text-muted-foreground mt-2 border-t px-2 py-1.5 text-sm font-semibold"
                          >
                            Credit Cards
                          </optgroup>
                          {creditCards.map((card) => (
                            <SelectItem key={`card:${card.id}`} value={`card:${card.id}`}>
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: card.color }} />
                                {card.name} {card.bank ? `(${card.bank.name})` : ''}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="mt-4 w-full">
                  {editingId ? 'Save Changes' : 'Create Template'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Commitment</CardTitle>
            <Repeat className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-LK', {
                style: 'currency',
                currency: 'LKR',
              }).format(totalMonthly)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">Total of all active recurring expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Active Templates</h3>
        {activeTemplates.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
            <Repeat className="h-8 w-8 opacity-40" />
            <p className="text-sm">No active recurring expenses.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                categories={categories}
                banks={banks}
                creditCards={creditCards}
                onEdit={openDialog}
                onToggle={() => toggleStatus(template.id, template.isActive)}
                onDelete={() => deleteRecurring(template.id)}
              />
            ))}
          </div>
        )}

        {inactiveTemplates.length > 0 && (
          <>
            <h3 className="mt-8 text-lg font-medium">Inactive Templates</h3>
            <div className="grid gap-4 opacity-60 md:grid-cols-2 lg:grid-cols-3">
              {inactiveTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  categories={categories}
                  banks={banks}
                  creditCards={creditCards}
                  onEdit={openDialog}
                  onToggle={() => toggleStatus(template.id, template.isActive)}
                  onDelete={() => deleteRecurring(template.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
