import { useState, type ComponentType } from 'react'
import { Link } from '@tanstack/react-router'

import {
  BrandsIcon,
  HierarchyIcon,
  ProductsIcon,
  StoresIcon,
} from '#/icons'

const organisationItems = [
  { to: '/hierarchy' as const, label: 'Hierarchy', icon: HierarchyIcon },
  { to: '/brands' as const, label: 'Brands', icon: BrandsIcon },
  { to: '/stores' as const, label: 'Stores', icon: StoresIcon },
]

const catalogueItems = [
  { to: '/products' as const, label: 'Products', icon: ProductsIcon },
]

function placeTip(target: HTMLElement) {
  const rect = target.getBoundingClientRect()
  return { top: rect.top + rect.height / 2, left: rect.right + 10 }
}

function SideLink({
  to,
  label,
  icon: Icon,
  onNavigate,
}: {
  to: '/hierarchy' | '/brands' | '/stores' | '/products'
  label: string
  icon: ComponentType
  onNavigate?: () => void
}) {
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null)

  return (
    <Link
      to={to}
      activeProps={{ className: 'active' }}
      onClick={onNavigate}
      onMouseEnter={(event) => setTip(placeTip(event.currentTarget))}
      onMouseLeave={() => setTip(null)}
      onFocus={(event) => setTip(placeTip(event.currentTarget))}
      onBlur={() => setTip(null)}
    >
      <Icon />
      <span className="nav-label">{label}</span>
      {tip ? (
        <span
          className="nav-tooltip"
          role="tooltip"
          style={{ top: tip.top, left: tip.left }}
        >
          {label}
        </span>
      ) : null}
    </Link>
  )
}

export default function Sidebar({
  onNavigate,
}: {
  onNavigate?: () => void
}) {
  return (
    <aside className="side">
      <div className="brandmark">
        <div className="logo">C·P</div>
        <div>
          <b>CORE POS</b>
          <span>Back-office admin</span>
        </div>
      </div>

      <div className="tenant">
        <b>Organisation</b>
        <span className="muted">Admin console</span>
      </div>

      <nav className="nav" id="nav">
        <div className="nav-group">
          <div className="eyebrow">Organisation</div>
          {organisationItems.map((item) => (
            <SideLink key={item.to} {...item} onNavigate={onNavigate} />
          ))}
        </div>
        <div className="nav-group">
          <div className="eyebrow">Catalogue & pricing</div>
          {catalogueItems.map((item) => (
            <SideLink key={item.to} {...item} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className="side-foot">
        Core POS Admin
        <br />
        API-complete modules only
      </div>
    </aside>
  )
}
