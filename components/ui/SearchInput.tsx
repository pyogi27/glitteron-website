'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MAX_SEARCH_LENGTH } from '@/lib/data/filters'

/** Pause after the last keystroke before searching; every search is a server render. */
const SEARCH_DEBOUNCE_MS = 350

interface Props {
  /** The listing URL for a term. An empty term must drop `q`. */
  hrefFor: (term: string) => string
  defaultValue?: string
  autoFocus?: boolean
  /** Just before a search navigates, e.g. to bring the grid's first row into view. */
  onNavigate?: () => void
  /** After Enter, e.g. to close the panel the field sits in. */
  onSubmit?: () => void
  className?: string
}

/**
 * Live product search: the grid follows the typing, no Enter needed. The term
 * lives in the URL (?q=), so the server renders the results and they can be
 * shared. Typing on /collections replaces the history entry instead of stacking
 * one per pause; arriving from another page pushes a single entry.
 */
export default function SearchInput({ hrefFor, defaultValue = '', autoFocus, onNavigate, onSubmit, className = '' }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Follow a term set elsewhere (the other search field, the back button), but
  // never overwrite what the shopper is typing.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setValue(defaultValue)
  }, [defaultValue])

  useEffect(() => () => clearTimeout(timer.current), [])

  function search(raw: string) {
    clearTimeout(timer.current)
    const term = raw.trim()
    const { pathname, search: query } = window.location
    // An emptied field off a search page has nothing to undo.
    if (!term && !new URLSearchParams(query).has('q')) return
    const href = hrefFor(term)
    if (href === pathname + query) return
    onNavigate?.()
    startTransition(() => {
      if (pathname === '/collections') router.replace(href, { scroll: false })
      else router.push(href)
    })
  }

  return (
    <form
      role="search"
      action="/collections"
      onSubmit={e => {
        e.preventDefault()
        search(value)
        onSubmit?.()
      }}
      className={`relative flex items-center ${className}`}
    >
      <span className="pointer-events-none absolute left-3.5 text-[#A09488]" aria-hidden="true">
        {isPending ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.2-8.56" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        )}
      </span>
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={value}
        onChange={e => {
          const next = e.target.value
          setValue(next)
          clearTimeout(timer.current)
          timer.current = setTimeout(() => search(next), SEARCH_DEBOUNCE_MS)
        }}
        maxLength={MAX_SEARCH_LENGTH}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder="Search chandeliers, pendants…"
        aria-label="Search products"
        aria-busy={isPending}
        className="w-full h-10 pl-10 pr-10 rounded-full border border-[#D8D0C4] bg-[#FAF7F2] font-sans text-[13px] text-[#2C2825] placeholder:text-[#A09488] outline-none transition-colors focus:border-[#C4714A] focus:ring-2 focus:ring-[#C4714A]/25 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setValue('')
            search('')
            inputRef.current?.focus()
          }}
          className="absolute right-2 w-7 h-7 flex items-center justify-center rounded-full text-[#8B7D6E] transition-colors hover:bg-[#EDE8E0] hover:text-[#2C2825] cursor-none"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </form>
  )
}
