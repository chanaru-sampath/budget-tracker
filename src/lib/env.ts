import { z } from 'zod'

const envSchema = z.object({
  VITE_ALLOW_SIGNUP: z.enum(['true', 'false']).transform((v) => v === 'true'),
  VITE_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'Supabase key is required'),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables')
}

export const env = parsed.data
