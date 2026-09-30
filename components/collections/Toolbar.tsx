'use client'
import { useEffect, useRef, useState } from 'react'
import { useFilterStore } from '@/lib/stores/filterStore'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import LightToggle from '@/components/ui/LightToggle'
import FilterSidebar from '@/components/collections/FilterSidebar'
import { listingHref, type ListingFilters } from '@/lib/data/filters'

/** Pixels a scroll must travel before the chrome reacts — swallows trackpad jitter. */
const SCROLL_TOLERANCE = 8
/** Hover intent: a pointer merely crossing the Filters button should not flash the panel. */
const HOVER_OPEN_DELAY = 150
/** Grace for the pointer to travel from the button down into the panel. */
const HOVER_CLOSE_DELAY = 300

/**
 * The filter panel starts hidden. Hovering the button peeks it open and leaving
 * closes it again; a click — on the button or anywhere inside the panel — pins
 * it until the button, the backdrop or Escape closes it. Touch and keyboard
 * never peek, so for them the button is a plain toggle.
 */
type PanelState = 'closed' | 'peek' | 'pinned'

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
]

interface Category {
  id?: number
  name: string
}

interface Props {
  categories?: Category[]
  total?: number
  /** The listing's filter state, for the filter panel and the button's count. */
  filters: ListingFilters
  /** Where filter changes navigate: /collections, or the category landing page itself. */
  filterPath: string
}

export default function Toolbar({ categories = [], total, filters, filterPath }: Props) {
  const { sortBy, setSortBy, viewMode, setViewMode, lightOn, setLightOn } = useFilterStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeCategory = searchParams.get('category') ?? 'All'

  const tabs: Category[] = [{ name: 'All' }, ...categories]

  // Headroom, after whisperinghomes.com: scrolling down tucks the header and this
  // bar away so the grid gets the whole screen; any scroll up brings them back.
  // globals.css reads the attribute set here.
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = document.documentElement
    const sentinel = sentinelRef.current
    if (!sentinel) return
    let lastY = window.scrollY

    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - lastY) < SCROLL_TOLERANCE) return
      // Only hide once the bar is pinned (its in-flow spot has scrolled off the
      // top). Before that it sits under the banner, and sliding it up would drag
      // it across the banner.
      root.toggleAttribute('data-chrome-hidden', y > lastY && sentinel.getBoundingClientRect().top < 0)
      lastY = y
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      root.removeAttribute('data-chrome-hidden')
    }
  }, [])

  const [panel, setPanel] = useState<PanelState>('closed')
  const panelOpen = panel !== 'closed'
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const activeFilters =
    [filters.material, filters.color].flatMap(slugs => slugs?.split(',') ?? []).length +
    (filters.minPrice || filters.maxPrice ? 1 : 0)

  /** Mouse only: a tap fires pointerenter just before click, which would peek and then toggle shut. */
  function hover(e: React.PointerEvent, next: 'peek' | 'closed') {
    if (e.pointerType !== 'mouse') return
    clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(
      () => setPanel(current => (current === 'pinned' ? current : next)),
      next === 'peek' ? HOVER_OPEN_DELAY : HOVER_CLOSE_DELAY,
    )
  }

  function setPanelNow(next: PanelState) {
    clearTimeout(hoverTimer.current)
    setPanel(next)
  }

  useEffect(() => {
    if (!panelOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Focus inside the panel would be stranded once it hides.
      if (panelRef.current?.contains(document.activeElement)) filterButtonRef.current?.focus()
      clearTimeout(hoverTimer.current)
      setPanel('closed')
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [panelOpen])

  /**
   * After a filter change, start the new results at their first row rather than
   * wherever the old grid was scrolled to. The sentinel's scroll margin clears
   * the fixed header, which leaves this bar pinned just above the grid.
   */
  function toListingTop() {
    const sentinel = sentinelRef.current
    if (sentinel && sentinel.getBoundingClientRect().top < 0) sentinel.scrollIntoView()
  }

  function handleCategoryChange(name: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (name === 'All') {
      params.delete('category')
    } else {
      params.set('category', name)
    }
    params.delete('page')
    router.push(`/collections?${params.toString()}`)
  }

  return (
    <>
      {/* Marks where the bar sits in the flow; the headroom effect reads it. */}
      <div ref={sentinelRef} className="scroll-mt-header" aria-hidden="true" />
      {/* ponytail: CSS sticky; the scroll listener above only toggles hiding. top matches fixed Header h-header. */}
      <div className="collection-toolbar sticky top-header z-40 bg-[#EDE8E0]/95 backdrop-blur-md border-b border-[#D8D0C4] transition-transform duration-300">
        {/* Category tab rail */}
        <div className="relative px-4 md:px-8 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-end gap-0 min-w-max">
            {tabs.map(tab => {
              const isActive = activeCategory === tab.name
              return (
                <button
                  key={tab.name}
                  onClick={() => handleCategoryChange(tab.name)}
                  aria-pressed={isActive}
                  className={`
                    relative px-5 py-4 text-[13px] font-medium tracking-[0.04em] whitespace-nowrap
                    transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#C4714A] focus-visible:ring-offset-1
                    ${isActive
                      ? 'text-[#2C2825]'
                      : 'text-[#A09488] hover:text-[#5C4A3A]'
                    }
                  `}
                >
                  {tab.name}
                  {/* Active underline */}
                  <span
                    className={`
                      absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-full
                      transition-all duration-200
                      ${isActive ? 'bg-[#C4714A] opacity-100' : 'bg-transparent opacity-0'}
                    `}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* Filters + count, then sort + view */}
        <div className="flex flex-wrap items-center justify-between gap-y-2 px-4 md:px-8 pb-3">
          <div className="flex items-center gap-4">
            <button
              ref={filterButtonRef}
              type="button"
              aria-expanded={panelOpen}
              aria-controls="collection-filters"
              onClick={() => setPanelNow(panel === 'pinned' ? 'closed' : 'pinned')}
              onPointerEnter={e => hover(e, 'peek')}
              onPointerLeave={e => hover(e, 'closed')}
              className={`flex items-center gap-2 h-8 pl-2.5 pr-3 rounded-lg border text-[12px] font-medium tracking-[0.04em] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C4714A] focus-visible:ring-offset-1 ${panelOpen ? 'bg-[#2C2825] border-[#2C2825] text-[#EDE8E0]' : 'border-[#D8D0C4] text-[#2C2825] hover:border-[#2C2825]'}`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path d="M2 4h7M13 4h1M2 12h1M7 12h7" />
                <circle cx="11" cy="4" r="2" />
                <circle cx="5" cy="12" r="2" />
              </svg>
              Filters
              {activeFilters > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#A85B3B] text-[#EDE8E0] text-[10px] leading-[18px] text-center tabular-nums">
                  {activeFilters}<span className="sr-only"> active</span>
                </span>
              )}
            </button>

            {/* Both hang off the sticky toolbar, their containing block: top-full is
                its bottom edge, and the 100% in the height calc is its own height,
                so they reach the bottom of the screen once the bar is pinned.
                Right after the button in the DOM, so Tab walks into the panel. */}
            <div
              aria-hidden="true"
              onClick={() => setPanelNow('closed')}
              className={`absolute inset-x-0 top-full h-[calc(100dvh_-_var(--spacing-header)_-_100%)] bg-[#1A1210]/25 transition-opacity duration-300 ${panel === 'pinned' ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            />
            <div
              id="collection-filters"
              ref={panelRef}
              onPointerEnter={e => hover(e, 'peek')}
              onPointerLeave={e => hover(e, 'closed')}
              onPointerDown={() => setPanelNow('pinned')}
              onBlur={e => {
                // Tabbing on past the panel would land on cards under the backdrop,
                // so it closes instead. A null relatedTarget — the window losing
                // focus, a click on bare backdrop — is not that, and leaves it be.
                const next = e.relatedTarget
                if (next && !e.currentTarget.contains(next) && next !== filterButtonRef.current) setPanelNow('closed')
              }}
              className={`absolute left-0 top-full h-[calc(100dvh_-_var(--spacing-header)_-_100%)] w-[min(300px,calc(100vw_-_3rem))] border-t border-r border-[#D8D0C4] bg-[#EDE8E0] shadow-[16px_0_40px_-16px_rgba(26,18,16,0.3)] transition-[translate,visibility] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${panelOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}
            >
              <FilterSidebar filters={filters} filterPath={filterPath} onNavigate={toListingTop} />
            </div>

            <span className="text-[12px] text-[#A09488]">
              {total !== undefined
                ? <>Showing <strong className="text-[#2C2825]">{total}</strong> results</>
                : <>&nbsp;</>
              }
            </span>

            {/* The active header search, with a one-tap way out of it. */}
            {filters.q && (
              <Link
                href={listingHref({ ...filters, q: undefined }, filterPath)}
                scroll={false}
                aria-label={`Clear search for ${filters.q}`}
                className="inline-flex items-center gap-1.5 h-7 max-w-[180px] pl-3 pr-2 rounded-full bg-[#2C2825] text-[#EDE8E0] text-[12px] no-underline transition-colors hover:bg-[#A85B3B] outline-none focus-visible:ring-2 focus-visible:ring-[#C4714A] focus-visible:ring-offset-1"
              >
                <span className="truncate">“{filters.q}”</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true" className="flex-shrink-0">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <LightToggle on={lightOn} onChange={setLightOn} />

            <span aria-hidden="true" className="w-px h-5 bg-[#D8D0C4]" />

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              aria-label="Sort products"
              className="bg-transparent border border-[#D8D0C4] text-[#2C2825] text-[12px] px-3 py-1.5 rounded-lg outline-none focus:border-[#C4714A] cursor-pointer"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Grid/List toggle */}
            <div className="flex border border-[#D8D0C4] rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={`w-8 h-8 flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-[#2C2825] text-white' : 'text-[#A09488] hover:text-[#2C2825]'}`}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="0" y="0" width="6" height="6" rx="1"/><rect x="10" y="0" width="6" height="6" rx="1"/>
                  <rect x="0" y="10" width="6" height="6" rx="1"/><rect x="10" y="10" width="6" height="6" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={`w-8 h-8 flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-[#2C2825] text-white' : 'text-[#A09488] hover:text-[#2C2825]'}`}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="0" y="0" width="16" height="3" rx="1"/><rect x="0" y="6" width="16" height="3" rx="1"/>
                  <rect x="0" y="12" width="16" height="3" rx="1"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
