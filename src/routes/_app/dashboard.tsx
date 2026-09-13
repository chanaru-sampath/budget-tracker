import { useMemo } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { format, parse, subMonths } from 'date-fns'

import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { CreditCardBills } from '@/components/credit-card-bills'
import { ExpenseBreakdown } from '@/components/expense-breakdown'
import { RecentTransactions } from '@/components/recent-transactions'
import { SectionCards } from '@/components/section-cards'
import { TransferPlan } from '@/components/transfer-plan'
import { banksQueryOptions } from '@/hooks/use-banks'
import { categoriesQueryOptions } from '@/hooks/use-categories'
import { creditCardsQueryOptions } from '@/hooks/use-credit-cards'
import { installmentsQueryOptions } from '@/hooks/use-installments'
import { recurringQueryOptions } from '@/hooks/use-recurring'
import { settingsQueryOptions } from '@/hooks/use-settings'
import { transactionsQueryOptions } from '@/hooks/use-transactions'
import { useUIStore } from '@/stores/use-ui-store'

export const Route = createFileRoute('/_app/dashboard')({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(transactionsQueryOptions()),
      queryClient.ensureQueryData(categoriesQueryOptions()),
      queryClient.ensureQueryData(settingsQueryOptions()),
      queryClient.ensureQueryData(banksQueryOptions()),
      queryClient.ensureQueryData(creditCardsQueryOptions()),
      queryClient.ensureQueryData(recurringQueryOptions()),
      queryClient.ensureQueryData(installmentsQueryOptions()),
    ])
  },
  component: Dashboard,
})

function useDashboardData() {
  return {
    transactions: useSuspenseQuery(transactionsQueryOptions()).data ?? [],
    categories: useSuspenseQuery(categoriesQueryOptions()).data ?? [],
    settings: useSuspenseQuery(settingsQueryOptions()).data,
    banks: useSuspenseQuery(banksQueryOptions()).data ?? [],
    creditCards: useSuspenseQuery(creditCardsQueryOptions()).data ?? [],
    recurringTemplates: useSuspenseQuery(recurringQueryOptions()).data ?? [],
    installments: useSuspenseQuery(installmentsQueryOptions()).data ?? [],
  }
}

function Dashboard() {
  const selectedMonth = useUIStore((state) => state.selectedMonth)
  const { transactions, categories, settings, banks, creditCards, recurringTemplates, installments } =
    useDashboardData()

  const currency = settings?.currency || 'LKR'

  const monthlyTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth))
  }, [transactions, selectedMonth])

  const prevMonth = useMemo(() => {
    const current = parse(selectedMonth, 'yyyy-MM', new Date())
    return format(subMonths(current, 1), 'yyyy-MM')
  }, [selectedMonth])

  const prevMonthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(prevMonth))
  }, [transactions, prevMonth])

  const totalIncome = useMemo(
    () => monthlyTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    [monthlyTransactions],
  )

  const totalExpenses = useMemo(
    () => monthlyTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    [monthlyTransactions],
  )

  const netSaving = totalIncome - totalExpenses

  const prevIncome = useMemo(
    () => prevMonthTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    [prevMonthTransactions],
  )

  const prevExpenses = useMemo(
    () => prevMonthTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    [prevMonthTransactions],
  )

  const prevNet = prevIncome - prevExpenses

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 md:gap-6">
      {/* Summary Cards */}
      <SectionCards
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        netSaving={netSaving}
        currency={currency}
        prevIncome={prevIncome}
        prevExpenses={prevExpenses}
        prevNet={prevNet}
        transactionCount={monthlyTransactions.length}
      />

      {/* Chart */}
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive transactions={monthlyTransactions} selectedMonth={selectedMonth} currency={currency} />
      </div>

      {/* Recent Transactions + Expense Breakdown */}
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={monthlyTransactions} categories={categories} currency={currency} />
        </div>
        <div>
          <ExpenseBreakdown transactions={monthlyTransactions} categories={categories} currency={currency} />
        </div>
      </div>

      {/* Monthly Planning */}
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
        <TransferPlan
          banks={banks}
          creditCards={creditCards}
          recurringTemplates={recurringTemplates}
          installments={installments}
          currency={currency}
        />
        <CreditCardBills
          creditCards={creditCards}
          recurringTemplates={recurringTemplates}
          installments={installments}
          currency={currency}
        />
      </div>
    </div>
  )
}
