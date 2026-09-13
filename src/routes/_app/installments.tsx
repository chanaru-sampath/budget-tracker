import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { CreditCard, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { InstallmentCard } from '@/components/installment-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { categoriesQueryOptions } from '@/hooks/use-categories'
import { creditCardsQueryOptions } from '@/hooks/use-credit-cards'
import {
  type InstallmentPlan,
  getRemainingAmount,
  installmentsQueryOptions,
  useAddInstallment,
  useDeleteInstallment,
  useUpdateInstallment,
} from '@/hooks/use-installments'

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

const installmentSchema = z.object({
  label: z.string().min(2, 'Label must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  cardId: z.string().min(1, 'Credit card is required'),
  totalAmount: z.coerce.number<number>().positive('Total amount must be greater than 0'),
  monthlyAmount: z.coerce.number<number>().positive('Monthly amount must be greater than 0'),
  totalInstallments: z.coerce.number<number>().int().min(1, 'Must have at least 1 installment'),
  startDate: z.string().min(1, 'Start date is required'),
  notes: z.string(),
})

type InstallmentForm = z.infer<typeof installmentSchema>

function InstallmentsPage() {
  const { data: plans = [] } = useSuspenseQuery(installmentsQueryOptions())
  const { data: categories = [] } = useSuspenseQuery(categoriesQueryOptions())
  const { data: creditCards = [] } = useSuspenseQuery(creditCardsQueryOptions())
  const { mutate: addInstallment } = useAddInstallment()
  const { mutate: updateInstallment } = useUpdateInstallment()
  const { mutate: deleteInstallment } = useDeleteInstallment()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const form = useForm<InstallmentForm>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      label: '',
      categoryId: '',
      cardId: '',
      totalAmount: 0,
      monthlyAmount: 0,
      totalInstallments: 12,
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  })

  const monthlyAmount = form.watch('monthlyAmount')
  const totalInstallments = form.watch('totalInstallments')

  useEffect(() => {
    form.setValue('totalAmount', (monthlyAmount || 0) * (totalInstallments || 0), {
      shouldValidate: true,
      shouldDirty: true,
    })
  }, [monthlyAmount, totalInstallments, form])

  const openDialog = (plan?: InstallmentPlan) => {
    if (plan) {
      setEditingId(plan.id)
      form.reset({
        label: plan.label,
        categoryId: plan.categoryId ?? '',
        cardId: plan.cardId ?? '',
        totalAmount: plan.totalAmount,
        monthlyAmount: plan.monthlyAmount,
        totalInstallments: plan.totalInstallments,
        startDate: plan.startDate,
        notes: plan.notes ?? '',
      })
    } else {
      setEditingId(null)
      form.reset({
        label: '',
        categoryId: '',
        cardId: '',
        totalAmount: 0,
        monthlyAmount: 0,
        totalInstallments: 12,
        startDate: new Date().toISOString().split('T')[0],
        notes: '',
      })
    }
    setIsDialogOpen(true)
  }

  const onSubmit = (data: InstallmentForm) => {
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

    if (editingId) {
      updateInstallment({ id: editingId, ...payload })
    } else {
      addInstallment(payload)
    }
    setIsDialogOpen(false)
  }

  const active = plans.filter((p) => p.isActive && p.paidInstallments < p.totalInstallments)
  const completed = plans.filter((p) => !p.isActive || p.paidInstallments >= p.totalInstallments)

  const totalMonthlyCommitment = active.reduce((sum, p) => sum + p.monthlyAmount, 0)
  const totalRemainingDebt = active.reduce((sum, p) => sum + getRemainingAmount(p), 0)

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-bold tracking-tight">Installments</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Track credit card & loan installments with a fixed payment period
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Installment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Installment Plan' : 'New Installment Plan'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                {/* Label */}
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. MacBook Pro – HNB CC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
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
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
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

                {/* Total amount + monthly amount */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount (LKR)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" disabled {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthlyAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Per Month (LKR)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Installments + start date */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalInstallments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. of Months</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} placeholder="12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Payment</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Credit Card */}
                <FormField
                  control={form.control}
                  name="cardId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Card</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a credit card" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {creditCards.map((card) => (
                            <SelectItem key={card.id} value={card.id}>
                              <span className="flex items-center gap-2">
                                <span
                                  className="inline-block h-2 w-2 rounded-full"
                                  style={{ backgroundColor: card.color }}
                                />
                                {card.name}
                                {card.bank && <span className="text-muted-foreground text-xs">({card.bank.name})</span>}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Any additional info" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  {editingId ? 'Save Changes' : 'Create Plan'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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

      {/* Active Plans */}
      <section>
        <h3 className="text-foreground mb-3 text-base font-semibold">Active Plans</h3>
        {active.length === 0 ? (
          <div className="text-muted-foreground flex h-32 flex-col items-center justify-center rounded-xl border border-dashed text-sm">
            <CreditCard className="mb-2 h-6 w-6 opacity-40" />
            No active installment plans
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {active.map((plan) => (
              <InstallmentCard
                key={plan.id}
                plan={plan}
                categories={categories}
                creditCards={creditCards}
                onEdit={() => openDialog(plan)}
                onDelete={() => deleteInstallment(plan.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Completed Plans */}
      {completed.length > 0 && (
        <section>
          <h3 className="text-foreground mb-3 text-base font-semibold">Completed / Inactive</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completed.map((plan) => (
              <InstallmentCard
                key={plan.id}
                plan={plan}
                categories={categories}
                creditCards={creditCards}
                onEdit={() => openDialog(plan)}
                onDelete={() => deleteInstallment(plan.id)}
                dimmed
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
