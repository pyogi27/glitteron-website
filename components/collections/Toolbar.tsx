'use client'
import { useFilterStore } from '@/lib/stores/filterStore'
import { useRouter, useSearchParams } from 'next/navigation'

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
}

export default function Toolbar({ categories = [], total }: Props) {
  const { sortBy, setSortBy, viewMode, setViewMode } = useFilterStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeCategory = searchParams.get('category') ?? 'All'

  const tabs: Category[] = [{ name: 'All' }, ...categories]

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
    <div className="border-b border-[#D8D0C4] bg-[#EDE8E0] px-8 py-4 flex flex-col gap-3">
      {/* Category tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.name}
            onClick={() => handleCategoryChange(tab.name)}
            className={`px-4 py-1.5 rounded-2xl text-[12px] font-medium tracking-[0.06em] transition-all border
              ${activeCategory === tab.name
                ? 'bg-[#2C2825] text-[#EDE8E0] border-[#2C2825]'
                : 'bg-transparent text-[#A09488] border-[#D8D0C4] hover:border-[#C4714A] hover:text-[#8B5E3C]'
              }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Sort + view + count */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[#A09488]">
          {total !== undefined
            ? <>Showing <strong className="text-[#2C2825]">{total}</strong> results</>
            : <>&nbsp;</>
          }
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
  )
}
