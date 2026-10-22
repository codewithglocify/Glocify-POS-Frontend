import { useNavigate } from '@tanstack/react-router'

import ThemeToggle from '#/components/ThemeToggle'
import { logout } from '#/lib/auth'

export default function Topbar({
  onMenuClick,
}: {
  onMenuClick?: () => void
}) {
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    await navigate({ to: '/login' })
  }

  return (
    <header className="topbar">
      <button
        type="button"
        className="iconbtn menu-btn"
        aria-label="Open navigation"
        onClick={onMenuClick}
      >
        ☰
      </button>

      <div className="top-right">
        <span className="env">ADMIN</span>
        <ThemeToggle />
        <button type="button" className="btn sm" onClick={() => void handleLogout()}>
          Sign out
        </button>
        <div className="avatar" aria-hidden>
          CA
        </div>
      </div>
    </header>
  )
}
