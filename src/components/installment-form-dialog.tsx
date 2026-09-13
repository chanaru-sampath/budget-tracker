import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import type { Category } from '@/hooks/use-categories'
import type { CreditCard } from '@/hooks/use-credit-cards'
import type { InstallmentPlan } from '@/hooks/use-installments'
import { type InstallmentFormData, installmentSchema } from '@/lib/schemas'

import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

export function InstallmentFormDialog({
  open,
  onOpenChange,
  editingPlan,
  categories,
  creditCards,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPlan: InstallmentPlan | null
  categories: Category[]
  creditCards: CreditCard[]
  onSubmit: (data: InstallmentFormData) => void
}) {
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const form = useForm<InstallmentFormData>({
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

  const monthlyAmount = useWatch({ control: form.control, name: 'monthlyAmount' })
  const totalInstallments = useWatch({ control: form.control, name: 'totalInstallments' })

  useEffect(() => {
    form.setValue('totalAmount', (monthlyAmount || 0) * (totalInstallments || 0), {
      shouldValidate: true,
      shouldDirty: true,
    })
  }, [monthlyAmount, totalInstallments, form])

  useEffect(() => {
    if (editingPlan) {
      form.reset({
        label: editingPlan.label,
        categoryId: editingPlan.categoryId ?? '',
        cardId: editingPlan.cardId ?? '',
        totalAmount: editingPlan.totalAmount,
        monthlyAmount: editingPlan.monthlyAmount,
        totalInstallments: editingPlan.totalInstallments,
        startDate: editingPlan.startDate,
        notes: editingPlan.notes ?? '',
      })
    } else {
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
  }, [editingPlan, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{editingPlan ? 'Edit Installment Plan' : 'New Installment Plan'}</DialogTitle>
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
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
