import { useSuspenseQuery } from '@tanstack/react-query'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { type Settings, settingsQueryOptions, useUpdateSettings } from '@/hooks/use-settings'

export function SettingsPreferencesTab() {
  const { data: settings } = useSuspenseQuery(settingsQueryOptions())
  const { mutate: updateSettings } = useUpdateSettings()

  return (
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
          <Select value={settings?.theme} onValueChange={(v: Settings['theme']) => updateSettings({ theme: v })}>
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
  )
}
