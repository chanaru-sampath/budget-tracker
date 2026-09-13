import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Building2, CreditCard as CreditCardIcon } from 'lucide-react'

import { Banks } from '@/components/banks'
import { CreditCardsTab } from '@/components/credit-cards'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { banksQueryOptions } from '@/hooks/use-banks'
import { creditCardsQueryOptions } from '@/hooks/use-credit-cards'
import { settingsQueryOptions, useUpdateSettings } from '@/hooks/use-settings'
import { useAuthStore } from '@/stores/use-auth-store'

export const Route = createFileRoute('/_app/settings')({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(settingsQueryOptions()),
      queryClient.ensureQueryData(banksQueryOptions()),
      queryClient.ensureQueryData(creditCardsQueryOptions()),
    ])
  },
  component: SettingsPage,
})

function SettingsPage() {
  const { user } = useAuthStore()
  const { data: settings } = useSuspenseQuery(settingsQueryOptions())
  const { mutate: updateSettings } = useUpdateSettings()

  return (
    <div className="mx-auto max-w-5xl flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div>
        <h2 className="text-foreground text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account, banks, cards and preferences.</p>
      </div>

      <Tabs defaultValue="banks" className="w-full">
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="banks">Banks</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* ── Banks ── */}
        <TabsContent value="banks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Bank Accounts
              </CardTitle>
              <CardDescription>
                Define your bank accounts. Mark your primary salary account — monthly transfer amounts are calculated
                relative to it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Banks />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Credit Cards ── */}
        <TabsContent value="cards" className="mt-6">
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
        </TabsContent>

        {/* ── Profile ── */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'user'}`} />
                  <AvatarFallback>BT</AvatarFallback>
                </Avatar>
              </div>
              <div className="max-w-md space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input disabled value={user?.email || 'user@example.com'} />
                  <p className="text-muted-foreground text-xs">
                    Your email address is managed by your authentication provider.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Preferences ── */}
        <TabsContent value="preferences" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>Customize how the budget tracker looks and behaves.</CardDescription>
            </CardHeader>
            <CardContent className="max-w-md space-y-6">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={settings?.currency} onValueChange={(v) => updateSettings({ currency: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LKR">Sri Lankan Rupee (LKR)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="GBP">British Pound (£)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">This currency will be used throughout the app.</p>
              </div>

              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={settings?.theme}
                  onValueChange={(v: 'light' | 'dark' | 'system') => updateSettings({ theme: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-muted-foreground text-sm">Receive alerts about your budget.</p>
                </div>
                <Switch
                  checked={settings?.notificationsEnabled}
                  onCheckedChange={(v) => updateSettings({ notificationsEnabled: v })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
