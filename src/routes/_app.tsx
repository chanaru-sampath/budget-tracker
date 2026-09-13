import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { AppSidebar } from '@/components/app-sidebar'
import { TopBar } from '@/components/top-bar'

export const Route = createFileRoute('/_app')({
  beforeLoad: ({ context }) => {
    if (!context.auth.user) {
      throw redirect({
        to: '/login',
      })
    }
  },
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="bg-background flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex h-full w-full flex-1 flex-col">
        <TopBar />
        <main className="@container/main flex-1 overflow-y-auto py-4 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
