import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import type { Bank } from '@/hooks/use-banks'
import type { Category } from '@/hooks/use-categories'
import type { CreditCard } from '@/hooks/use-credit-cards'
import type { RecurringTemplate } from '@/hooks/use-recurring'
import { type RecurringFormData, recurringSchema } from '@/lib/schemas'

import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

export function RecurringFormDialog({
  open,
  onOpenChange,
  editingTemplate,
  categories,
  banks,
  creditCards,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTemplate: RecurringTemplate | null
  categories: Category[]
  banks: Bank[]
  creditCards: CreditCard[]
  onSubmit: (data: RecurringFormData) => void
}) {
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const form = useForm<RecurringFormData>({
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

  useEffect(() => {
    if (editingTemplate) {
      let paymentSource = ''
      if (editingTemplate.bankId) paymentSource = `bank:${editingTemplate.bankId}`
      if (editingTemplate.cardId) paymentSource = `card:${editingTemplate.cardId}`
      form.reset({
        label: editingTemplate.label,
        categoryId: editingTemplate.categoryId ?? '',
        paymentSource,
        amount: editingTemplate.amount,
        startDate: editingTemplate.startDate,
        endDate: editingTemplate.endDate ?? '',
      })
    } else {
      form.reset({
        label: '',
        categoryId: '',
        paymentSource: '',
        amount: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      })
    }
  }, [editingTemplate, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{editingTemplate ? 'Edit Recurring Expense' : 'New Recurring Expense'}</DialogTitle>
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
              {editingTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
