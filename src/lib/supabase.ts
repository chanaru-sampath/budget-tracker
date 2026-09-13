import { createBrowserClient } from '@supabase/ssr'

import { env } from './env'

export const supabase = createBrowserClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
