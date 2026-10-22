import { useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { useAppForm } from '#/hooks/demo.form'
import { AuthError, isAuthenticated, login } from '#/lib/auth'

export const Route = createFileRoute('/login')({
  ssr: false,
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: '/hierarchy' })
    }
  },
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
        await navigate({ to: '/hierarchy' })
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
    <div className="login-page">
      <section className="panel login-card">
        <div className="panel-h">
          <div>
            <div className="eyebrow">Core POS Admin</div>
            <h1>Sign in</h1>
            <p className="sub">Company admin access with email and password.</p>
          </div>
        </div>
        <div className="panel-b">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void form.handleSubmit()
            }}
            className="stack"
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
              <p role="alert" className="alert-error">
                {formError}
              </p>
            ) : null}

            <form.AppForm>
              <form.SubscribeButton label="Sign in" />
            </form.AppForm>
          </form>
        </div>
      </section>
    </div>
  )
}
