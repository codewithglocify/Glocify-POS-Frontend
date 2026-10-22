import { useState } from 'react'

import Sidebar from '#/components/layout/Sidebar'
import Topbar from '#/components/layout/Topbar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className={`app${navOpen ? ' nav-open' : ''}`}>
      <Sidebar onNavigate={() => setNavOpen(false)} />
      <div className="main">
        <Topbar onMenuClick={() => setNavOpen((open) => !open)} />
        <div className="page">{children}</div>
      </div>
      {navOpen ? (
        <button
          type="button"
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
          style={{ border: 0, padding: 0, cursor: 'pointer' }}
        />
      ) : null}
    </div>
  )
}
