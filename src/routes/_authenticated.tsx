import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import AppShell from '#/components/layout/AppShell'
import { isAuthenticated } from '#/lib/auth'

export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
