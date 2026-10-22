import { Link } from '@tanstack/react-router'

const organisationItems = [
  { to: '/hierarchy' as const, label: 'Hierarchy' },
  { to: '/brands' as const, label: 'Brands' },
  { to: '/stores' as const, label: 'Stores' },
]

const catalogueItems = [{ to: '/products' as const, label: 'Products' }]

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
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: 'active' }}
              onClick={onNavigate}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="nav-group">
          <div className="eyebrow">Catalogue</div>
          {catalogueItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: 'active' }}
              onClick={onNavigate}
            >
              {item.label}
            </Link>
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
