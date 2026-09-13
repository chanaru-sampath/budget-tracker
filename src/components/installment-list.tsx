import { CreditCard, Edit2, Trash2 } from 'lucide-react'

import type { Category } from '@/hooks/use-categories'
import type { CreditCard as CreditCardType } from '@/hooks/use-credit-cards'
import { type InstallmentPlan, getRemainingInstallments, isCurrentMonthPaid } from '@/hooks/use-installments'

import { InstallmentCard } from './installment-card'
import { Button } from './ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { type ViewMode } from './view-toggle'

export function InstallmentList({
  active,
  completed,
  plans,
  categories,
  creditCards,
  view,
  onEdit,
  onDelete,
  onMarkPaid,
}: {
  plans: InstallmentPlan[]
  active: InstallmentPlan[]
  completed: InstallmentPlan[]
  categories: Category[]
  creditCards: CreditCardType[]
  view: ViewMode
  onEdit: (plan: InstallmentPlan) => void
  onDelete: (id: string) => void
  onMarkPaid: (id: string, paidInstallments: number) => void
}) {
  if (view === 'card') {
    return (
      <>
        <section>
          <h3 className="text-foreground mb-3 text-base font-semibold">Active Plans</h3>
          {active.length === 0 ? (
            <div className="text-muted-foreground flex h-32 flex-col items-center justify-center rounded-xl border border-dashed text-sm">
              <CreditCard className="mb-2 h-6 w-6 opacity-40" />
              No active installment plans
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {active.map((plan) => (
                <InstallmentCard
                  key={plan.id}
                  plan={plan}
                  categories={categories}
                  creditCards={creditCards}
                  onEdit={() => onEdit(plan)}
                  onDelete={() => onDelete(plan.id)}
                  onMarkPaid={() => onMarkPaid(plan.id, plan.paidInstallments + 1)}
                />
              ))}
            </div>
          )}
        </section>

        {completed.length > 0 && (
          <section>
            <h3 className="text-foreground mb-3 text-base font-semibold">Completed / Inactive</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completed.map((plan) => (
                <InstallmentCard
                  key={plan.id}
                  plan={plan}
                  categories={categories}
                  creditCards={creditCards}
                  onEdit={() => onEdit(plan)}
                  onDelete={() => onDelete(plan.id)}
                  dimmed
                />
              ))}
            </div>
          </section>
        )}
      </>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Card</TableHead>
            <TableHead className="text-right">Monthly</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                No installment plans yet.
              </TableCell>
            </TableRow>
          ) : (
            plans.map((plan) => {
              const category = categories.find((c) => c.id === plan.categoryId)
              const card = creditCards.find((c) => c.id === plan.cardId)
              const isComplete = plan.paidInstallments >= plan.totalInstallments
              const paidThisMonth = isCurrentMonthPaid(plan)
              const remaining = getRemainingInstallments(plan)
              const progress = Math.round((plan.paidInstallments / plan.totalInstallments) * 100)

              return (
                <TableRow key={plan.id} className={isComplete ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{plan.label}</TableCell>
                  <TableCell>
                    {category ? (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {card ? (
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: card.color }} />
                        {card.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {plan.monthlyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-muted h-1.5 w-20 overflow-hidden rounded-full">
                        <div
                          className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {plan.paidInstallments}/{plan.totalInstallments}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isComplete ? (
                      <span className="text-xs font-medium text-emerald-600">Completed</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">{remaining} left</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!isComplete && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={paidThisMonth}
                          onClick={() => onMarkPaid(plan.id, plan.paidInstallments + 1)}
                        >
                          {paidThisMonth ? 'Paid' : 'Pay'}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(plan)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-7 w-7"
                        onClick={() => onDelete(plan.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
