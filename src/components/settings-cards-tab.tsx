import { CreditCard as CreditCardIcon } from 'lucide-react'

import { CreditCardsTab } from '@/components/credit-cards'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SettingsCardsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5" />
          Credit Cards
        </CardTitle>
        <CardDescription>
          Link credit cards to their bank account. Each month the app totals CC charges and includes them in the
          transfer calculation for that bank.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CreditCardsTab />
      </CardContent>
    </Card>
  )
}
