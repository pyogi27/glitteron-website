'use client'
import { useEffect } from 'react'
import {
  useFilterStore,
  PRICE_FLOOR,
  PRICE_CEILING,
  PRICE_STEP,
} from '@/lib/stores/filterStore'
import { useRouter, useSearchParams } from 'next/navigation'

const formatPrice = (n: number) => `₹${n.toLocaleString('en-IN')}`

/** Position on the 0–100% track for a given price. */
const trackPercent = (value: number) =>
  ((value - PRICE_FLOOR) / (PRICE_CEILING - PRICE_FLOOR)) * 100

const MATERIALS = ['Crystal', 'Brass', 'Iron & Steel', 'Blown Glass', 'Wood & Rattan']
const ROOMS = ['Living Room', 'Dining Room', 'Bedroom', 'Home Office', 'Foyer / Entrance']

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
      className="flex items-center gap-2.5 mb-2.5 w-full text-left"
    >
      <div className={`w-[15px] h-[15px] border-[1.5px] rounded-[3px] flex-shrink-0 flex items-center justify-center transition-all ${active ? 'bg-[#2C2825] border-[#2C2825]' : 'border-[#D8D0C4]'}`}>
        {active && (
          <svg viewBox="0 0 10 10" width="9" height="9">
            <path d="M1.5 5l2.5 2.5 5-5" stroke="#EDE8E0" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className="text-[12px] text-[#2C2825] opacity-75 flex-1">{label}</span>
    </button>
  )
}

interface FilterGroupProps {
  title: string
  children: React.ReactNode
}

function FilterGroup({ title, children }: FilterGroupProps) {
  return (
    <div className="mb-7">
      <h3 className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#2C2825] mb-3.5 pb-2.5 border-b border-[#D8D0C4]">{title}</h3>
      {children}
    </div>
  )
}

export default function FilterSidebar() {
  const { materials, rooms, toggleMaterial, toggleRoom, priceRange, setPriceRange, clearAll } = useFilterStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Sync URL price params to store on mount. Each bound is independent: an
  // absent one means that end is unbounded, so it falls back to the track end.
  useEffect(() => {
    const min = Number(searchParams.get('minPrice'))
    const max = Number(searchParams.get('maxPrice'))
    setPriceRange([
      Number.isFinite(min) && min > 0 ? min : PRICE_FLOOR,
      Number.isFinite(max) && max > 0 ? max : PRICE_CEILING,
    ])
  }, [])

  function handleClearAll() {
    clearAll()
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    params.delete('minPrice')
    params.delete('maxPrice')
    params.set('page', '1')
    router.push(`/collections?${params.toString()}`)
  }

  /**
   * Pushes the current range to the URL, which is what actually filters (the
   * server reads ?minPrice/?maxPrice). Called on release rather than on every
   * `change` event — a drag emits one per step, and each push refetched the grid.
   * A bound sitting at its end of the track is omitted, so it reads as "no limit"
   * instead of silently excluding items beyond the slider's reach.
   */
  function commitPriceRange([min, max]: [number, number]) {
    const params = new URLSearchParams(searchParams.toString())

    if (min > PRICE_FLOOR) params.set('minPrice', String(min))
    else params.delete('minPrice')

    if (max < PRICE_CEILING) params.set('maxPrice', String(max))
    else params.delete('maxPrice')

    params.set('page', '1')
    router.push(`/collections?${params.toString()}`)
  }

  return (
    <aside className="w-[268px] flex-shrink-0 px-7 py-8 bg-[#EDE8E0] border-r border-[#D8D0C4] h-[calc(100vh-var(--spacing-header-ticker))] overflow-y-auto [scrollbar-width:thin]">
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

      <hr className="border-[#D8D0C4] my-7" />

      <FilterGroup title="Material">
        {MATERIALS.map(m => (
          <FilterItem
            key={m}
            label={m}
            active={materials.includes(m)}
            onToggle={() => toggleMaterial(m)}
          />
        ))}
      </FilterGroup>

      <hr className="border-[#D8D0C4] my-7" />

      <FilterGroup title="Best For">
        {ROOMS.map(r => (
          <FilterItem
            key={r}
            label={r}
            active={rooms.includes(r)}
            onToggle={() => toggleRoom(r)}
          />
        ))}
      </FilterGroup>

      <hr className="border-[#D8D0C4] my-7" />

      <button
        onClick={handleClearAll}
        className="w-full border border-[#D8D0C4] text-[#A09488] px-3 py-2.5 rounded-2xl text-[11px] tracking-[0.08em] uppercase transition-all hover:border-[#8B5E3C] hover:text-[#8B5E3C]"
      >
        Clear All Filters
      </button>
    </aside>
  )
}
