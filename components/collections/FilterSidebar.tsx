'use client'
import { useEffect, useOptimistic, useTransition } from 'react'
import {
  useFilterStore,
  PRICE_FLOOR,
  PRICE_CEILING,
  PRICE_STEP,
} from '@/lib/stores/filterStore'
import { useRouter } from 'next/navigation'
import {
  COLORS,
  MATERIALS,
  listingHref,
  toggleSlug,
  type FilterOption,
  type ListingFilters,
} from '@/lib/data/filters'

const formatPrice = (n: number) => `₹${n.toLocaleString('en-IN')}`

/** Position on the 0–100% track for a given price. */
const trackPercent = (value: number) =>
  ((value - PRICE_FLOOR) / (PRICE_CEILING - PRICE_FLOOR)) * 100

/** Whether a comma-joined slug list contains the slug. */
const includesSlug = (slugs: string | undefined, slug: string) =>
  slugs?.split(',').includes(slug) ?? false

interface FilterItemProps {
  label: string
  active: boolean
  onToggle: () => void
}

function FilterItem({ label, active, onToggle }: FilterItemProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className="group flex items-center gap-2.5 w-full py-1 text-left rounded outline-none focus-visible:ring-2 focus-visible:ring-[#C4714A]"
    >
      <div className={`w-[15px] h-[15px] border-[1.5px] rounded-[3px] flex-shrink-0 flex items-center justify-center transition-all ${active ? 'bg-[#2C2825] border-[#2C2825]' : 'border-[#D8D0C4] group-hover:border-[#A09488]'}`}>
        {active && (
          <svg viewBox="0 0 10 10" width="9" height="9">
            <path d="M1.5 5l2.5 2.5 5-5" stroke="#EDE8E0" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className={`text-[12px] text-[#2C2825] flex-1 transition-opacity ${active ? 'font-medium' : 'opacity-75 group-hover:opacity-100'}`}>{label}</span>
    </button>
  )
}

interface ColorItemProps {
  option: FilterOption
  active: boolean
  onToggle: () => void
}

function ColorItem({ option, active, onToggle }: ColorItemProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className="group flex items-center gap-2.5 w-full py-1 text-left rounded outline-none focus-visible:ring-2 focus-visible:ring-[#C4714A]"
    >
      {/* The hairline keeps White and Clear visible on the cream panel. */}
      <span
        aria-hidden="true"
        className={`relative w-[18px] h-[18px] rounded-full flex-shrink-0 inset-ring inset-ring-black/15 ring-offset-2 ring-offset-[#EDE8E0] transition-shadow ${active ? 'ring-2 ring-[#2C2825]' : 'group-hover:ring-1 group-hover:ring-[#A09488]'}`}
        style={{ background: option.swatch }}
      >
        {/* A dark halo under a white tick reads on every swatch, White included. */}
        {active && (
          <svg viewBox="0 0 10 10" className="absolute inset-0 m-auto w-[10px] h-[10px]">
            <path d="M1.5 5l2.5 2.5 5-5" stroke="#1A1210" strokeOpacity="0.55" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1.5 5l2.5 2.5 5-5" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <span className={`text-[12px] text-[#2C2825] flex-1 transition-opacity ${active ? 'font-medium' : 'opacity-75 group-hover:opacity-100'}`}>{option.label}</span>
    </button>
  )
}

interface FilterGroupProps {
  title: string
  children: React.ReactNode
}

function FilterGroup({ title, children }: FilterGroupProps) {
  return (
    <div className="mb-8">
      <h3 className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#2C2825] mb-3.5 pb-2.5 border-b border-[#D8D0C4]">{title}</h3>
      {children}
    </div>
  )
}

interface Props {
  /** The listing's filter state. Every change navigates from it. */
  filters: ListingFilters
  /** Where changes navigate: /collections, or the category landing page itself. */
  filterPath: string
  /** Runs just before each navigation, so the toolbar can bring the new results into view. */
  onNavigate?: () => void
}

export default function FilterSidebar({ filters, filterPath, onNavigate }: Props) {
  const { priceRange, setPriceRange, clearAll } = useFilterStore()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // A click shows at once; `filters` catches up when the navigation lands, and
  // the optimistic copy gives way to it (the pattern in the Next.js docs).
  const [shown, setShown] = useOptimistic(filters)

  // Follow the listing the slider was rendered for. The old mount-only sync went
  // stale on back/forward, and never saw a price-band page's own ceiling.
  useEffect(() => {
    const min = Number(filters.minPrice)
    const max = Number(filters.maxPrice)
    setPriceRange([
      Number.isFinite(min) && min > 0 ? min : PRICE_FLOOR,
      Number.isFinite(max) && max > 0 ? max : PRICE_CEILING,
    ])
  }, [filters.minPrice, filters.maxPrice, setPriceRange])

  function apply(next: ListingFilters) {
    onNavigate?.()
    startTransition(() => {
      setShown(next)
      // scroll: false — the default jumps to the top of the page, dragging the
      // toolbar, and this panel hanging off it, out from under the pointer.
      router.push(listingHref(next, filterPath), { scroll: false })
    })
  }

  function handleClearAll() {
    clearAll()
    // The category belongs to the toolbar tabs and the search to the header, not
    // to this panel, so both stay.
    apply({ category: filters.category, q: filters.q })
  }

  /**
   * Pushes the current range to the URL, which is what actually filters (the
   * server reads ?minPrice/?maxPrice). Called on release rather than on every
   * `change` event — a drag emits one per step, and each push refetched the grid.
   * A bound sitting at its end of the track is omitted, so it reads as "no limit"
   * instead of silently excluding items beyond the slider's reach.
   */
  function commitPriceRange([min, max]: [number, number]) {
    const minPrice = min > PRICE_FLOOR ? String(min) : undefined
    const maxPrice = max < PRICE_CEILING ? String(max) : undefined
    // keyup also fires for the Tab that focused the slider; nothing moved, so stay put.
    if (minPrice === shown.minPrice && maxPrice === shown.maxPrice) return
    apply({ ...shown, minPrice, maxPrice })
  }

  return (
    <aside
      aria-label="Product filters"
      aria-busy={isPending}
      className="h-full overflow-y-auto overscroll-contain [scrollbar-width:thin]"
    >
      {/* Filtering waits on the server; this says the click registered. */}
      <div
        aria-hidden="true"
        className={`sticky top-0 z-10 h-0.5 bg-[#A85B3B] transition-opacity duration-300 ${isPending ? 'opacity-100 animate-pulse' : 'opacity-0'}`}
      />
      <div className="px-6 pt-6 pb-8">
        <FilterGroup title="Price Range">
          <div className="flex items-end gap-2 mb-4">
            <div className="flex-1">
              <span className="block text-[9px] tracking-[0.14em] uppercase text-[#7A6E62] mb-1">Min</span>
              <output className="block bg-white border border-[#C9BFB0] text-[#2C2825] px-2.5 py-2 rounded-lg text-[13px] font-medium tabular-nums">
                {formatPrice(priceRange[0])}
              </output>
            </div>
            <span className="text-[#7A6E62] text-[13px] pb-2.5">–</span>
            <div className="flex-1">
              <span className="block text-[9px] tracking-[0.14em] uppercase text-[#7A6E62] mb-1">Max</span>
              <output className="block bg-white border border-[#C9BFB0] text-[#2C2825] px-2.5 py-2 rounded-lg text-[13px] font-medium tabular-nums">
                {priceRange[1] >= PRICE_CEILING ? 'Any' : formatPrice(priceRange[1])}
              </output>
            </div>
          </div>

          {/* Dual-thumb range: two native inputs stacked over one shared rail. */}
          <div
            className="price-range"
            style={{
              ['--min-pct' as string]: `${trackPercent(priceRange[0])}%`,
              ['--max-pct' as string]: `${trackPercent(priceRange[1])}%`,
            }}
          >
            <div className="price-range-rail" aria-hidden="true" />
            <div className="price-range-fill" aria-hidden="true" />
            <input
              type="range"
              className="price-range-input"
              min={PRICE_FLOOR}
              max={PRICE_CEILING}
              step={PRICE_STEP}
              value={priceRange[0]}
              aria-label="Minimum price"
              aria-valuetext={formatPrice(priceRange[0])}
              // Thumbs cannot cross; each stops one step short of the other.
              onChange={e => setPriceRange([Math.min(Number(e.target.value), priceRange[1] - PRICE_STEP), priceRange[1]])}
              onPointerUp={() => commitPriceRange(priceRange)}
              onKeyUp={() => commitPriceRange(priceRange)}
            />
            <input
              type="range"
              className="price-range-input"
              min={PRICE_FLOOR}
              max={PRICE_CEILING}
              step={PRICE_STEP}
              value={priceRange[1]}
              aria-label="Maximum price"
              aria-valuetext={priceRange[1] >= PRICE_CEILING ? 'Any' : formatPrice(priceRange[1])}
              onChange={e => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + PRICE_STEP)])}
              onPointerUp={() => commitPriceRange(priceRange)}
              onKeyUp={() => commitPriceRange(priceRange)}
            />
          </div>

          <div className="flex justify-between text-[10px] text-[#7A6E62] tabular-nums mt-1.5">
            <span>{formatPrice(PRICE_FLOOR)}</span>
            <span>{formatPrice(PRICE_CEILING)}+</span>
          </div>
        </FilterGroup>

        <FilterGroup title="Material">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {MATERIALS.map(m => (
              <FilterItem
                key={m.slug}
                label={m.label}
                active={includesSlug(shown.material, m.slug)}
                onToggle={() => apply({ ...shown, material: toggleSlug(shown.material, m.slug) })}
              />
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title="Colour">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {COLORS.map(c => (
              <ColorItem
                key={c.slug}
                option={c}
                active={includesSlug(shown.color, c.slug)}
                onToggle={() => apply({ ...shown, color: toggleSlug(shown.color, c.slug) })}
              />
            ))}
          </div>
        </FilterGroup>

        <button
          type="button"
          onClick={handleClearAll}
          className="w-full border border-[#D8D0C4] text-[#A09488] px-3 py-2.5 rounded-2xl text-[11px] tracking-[0.08em] uppercase transition-all hover:border-[#8B5E3C] hover:text-[#8B5E3C] outline-none focus-visible:ring-2 focus-visible:ring-[#C4714A]"
        >
          Clear All Filters
        </button>
      </div>
    </aside>
  )
}
