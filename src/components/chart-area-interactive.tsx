import { useMemo } from 'react'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { Transaction } from '@/hooks/use-transactions'

const chartConfig = {
  income: {
    label: 'Income',
    color: 'oklch(0.623 0.214 259.815)',
  },
  expense: {
    label: 'Expenses',
    color: 'oklch(0.577 0.245 27.325)',
  },
} satisfies ChartConfig

type ChartAreaInteractiveProps = {
  transactions: Transaction[]
  selectedMonth: string
  currency: string
}

export function ChartAreaInteractive({ transactions, selectedMonth, currency }: ChartAreaInteractiveProps) {
  const chartData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()

    const dailyData: { date: string; income: number; expense: number }[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayTransactions = transactions.filter((t) => t.date === dateStr)

      const income = dayTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
      const expense = dayTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

      dailyData.push({
        date: dateStr,
        income,
        expense,
      })
    }

    return dailyData
  }, [transactions, selectedMonth])

  return (
    <Card className="@container/chart">
      <CardHeader>
        <CardTitle>Income vs Expenses</CardTitle>
        <CardDescription>Daily breakdown for the selected month ({currency})</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-0">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: number) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value))}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value as string).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area dataKey="expense" type="natural" fill="url(#fillExpense)" stroke="var(--color-expense)" stackId="a" />
            <Area dataKey="income" type="natural" fill="url(#fillIncome)" stroke="var(--color-income)" stackId="b" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
