import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { env } from '@/lib/env'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/use-auth-store'

export const Route = createFileRoute('/_auth/login')({
  component: Login,
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type LoginForm = z.infer<typeof loginSchema>

function Login() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      setError(authError.message)
      return
    }

    setUser(authData.user)
    navigate({ to: '/dashboard' })
  }

  return (
    <div className="bg-card text-card-foreground p-8 rounded-xl shadow-sm border border-border">
      <h1 className="text-2xl font-semibold mb-6 text-center">Welcome Back</h1>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        {env.VITE_ALLOW_SIGNUP ? (
          <Link to="/sign-up" className="text-foreground font-medium hover:underline">
            Sign up
          </Link>
        ) : (
          'Please contact Admin'
        )}
      </p>
    </div>
  )
}
