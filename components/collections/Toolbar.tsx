'use client'
import { useFilterStore } from '@/lib/stores/filterStore'
import { products } from '@/lib/data/products'

const TABS = ['All', 'Chandeliers', 'Pendant Lights', 'Sputnik Lights', 'Dome Lights', 'Crystal Lights']
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
]

export default function Toolbar() {
  const { activeTab, setActiveTab, sortBy, setSortBy, viewMode, setViewMode, materials, priceRange } = useFilterStore()

  const filteredCount = (() => {
    let filtered = products
    if (activeTab !== 'All') {
      filtered = filtered.filter(p => p.category.toLowerCase().includes(activeTab.toLowerCase()))
    }
    if (materials.length > 0) {
      filtered = filtered.filter(p =>
        materials.some(m =>
          p.name.toLowerCase().includes(m.toLowerCase()) ||
          p.subtitle.toLowerCase().includes(m.toLowerCase()) ||
          p.category.toLowerCase().includes(m.toLowerCase())
        )
      )
    }
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
    return filtered.length
  })()

  return (
    <div className="border-b border-[#E8E4DC] bg-[#FAFAF8] px-8 py-4 flex flex-col gap-3">
      {/* Category tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-2xl text-[12px] font-medium tracking-[0.06em] transition-all border
              ${activeTab === tab
                ? 'bg-[#1A1714] text-[#FAFAF8] border-[#1A1714]'
                : 'bg-transparent text-[#9A958C] border-[#E8E4DC] hover:border-[#C8A96E] hover:text-[#9A7840]'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Sort + view + count */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[#9A958C]">
          Showing <strong className="text-[#1A1714]">{filteredCount}</strong> results
        </span>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            aria-label="Sort products"
            className="bg-transparent border border-[#E8E4DC] text-[#1A1714] text-[12px] px-3 py-1.5 rounded-lg outline-none focus:border-[#C8A96E] cursor-pointer"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Grid/List toggle */}
          <div className="flex border border-[#E8E4DC] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`w-8 h-8 flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-[#1A1714] text-white' : 'text-[#9A958C] hover:text-[#1A1714]'}`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <rect x="0" y="0" width="6" height="6" rx="1"/><rect x="10" y="0" width="6" height="6" rx="1"/>
                <rect x="0" y="10" width="6" height="6" rx="1"/><rect x="10" y="10" width="6" height="6" rx="1"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`w-8 h-8 flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-[#1A1714] text-white' : 'text-[#9A958C] hover:text-[#1A1714]'}`}
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
