import type { User } from '@supabase/supabase-js'
import { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from 'sonner'

export type RouterContext = {
  queryClient: QueryClient
  auth: { user: User | null }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      <Toaster />
      {/* Devtools */}
      <TanStackRouterDevtools />
      <ReactQueryDevtools />
    </>
  ),
})
