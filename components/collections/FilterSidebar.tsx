'use client'
import { useEffect } from 'react'
import { useFilterStore } from '@/lib/stores/filterStore'
import { useRouter, useSearchParams } from 'next/navigation'

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

  // Sync URL price params to store on mount
  useEffect(() => {
    const minPriceStr = searchParams.get('minPrice')
    const maxPriceStr = searchParams.get('maxPrice')
    if (minPriceStr && maxPriceStr) {
      const minPrice = Number(minPriceStr)
      const maxPrice = Number(maxPriceStr)
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        setPriceRange([minPrice, maxPrice])
      }
    }
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

  function handlePriceRangeChange(newMin: number, newMax: number) {
    setPriceRange([newMin, newMax])
    const params = new URLSearchParams(searchParams.toString())
    params.set('minPrice', String(newMin))
    params.set('maxPrice', String(newMax))
    params.set('page', '1')
    router.push(`/collections?${params.toString()}`)
  }

  return (
    <aside className="w-[268px] flex-shrink-0 px-7 py-8 border-r border-[#D8D0C4] h-[calc(100vh-172px)] overflow-y-auto [scrollbar-width:thin]">
      <FilterGroup title="Price Range">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={`₹${priceRange[0].toLocaleString('en-IN')}`}
            readOnly
            className="flex-1 bg-transparent border border-[#D8D0C4] text-[#2C2825] px-2.5 py-1.5 rounded-lg text-[12px] focus:border-[#C4714A] outline-none"
          />
          <span className="text-[#A09488] text-[12px] self-center">–</span>
          <input
            type="text"
            value={`₹${priceRange[1].toLocaleString('en-IN')}`}
            readOnly
            className="flex-1 bg-transparent border border-[#D8D0C4] text-[#2C2825] px-2.5 py-1.5 rounded-lg text-[12px] focus:border-[#C4714A] outline-none"
          />
        </div>
        <input
          type="range"
          min={2000}
          max={50000}
          step={1000}
          value={priceRange[1]}
          onChange={e => handlePriceRangeChange(priceRange[0], Number(e.target.value))}
          className="w-full accent-[#C4714A]"
        />
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
