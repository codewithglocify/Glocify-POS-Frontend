import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'

import { SearchIcon } from '#/icons'

export type SearchSelectOption = {
  value: string
  label: string
}

type MenuBox = {
  top: number
  left: number
  width: number
  maxHeight: number
}

function measure(trigger: HTMLButtonElement): MenuBox {
  const rect = trigger.getBoundingClientRect()
  const gap = 4
  const below = window.innerHeight - rect.bottom - gap - 8
  const above = rect.top - gap - 8
  const openUp = below < 180 && above > below
  const maxHeight = Math.max(140, Math.min(280, openUp ? above : below))
  const top = openUp
    ? Math.max(8, rect.top - gap - maxHeight)
    : rect.bottom + gap
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8))

  return { top, left, width: rect.width, maxHeight }
}

export default function SearchSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select',
  disabled = false,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  options: Array<SearchSelectOption>
  placeholder?: string
  disabled?: boolean
}) {
  const listId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [box, setBox] = useState<MenuBox | null>(null)

  const selected = options.find((option) => option.value === value) ?? null
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) {
      return options
    }
    return options.filter((option) => option.label.toLowerCase().includes(needle))
  }, [options, query])

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return
    }
    const place = () => {
      if (triggerRef.current) {
        setBox(measure(triggerRef.current))
      }
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    const option = document.getElementById(`${listId}-option-${activeIndex}`)
    const list = option?.parentElement
    if (!option || !list) {
      return
    }
    const top = option.offsetTop
    const bottom = top + option.offsetHeight
    if (top < list.scrollTop) {
      list.scrollTop = top
    } else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight
    }
  }, [activeIndex, listId, open])

  useEffect(() => {
    if (!open) {
      return
    }
    function onPointerDown(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return
      }
      setOpen(false)
      setQuery('')
    }
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery('')
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function openMenu() {
    const index = options.findIndex((option) => option.value === value)
    setActiveIndex(index >= 0 ? index : 0)
    setQuery('')
    setOpen(true)
  }

  function choose(next: string) {
    onChange(next)
    setOpen(false)
    setQuery('')
    triggerRef.current?.focus()
  }

  function onSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (filtered.length === 0) {
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && filtered[activeIndex]) {
      event.preventDefault()
      choose(filtered[activeIndex].value)
    }
  }

  const menu =
    open && box
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            className="search-select-menu"
            role="listbox"
            style={{
              top: box.top,
              left: box.left,
              width: box.width,
              maxHeight: box.maxHeight,
            }}
          >
            <div className="search-select-search">
              <SearchIcon />
              <input
                ref={searchRef}
                value={query}
                placeholder="Search"
                aria-label="Search options"
                aria-controls={listId}
                aria-activedescendant={
                  filtered[activeIndex]
                    ? `${listId}-option-${activeIndex}`
                    : undefined
                }
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={onSearchKeyDown}
              />
            </div>
            <div className="search-select-list">
              {filtered.length === 0 ? (
                <div className="search-select-empty">No matches</div>
              ) : (
                filtered.map((option, index) => (
                  <button
                    key={`${option.value}-${option.label}`}
                    id={`${listId}-option-${index}`}
                    type="button"
                    role="option"
                    className="search-select-option"
                    aria-selected={option.value === value}
                    data-active={index === activeIndex ? 'true' : 'false'}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(option.value)}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div className="search-select">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="input search-select-trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => {
          if (disabled) {
            return
          }
          if (open) {
            setOpen(false)
            setQuery('')
            return
          }
          openMenu()
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            openMenu()
          }
        }}
      >
        <span className={selected ? undefined : 'placeholder'}>
          {selected?.label ?? placeholder}
        </span>
      </button>
      {menu}
    </div>
  )
}
