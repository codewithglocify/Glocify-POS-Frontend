import React from 'react';
import ThemeToggle from '#/components/ThemeToggle';
import UserMenu from '#/components/layout/UserMenu';
import { BellIcon, MenuIcon, SearchIcon } from '#/icons';

const scopeFields = [
  { label: 'Region', value: 'All regions' },
  { label: 'Country', value: 'All countries' },
  { label: 'Brand', value: 'All brands' },
  { label: 'Store', value: 'All stores' },
] as const;

type TopbarProps = {
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
};

export default function Topbar({ onMenuClick, sidebarOpen = true }: TopbarProps) {
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      searchRef.current?.focus();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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

      <div className="scope">
        <span className="lbl">Scope</span>
        {scopeFields.map((field, index) => (
          <span key={field.label} className="scope-field">
            {index > 0 ? <span className="sep">›</span> : null}
            <select aria-label={field.label} defaultValue={field.value}>
              <option value={field.value}>{field.value}</option>
            </select>
          </span>
        ))}
      </div>

      <form className="search" role="search" onSubmit={(event) => event.preventDefault()}>
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
  );
}
