import { useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/use-auth-store'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const { setUser, setInitialized } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setInitialized(true)
      setIsReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setInitialized])

  if (!isReady) {
    return null
  }

  return <>{children}</>
}
