'use client'
import { useFilterStore } from '@/lib/stores/filterStore'
import { useRouter, useSearchParams } from 'next/navigation'
import LightToggle from '@/components/ui/LightToggle'

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
  const { sortBy, setSortBy, viewMode, setViewMode, lightOn, setLightOn } = useFilterStore()
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
    // ponytail: CSS sticky, no scroll listener. top matches fixed Header h-[72px].
    <div className="sticky top-[72px] z-40 bg-[#EDE8E0]/95 backdrop-blur-md border-b border-[#D8D0C4]">
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

      {/* Sort + view + count */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 px-4 md:px-8 pb-3">
        <span className="text-[12px] text-[#A09488]">
          {total !== undefined
            ? <>Showing <strong className="text-[#2C2825]">{total}</strong> results</>
            : <>&nbsp;</>
          }
        </span>
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
  )
}
