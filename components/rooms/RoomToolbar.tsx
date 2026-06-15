'use client'
import { useFilterStore } from '@/lib/stores/filterStore'

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
]

interface Props {
  total: number
}

export default function RoomToolbar({ total }: Props) {
  const { sortBy, setSortBy, viewMode, setViewMode } = useFilterStore()

  return (
    <div className="bg-[#EDE8E0] border-b border-[#D8D0C4]">
      <div className="flex items-center justify-between px-4 md:px-8 py-3">
        <span className="text-[12px] text-[#A09488]">
          Showing <strong className="text-[#2C2825]">{total}</strong> {total === 1 ? 'result' : 'results'}
        </span>
        <div className="flex items-center gap-3">
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
  )
}
