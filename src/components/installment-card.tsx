import { CheckCircle2, Clock, Edit2, Trash2 } from 'lucide-react'

import {
  type InstallmentPlan,
  getInstallmentEndDate,
  getRemainingAmount,
  getRemainingInstallments,
} from '@/hooks/use-installments'

import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'

export function InstallmentCard({
  plan,
  categories,
  creditCards,
  onEdit,
  onDelete,
  dimmed = false,
}: {
  plan: InstallmentPlan
  categories: { id: string; name: string; color: string; type: string }[]
  creditCards: { id: string; name: string; color: string }[]
  onEdit: () => void
  onDelete: () => void
  dimmed?: boolean
}) {
  const category = categories.find((c) => c.id === plan.categoryId)
  const remaining = getRemainingInstallments(plan)
  const remainingAmt = getRemainingAmount(plan)
  const endDate = getInstallmentEndDate(plan)
  const progress = Math.round((plan.paidInstallments / plan.totalInstallments) * 100)
  const isComplete = remaining <= 0

  return (
    <Card className={`group border-border shadow-sm transition-shadow hover:shadow-md ${dimmed ? 'opacity-60' : ''}`}>
      <CardHeader className="space-y-3 p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2">
            <p className="text-foreground leading-tight font-semibold">{plan.label}</p>
            {category && (
              <div className="mt-1 flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                <span className="text-muted-foreground text-xs">{category.name}</span>
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon" className="text-muted-foreground h-7 w-7" onClick={onEdit}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10 h-7 w-7"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {plan.paidInstallments} / {plan.totalInstallments} months
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 p-4 pt-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Monthly</span>
          <span className="font-medium">
            LKR {plan.monthlyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        {!isComplete && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className="text-destructive font-medium">
              LKR {remainingAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{isComplete ? 'Ended' : 'Last payment'}</span>
          <span className="font-medium">
            {endDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
          </span>
        </div>
        {plan.cardId &&
          (() => {
            const card = creditCards.find((c) => c.id === plan.cardId)
            return card ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Card</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: card.color }} />
                  {card.name}
                </span>
              </div>
            ) : null
          })()}

        <div className="pt-1">
          {isComplete ? (
            <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600">
              <CheckCircle2 className="h-3 w-3" /> Completed
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 border-orange-400/30 text-orange-500">
              <Clock className="h-3 w-3" /> {remaining} month{remaining !== 1 ? 's' : ''} left
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
