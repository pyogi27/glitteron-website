'use client'
import { useFilterStore } from '@/lib/stores/filterStore'
import ProductCard, { EAGER_CARDS } from '@/components/products/ProductCard'
import { Product } from '@/lib/types'

interface Props { products: Product[] }

export default function ProductGrid({ products }: Props) {
  const { materials, sortBy, viewMode } = useFilterStore()

  // Category filtering is server-side via ?category= URL param
  // Price filtering is now server-side via ?minPrice= and ?maxPrice= URL params
  let filtered = products
  if (materials.length > 0) {
    // Approximate match against name/subtitle/category until API provides a dedicated material field
    filtered = filtered.filter(p =>
      materials.some(m =>
        p.name.toLowerCase().includes(m.toLowerCase()) ||
        p.subtitle.toLowerCase().includes(m.toLowerCase()) ||
        p.category.toLowerCase().includes(m.toLowerCase())
      )
    )
  }
  // rooms filter omitted: mock Product type has no room field; apply when API provides room metadata

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price
    if (sortBy === 'price-desc') return b.price - a.price
    if (sortBy === 'rating') return b.rating - a.rating
    return 0 // featured / newest: keep original order
  })

  return (
    <div className="flex-1 p-8 overflow-visible">
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="font-serif text-[24px] font-light text-[#2C2825] mb-3">No products found</div>
          <div className="text-[13px] text-[#A09488]">Try adjusting your filters</div>
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'cards-track grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4'
          : 'flex flex-col gap-4'
        }>
          {sorted.map((p, i) => (
            <ProductCard key={p.id} product={p} variant={viewMode} priority={i < EAGER_CARDS} />
          ))}
        </div>
      )}
    </div>
  )
}
