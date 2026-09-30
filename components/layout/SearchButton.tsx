'use client'
import { useEffect, useRef, useState } from 'react'
import SearchInput from '@/components/ui/SearchInput'

/**
 * On /collections the header search refines the listing on screen, keeping its
 * other filters; from any other page it starts a fresh one. Reads the location
 * at call time, so it is only ever called from the browser.
 */
function headerHref(term: string): string {
  const onListing = window.location.pathname === '/collections'
  const params = new URLSearchParams(onListing ? window.location.search : '')
  if (term) params.set('q', term)
  else params.delete('q')
  params.delete('page')
  const query = params.toString()
  return query ? `/collections?${query}` : '/collections'
}

/**
 * The header's live search field. It mounts only when its panel or menu opens,
 * never on the server, which is what lets it read the current ?q= directly.
 */
export function HeaderSearch({ autoFocus, onNavigate, onSubmit }: {
  autoFocus?: boolean
  onNavigate?: () => void
  onSubmit?: () => void
}) {
  const current = window.location.pathname === '/collections'
    ? new URLSearchParams(window.location.search).get('q') ?? ''
    : ''
  return <SearchInput hrefFor={headerHref} defaultValue={current} autoFocus={autoFocus} onNavigate={onNavigate} onSubmit={onSubmit} />
}

/** Header icon that opens the search field in a dropdown, like the account menu. */
export default function SearchButton({ isLight }: { isLight: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="Search"
        aria-expanded={open}
        className={`cursor-none border-none bg-transparent w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
          isLight
            ? 'text-white/80 hover:text-gold'
            : 'text-dark opacity-70 hover:opacity-100 hover:text-gold-dark'
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </button>

      {/* The header persists across navigation, so the panel stays open while
          typing carries the shopper from another page onto /collections. */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] w-[320px] p-2 rounded-[18px] border border-[#D8D0C4] bg-white shadow-[0_12px_40px_rgba(44,40,37,0.14)] z-50">
          <HeaderSearch autoFocus onSubmit={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
