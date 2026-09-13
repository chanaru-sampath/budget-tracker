import { CreditCard as CreditCardIcon } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CreditCard } from '@/hooks/use-credit-cards'
import type { InstallmentPlan } from '@/hooks/use-installments'
import type { RecurringTemplate } from '@/hooks/use-recurring'

type CreditCardBillsProps = {
  creditCards: CreditCard[]
  recurringTemplates: RecurringTemplate[]
  installments: InstallmentPlan[]
  currency: string
}

export function CreditCardBills({ creditCards, recurringTemplates, installments, currency }: CreditCardBillsProps) {
  if (creditCards.length === 0) {
    return null
  }

  const activeRecurring = recurringTemplates.filter((t) => t.isActive)
  const activeInstallments = installments.filter((i) => i.isActive && i.paidInstallments < i.totalInstallments)

  const cardBills = creditCards
    .map((card) => {
      const recurringAmount = activeRecurring.filter((t) => t.cardId === card.id).reduce((sum, t) => sum + t.amount, 0)

      const installmentsAmount = activeInstallments
        .filter((i) => i.cardId === card.id)
        .reduce((sum, i) => sum + i.monthlyAmount, 0)

      const totalAmount = recurringAmount + installmentsAmount

      return {
        card,
        recurringAmount,
        installmentsAmount,
        totalAmount,
      }
    })
    .filter((cb) => cb.totalAmount > 0)

  if (cardBills.length === 0) {
    return null
  }

  const totalCardBills = cardBills.reduce((sum, cb) => sum + cb.totalAmount, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary rounded-lg p-2">
            <CreditCardIcon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Credit Card Bills</CardTitle>
            <CardDescription>Monthly commitments per card</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-muted-foreground text-sm">Total Credit Card Bills</div>
          <div className="text-2xl font-bold">
            {currency} {totalCardBills.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {cardBills.map((cb) => (
            <div key={cb.card.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: cb.card.color }}
                >
                  <CreditCardIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">{cb.card.name}</div>
                  <div className="text-muted-foreground flex gap-2 text-xs">
                    {cb.recurringAmount > 0 && <span>Recurring: {cb.recurringAmount.toLocaleString()}</span>}
                    {cb.installmentsAmount > 0 && <span>Installments: {cb.installmentsAmount.toLocaleString()}</span>}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold">
                {currency} {cb.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
