import { ArrowRightLeft } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Bank } from '@/hooks/use-banks'
import type { CreditCard } from '@/hooks/use-credit-cards'
import type { InstallmentPlan } from '@/hooks/use-installments'
import type { RecurringTemplate } from '@/hooks/use-recurring'

type TransferPlanProps = {
  banks: Bank[]
  creditCards: CreditCard[]
  recurringTemplates: RecurringTemplate[]
  installments: InstallmentPlan[]
  currency: string
}

export function TransferPlan({ banks, creditCards, recurringTemplates, installments, currency }: TransferPlanProps) {
  const salaryAccount = banks.find((b) => b.isSalaryAccount)
  const otherBanks = banks.filter((b) => !b.isSalaryAccount)

  if (!salaryAccount) {
    return null
  }

  const activeRecurring = recurringTemplates.filter((t) => t.isActive)
  const activeInstallments = installments.filter((i) => i.isActive && i.paidInstallments < i.totalInstallments)

  const bankTransfers = otherBanks
    .map((bank) => {
      // 1. Direct bank recurring templates
      const bankRecurringAmount = activeRecurring
        .filter((t) => t.bankId === bank.id)
        .reduce((sum, t) => sum + t.amount, 0)

      // 2. Credit cards connected to this bank
      const bankCards = creditCards.filter((c) => c.bankId === bank.id)

      // 3. Card recurring templates
      const cardsRecurringAmount = activeRecurring
        .filter((t) => t.cardId && bankCards.some((c) => c.id === t.cardId))
        .reduce((sum, t) => sum + t.amount, 0)

      // 4. Card installments
      const cardsInstallmentsAmount = activeInstallments
        .filter((i) => i.cardId && bankCards.some((c) => c.id === i.cardId))
        .reduce((sum, i) => sum + i.monthlyAmount, 0)

      const totalRequired = bankRecurringAmount + cardsRecurringAmount + cardsInstallmentsAmount

      return {
        bank,
        totalRequired,
        details: {
          bankRecurringAmount,
          cardsRecurringAmount,
          cardsInstallmentsAmount,
        },
      }
    })
    .filter((bt) => bt.totalRequired > 0)

  if (bankTransfers.length === 0) {
    return null
  }

  const grandTotal = bankTransfers.reduce((sum, bt) => sum + bt.totalRequired, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary rounded-lg p-2">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Transfer Plan</CardTitle>
            <CardDescription>From {salaryAccount.name}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-muted-foreground text-sm">Total to Transfer</div>
          <div className="text-2xl font-bold">
            {currency} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {bankTransfers.map((bt) => (
            <div key={bt.bank.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: bt.bank.color }}
                >
                  {bt.bank.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium">{bt.bank.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {bt.details.bankRecurringAmount > 0 && <span>Direct bills</span>}
                    {(bt.details.cardsRecurringAmount > 0 || bt.details.cardsInstallmentsAmount > 0) && (
                      <span>{bt.details.bankRecurringAmount > 0 ? ' + ' : ''}CC bills</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold">
                {currency} {bt.totalRequired.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
