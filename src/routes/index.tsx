import { createFileRoute, redirect } from '@tanstack/react-router'

import { isAuthenticated } from '#/lib/auth'

export const Route = createFileRoute('/')({
  ssr: false,
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: '/hierarchy' })
    }
    throw redirect({ to: '/login' })
  },
})
