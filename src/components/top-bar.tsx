import { useRouterState } from '@tanstack/react-router'
import { Menu } from 'lucide-react'

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

  const currentPath = Object.keys(routeTitles).find((path) => router.location.pathname.startsWith(path))
  const title = currentPath ? routeTitles[currentPath] : 'Dashboard'

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
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-sm">
            {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>
      </div>
    </header>
  )
}
