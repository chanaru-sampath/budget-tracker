import { Building2 } from 'lucide-react'

import { Banks } from '@/components/banks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SettingsBanksTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Bank Accounts
        </CardTitle>
        <CardDescription>
          Define your bank accounts. Mark your primary salary account — monthly transfer amounts are calculated relative
          to it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Banks />
      </CardContent>
    </Card>
  )
}
