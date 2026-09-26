import { createFileRoute } from '@tanstack/react-router'

import { SettingsBanksTab } from '@/components/settings-banks-tab'
import { SettingsCardsTab } from '@/components/settings-cards-tab'
import { SettingsPreferencesTab } from '@/components/settings-preferences-tab'
import { SettingsProfileTab } from '@/components/settings-profile-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { banksQueryOptions } from '@/hooks/use-banks'
import { creditCardsQueryOptions } from '@/hooks/use-credit-cards'
import { profileQueryOptions } from '@/hooks/use-profile'
import { settingsQueryOptions } from '@/hooks/use-settings'

export const Route = createFileRoute('/_app/settings')({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(settingsQueryOptions()),
      queryClient.ensureQueryData(banksQueryOptions()),
      queryClient.ensureQueryData(creditCardsQueryOptions()),
      queryClient.ensureQueryData(profileQueryOptions()),
    ])
  },
  component: SettingsPage,
})

function SettingsPage() {
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

        <TabsContent value="banks" className="mt-6">
          <SettingsBanksTab />
        </TabsContent>

        <TabsContent value="cards" className="mt-6">
          <SettingsCardsTab />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <SettingsProfileTab />
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <SettingsPreferencesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
