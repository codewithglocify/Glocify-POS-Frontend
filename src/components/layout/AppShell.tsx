import { useState } from 'react'

import Sidebar from '#/components/layout/Sidebar'
import Topbar from '#/components/layout/Topbar'

const DESKTOP_NAV = '(min-width: 901px)'

function sidebarStartsOpen(): boolean {
  if (typeof window === 'undefined') {
    return true
  }
  return window.matchMedia(DESKTOP_NAV).matches
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(sidebarStartsOpen)

  function closeIfOverlay() {
    if (!window.matchMedia(DESKTOP_NAV).matches) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className={`app${sidebarOpen ? ' sidebar-open' : ''}`}>
      <Sidebar onNavigate={closeIfOverlay} />
      <div className="main">
        <Topbar
          sidebarOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen((open) => !open)}
        />
        <div className="page">{children}</div>
      </div>
      {sidebarOpen ? (
        <button
          type="button"
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          style={{ border: 0, padding: 0, cursor: 'pointer' }}
        />
      ) : null}
    </div>
  )
}
