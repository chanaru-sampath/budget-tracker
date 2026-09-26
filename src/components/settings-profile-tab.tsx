import { useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { Camera, Loader2 } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { profileQueryOptions, useUpdateProfile } from '@/hooks/use-profile'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/use-auth-store'

export function SettingsProfileTab() {
  const { user } = useAuthStore()
  const { data: profile } = useSuspenseQuery(profileQueryOptions())
  const { mutate: updateProfile } = useUpdateProfile()

  const [isUploading, setIsUploading] = useState(false)

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      updateProfile({ avatar_url: publicUrl })
    } catch (error) {
      console.error('Error uploading image', error)
    } finally {
      setIsUploading(false)
    }
  }

  const fallback =
    profile?.fullName?.charAt(0)?.toUpperCase() ||
    user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    '?'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Your account details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="Avatar" className="object-cover" />}
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">{fallback}</AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            <div className="relative">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              <Button variant="outline" asChild disabled={isUploading}>
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </label>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Recommended size: 256x256px. Max: 2MB.</p>
          </div>
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
  )
}
