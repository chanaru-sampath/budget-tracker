import { useRouterState } from '@tanstack/react-router'
import { Menu } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useProfile } from '@/hooks/use-profile'
import { useAuthStore } from '@/stores/use-auth-store'
import { useUIStore } from '@/stores/use-ui-store'

import { MonthSelector } from './month-selector'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/categories': 'Categories',
  '/settings': 'Settings',
}

export function TopBar() {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const router = useRouterState()
  const user = useAuthStore((state) => state.user)
  const { data: profile } = useProfile()

  const currentPath = Object.keys(routeTitles).find((path) => router.location.pathname.startsWith(path))
  const title = currentPath ? routeTitles[currentPath] : 'Dashboard'

  const fallback =
    profile?.fullName?.charAt(0)?.toUpperCase() ||
    user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    '?'

  return (
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-4 md:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 -ml-2 text-muted-foreground hover:bg-accent rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <MonthSelector />
        <div className="hidden sm:flex items-center gap-2 border-l border-border pl-4 ml-2">
          <Avatar size="default">
            {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="Avatar" className="object-cover" />}
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">{fallback}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
