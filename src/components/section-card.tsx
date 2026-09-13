import { TrendingDown, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type SectionCardProps = {
  title: string
  amount: number
  currency: string
  trend?: number // percentage change vs last month
  description?: string
}

export function SectionCard({ title, amount, currency, trend, description }: SectionCardProps) {
  const isPositive = trend !== undefined && trend >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {currency} {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </CardTitle>
        {trend !== undefined && (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`flex gap-1 rounded-lg text-xs ${
                isPositive
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                  : 'border-rose-200 bg-rose-50 text-rose-600'
              }`}
            >
              <TrendIcon className="size-3" />
              {isPositive ? '+' : ''}
              {trend.toFixed(1)}%
            </Badge>
          </div>
        )}
      </CardHeader>
      {description && (
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="text-muted-foreground">{description}</div>
        </CardFooter>
      )}
    </Card>
  )
}
