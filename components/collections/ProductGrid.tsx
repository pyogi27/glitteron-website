'use client'
import { useFilterStore } from '@/lib/stores/filterStore'
import ProductCard from '@/components/products/ProductCard'
import { Product } from '@/lib/types'

interface Props { products: Product[] }

export default function ProductGrid({ products }: Props) {
  const { activeTab, materials, rooms, sortBy, viewMode } = useFilterStore()

  // Filter
  let filtered = products
  if (activeTab !== 'All') {
    filtered = filtered.filter(p => p.category.toLowerCase().includes(activeTab.toLowerCase()))
  }
  if (materials.length > 0) {
    // If product has no material field in our mock data, skip material filter
    // This is a UI-level filter — the real API will handle it
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price
    if (sortBy === 'price-desc') return b.price - a.price
    if (sortBy === 'rating') return b.rating - a.rating
    return 0 // featured / newest: keep original order
  })

  return (
    <div className="flex-1 p-8">
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="font-serif text-[24px] font-light text-[#1A1714] mb-3">No products found</div>
          <div className="text-[13px] text-[#9A958C]">Try adjusting your filters</div>
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'flex flex-col gap-4'
        }>
          {sorted.map(p => (
            <ProductCard key={p.id} product={p} variant={viewMode} />
          ))}
        </div>
      )}
    </div>
  )
}
