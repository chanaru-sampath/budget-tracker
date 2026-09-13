import { z } from 'zod'

export const installmentSchema = z.object({
  label: z.string().min(2, 'Label must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  cardId: z.string().min(1, 'Credit card is required'),
  totalAmount: z.coerce.number<number>().positive('Total amount must be greater than 0'),
  monthlyAmount: z.coerce.number<number>().positive('Monthly amount must be greater than 0'),
  totalInstallments: z.coerce.number<number>().int().min(1, 'Must have at least 1 installment'),
  startDate: z.string().min(1, 'Start date is required'),
  notes: z.string(),
})

export type InstallmentFormData = z.infer<typeof installmentSchema>

export const recurringSchema = z.object({
  label: z.string().min(2, 'Label must be at least 2 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  paymentSource: z.string().min(1, 'Payment source is required'),
  amount: z.coerce.number<number>().positive('Amount must be greater than 0'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
})

export type RecurringFormData = z.infer<typeof recurringSchema>

export const categorySchema = z.object({
  type: z.enum(['income', 'expense']),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  color: z.string().min(1, 'Color is required'),
})

export type CategoryFormData = z.infer<typeof categorySchema>

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number<number>().positive('Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string(),
})

export type TransactionFormData = z.infer<typeof transactionSchema>
