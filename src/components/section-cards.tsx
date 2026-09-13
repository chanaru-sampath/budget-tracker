import { SectionCard } from './section-card'

type SectionCardsProps = {
  totalIncome: number
  totalExpenses: number
  netSaving: number
  currency: string
  prevIncome: number
  prevExpenses: number
  prevNet: number
  transactionCount: number
}

export function SectionCards({
  totalIncome,
  totalExpenses,
  netSaving,
  currency,
  prevIncome,
  prevExpenses,
  prevNet,
  transactionCount,
}: SectionCardsProps) {
  const incomeTrend = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0
  const expenseTrend = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0
  const netTrend = prevNet !== 0 ? ((netSaving - prevNet) / Math.abs(prevNet)) * 100 : 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <SectionCard
        title="Total Income"
        amount={totalIncome}
        currency={currency}
        trend={prevIncome > 0 ? incomeTrend : undefined}
        description={`${transactionCount} transactions this month`}
      />
      <SectionCard
        title="Total Expenses"
        amount={totalExpenses}
        currency={currency}
        trend={prevExpenses > 0 ? expenseTrend : undefined}
        description="Across all categories"
      />
      <SectionCard
        title="Net Savings"
        amount={netSaving}
        currency={currency}
        trend={prevNet !== 0 ? netTrend : undefined}
        description={netSaving >= 0 ? "You're saving money!" : 'Spending exceeds income'}
      />
      <SectionCard
        title="Balance"
        amount={totalIncome - totalExpenses}
        currency={currency}
        description="Current month balance"
      />
    </div>
  )
}
