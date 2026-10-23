import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { SignOutIcon } from '#/icons'
import { apiRequest } from '#/lib/api/client'
import { logout } from '#/lib/auth'

type CurrentUser = {
  displayName: string
  email: string
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return 'U'
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export default function UserMenu() {
  const navigate = useNavigate()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    let cancelled = false

    apiRequest<CurrentUser>('/v1/authorization/me')
      .then((profile) => {
        if (!cancelled) {
          setUser({
            displayName: profile.displayName,
            email: profile.email,
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function handleSignOut() {
    setOpen(false)
    await logout()
    await navigate({ to: '/login' })
  }

  const name = user?.displayName ?? 'Account'
  const email = user?.email ?? ''

  return (
    <div className="user-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((current) => !current)}
      >
        {initials(user?.displayName ?? '')}
      </button>
      {open ? (
        <div className="user-menu" role="menu">
          <div className="user-menu-id">
            <b>{name}</b>
            {email ? <span>{email}</span> : null}
          </div>
          <button type="button" role="menuitem" onClick={() => void handleSignOut()}>
            <SignOutIcon />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
