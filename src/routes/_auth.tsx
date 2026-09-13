import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { useAuthStore } from '@/stores/use-auth-store'

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
