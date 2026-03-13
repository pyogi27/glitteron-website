'use client'
import { useFilterStore } from '@/lib/stores/filterStore'

const CATEGORIES = [
  { label: 'All', count: 364 },
  { label: 'Chandeliers', count: 128 },
  { label: 'Pendant Lights', count: 96 },
  { label: 'Sputnik Lights', count: 42 },
  { label: 'Dome Lights', count: 38 },
  { label: 'Crystal Lights', count: 56 },
]
const MATERIALS = ['Crystal', 'Brass', 'Iron & Steel', 'Blown Glass', 'Wood & Rattan']
const ROOMS = ['Living Room', 'Dining Room', 'Bedroom', 'Home Office', 'Foyer / Entrance']

interface FilterItemProps {
  label: string
  count?: number
  active: boolean
  onToggle: () => void
}

function FilterItem({ label, count, active, onToggle }: FilterItemProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2.5 mb-2.5 w-full text-left"
    >
      <div className={`w-[15px] h-[15px] border-[1.5px] rounded-[3px] flex-shrink-0 flex items-center justify-center transition-all ${active ? 'bg-[#1A1714] border-[#1A1714]' : 'border-[#E8E4DC]'}`}>
        {active && (
          <svg viewBox="0 0 10 10" width="9" height="9">
            <path d="M1.5 5l2.5 2.5 5-5" stroke="#FAFAF8" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className="text-[12px] text-[#1A1714] opacity-75 flex-1">{label}</span>
      {count !== undefined && <span className="text-[10px] text-[#9A958C]">{count}</span>}
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
      <h3 className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#1A1714] mb-3.5 pb-2.5 border-b border-[#E8E4DC]">{title}</h3>
      {children}
    </div>
  )
}

export default function FilterSidebar() {
  const { activeTab, setActiveTab, materials, rooms, toggleMaterial, toggleRoom, priceRange, setPriceRange, clearAll } = useFilterStore()

  return (
    <aside className="w-[268px] flex-shrink-0 px-7 py-8 border-r border-[#E8E4DC] sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto [scrollbar-width:thin]">
      <FilterGroup title="Category">
        {CATEGORIES.map(c => (
          <FilterItem
            key={c.label}
            label={c.label}
            count={c.count}
            active={activeTab === c.label}
            onToggle={() => setActiveTab(c.label)}
          />
        ))}
      </FilterGroup>

      <hr className="border-[#E8E4DC] my-7" />

      <FilterGroup title="Price Range">
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={`₹${priceRange[0].toLocaleString('en-IN')}`}
            readOnly
            className="flex-1 bg-transparent border border-[#E8E4DC] text-[#1A1714] px-2.5 py-1.5 rounded-lg text-[12px] focus:border-[#C8A96E] outline-none"
          />
          <span className="text-[#9A958C] text-[12px] self-center">–</span>
          <input
            type="text"
            value={`₹${priceRange[1].toLocaleString('en-IN')}`}
            readOnly
            className="flex-1 bg-transparent border border-[#E8E4DC] text-[#1A1714] px-2.5 py-1.5 rounded-lg text-[12px] focus:border-[#C8A96E] outline-none"
          />
        </div>
        <input
          type="range"
          min={2000}
          max={50000}
          step={1000}
          value={priceRange[1]}
          onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
          className="w-full accent-[#C8A96E]"
        />
      </FilterGroup>

      <hr className="border-[#E8E4DC] my-7" />

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

      <hr className="border-[#E8E4DC] my-7" />

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

      <hr className="border-[#E8E4DC] my-7" />

      <button
        onClick={clearAll}
        className="w-full border border-[#E8E4DC] text-[#9A958C] px-3 py-2.5 rounded-2xl text-[11px] tracking-[0.08em] uppercase transition-all hover:border-[#9A7840] hover:text-[#9A7840]"
      >
        Clear All Filters
      </button>
    </aside>
  )
}
