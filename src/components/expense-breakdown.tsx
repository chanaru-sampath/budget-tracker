import { useMemo } from 'react'

import { Cell, Pie, PieChart } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { Category } from '@/hooks/use-categories'
import type { Transaction } from '@/hooks/use-transactions'

type ExpenseBreakdownProps = {
  transactions: Transaction[]
  categories: Category[]
  currency: string
}

export function ExpenseBreakdown({ transactions, categories, currency }: ExpenseBreakdownProps) {
  const { chartData, chartConfig } = useMemo(() => {
    const map = new Map<string, number>()
    const expenses = transactions.filter((t) => t.type === 'expense')
    const total = expenses.reduce((sum, t) => sum + t.amount, 0)

    expenses.forEach((t) => {
      map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount)
    })

    const data = Array.from(map.entries())
      .map(([categoryId, amount]) => {
        const category = categories.find((c) => c.id === categoryId)
        return {
          name: category?.name || 'Unknown',
          value: amount,
          color: category?.color || '#94a3b8',
          percentage: total > 0 ? (amount / total) * 100 : 0,
        }
      })
      .sort((a, b) => b.value - a.value)

    const config: ChartConfig = {}
    data.forEach((item) => {
      config[item.name] = {
        label: item.name,
        color: item.color,
      }
    })

    return { chartData: data, chartConfig: config }
  }, [transactions, categories])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
        <CardDescription>Where your money goes</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground text-sm">No expense data yet.</p>
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[200px]">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        `${currency} ${(typeof value === 'number' ? value : Number(value)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      }
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  strokeWidth={2}
                  stroke="var(--background)"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            <div className="mt-4 space-y-3">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="size-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <div className="flex flex-1 items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <div className="text-muted-foreground flex items-center gap-2">
                      <span className="tabular-nums">{item.percentage.toFixed(1)}%</span>
                      <span className="text-foreground font-medium tabular-nums">
                        {currency}{' '}
                        {item.value.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
