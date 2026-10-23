import { useEffect, useRef } from 'react'

import ThemeToggle from '#/components/ThemeToggle'
import ScopeBar from '#/components/layout/ScopeBar'
import UserMenu from '#/components/layout/UserMenu'
import { BellIcon, MenuIcon, SearchIcon } from '#/icons'

export default function Topbar({
  onMenuClick,
  sidebarOpen = true,
}: {
  onMenuClick?: () => void
  sidebarOpen?: boolean
}) {
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }

      event.preventDefault()
      searchRef.current?.focus()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <header className="topbar">
      <button
        type="button"
        className="iconbtn menu-btn"
        aria-label={sidebarOpen ? 'Collapse navigation' : 'Expand navigation'}
        aria-expanded={sidebarOpen}
        onClick={onMenuClick}
      >
        <MenuIcon />
      </button>

      <ScopeBar />

      <form
        className="search"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <SearchIcon />
        <input
          ref={searchRef}
          type="text"
          placeholder="Jump to a store, module or setting"
          aria-label="Jump to a store, module or setting"
        />
        <kbd>/</kbd>
      </form>

      <div className="top-right">
        <span className="env">PROD</span>
        <button type="button" className="iconbtn" aria-label="Notifications">
          <BellIcon />
          <span className="dot" />
        </button>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
