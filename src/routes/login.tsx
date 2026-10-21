import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { useAppForm } from '#/hooks/demo.form'
import { AuthError, login } from '#/lib/auth'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

const schema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

function LoginPage() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onBlur: schema,
    },
    onSubmit: async ({ value }) => {
      setFormError(null)
      try {
        await login({ email: value.email, password: value.password })
        await navigate({ to: '/' })
      } catch (error) {
        if (error instanceof AuthError) {
          setFormError(error.message)
          return
        }
        setFormError(
          error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.',
        )
      }
    },
  })

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative mx-auto max-w-md overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />

        <p className="island-kicker mb-3">Welcome back</p>
        <h1 className="display-title mb-3 text-3xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
          Sign in
        </h1>
        <p className="mb-8 text-base text-[var(--sea-ink-soft)]">
          Enter your email and password to continue.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className="relative space-y-5"
        >
          <form.AppField name="email">
            {(field) => (
              <field.TextField
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
              />
            )}
          </form.AppField>

          <form.AppField name="password">
            {(field) => (
              <field.TextField
                label="Password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            )}
          </form.AppField>

          {formError ? (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            >
              {formError}
            </p>
          ) : null}

          <div className="pt-1">
            <form.AppForm>
              <form.SubscribeButton label="Sign in" />
            </form.AppForm>
          </div>
        </form>
      </section>
    </main>
  )
}
