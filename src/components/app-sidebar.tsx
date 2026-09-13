import { Link, useRouterState } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeftRight, CreditCard, LayoutDashboard, LogOut, Repeat, Settings, Tags, X } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/use-auth-store'
import { useUIStore } from '@/stores/use-ui-store'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: ArrowLeftRight, label: 'Transactions', to: '/transactions' },
  { icon: Repeat, label: 'Recurring', to: '/recurring' },
  { icon: CreditCard, label: 'Installments', to: '/installments' },
  { icon: Tags, label: 'Categories', to: '/categories' },
  { icon: Settings, label: 'Settings', to: '/settings' },
]

export function AppSidebar() {
  const router = useRouterState()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const setUser = useAuthStore((state) => state.setUser)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    navigate({ to: '/login' })
  }

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}
      >
        <div className="border-sidebar-border flex items-center justify-between border-b p-4 md:p-6">
          <div className="flex items-center gap-2">
            <img src="/main-logo.png" alt="Logo" className="h-12" />
          </div>
          <button className="text-muted-foreground md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = router.location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                } `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-sidebar-primary' : 'text-muted-foreground'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-sidebar-border border-t p-4">
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
          >
            <LogOut className="text-muted-foreground h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
