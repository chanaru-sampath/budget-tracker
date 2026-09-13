import { useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { TransactionFormDialog } from '@/components/transaction-form-dialog'
import { TransactionTable } from '@/components/transaction-table'
import { Button } from '@/components/ui/button'
import { categoriesQueryOptions } from '@/hooks/use-categories'
import { transactionsQueryOptions, useAddTransaction, useDeleteTransaction } from '@/hooks/use-transactions'
import type { TransactionFormData } from '@/lib/schemas'

export const Route = createFileRoute('/_app/transactions')({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(transactionsQueryOptions()),
      queryClient.ensureQueryData(categoriesQueryOptions()),
    ])
  },
  component: TransactionsPage,
})

function TransactionsPage() {
  const { data: transactions = [] } = useSuspenseQuery(transactionsQueryOptions())
  const { data: categories = [] } = useSuspenseQuery(categoriesQueryOptions())
  const { mutate: addTransaction } = useAddTransaction()
  const { mutate: deleteTransaction } = useDeleteTransaction()

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const onSubmit = (data: TransactionFormData) => {
    addTransaction({ ...data, notes: data.notes || '' })
    setIsDialogOpen(false)
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-foreground text-3xl font-bold tracking-tight">Transactions</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <TransactionFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        categories={categories}
        onSubmit={onSubmit}
      />

      <TransactionTable
        transactions={sortedTransactions}
        categories={categories}
        onDelete={(id) => deleteTransaction(id)}
      />
    </div>
  )
}
