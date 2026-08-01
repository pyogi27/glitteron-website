import type { Metadata } from 'next'
import PageBanner from '@/components/collections/PageBanner'
import Toolbar from '@/components/collections/Toolbar'
import FilterSidebar from '@/components/collections/FilterSidebar'
import InfiniteProductGrid from '@/components/collections/InfiniteProductGrid'
import { fetchCategories, fetchProducts, mapApiProduct } from '@/lib/api/server'
import { products as staticProducts } from '@/lib/data/products'

const INITIAL_BATCH = 100

export const metadata: Metadata = {
  title: 'Collections — LitMeUp',
  description: '500+ handcrafted chandeliers & pendant lights for every space.',
}

interface Props {
  searchParams: Promise<{ category?: string; minPrice?: string; maxPrice?: string }>
}

export default async function CollectionsPage({ searchParams }: Props) {
  const { category: categoryParam, minPrice: minPriceStr, maxPrice: maxPriceStr } = await searchParams
  const page = 1
  const limit = INITIAL_BATCH
  const minPrice = minPriceStr ? Number(minPriceStr) : undefined
  const maxPrice = maxPriceStr ? Number(maxPriceStr) : undefined

  const categories = await fetchCategories()

  const selectedCategory = categoryParam
    ? categories.find(c => c.name === categoryParam)
    : undefined

  const { products: apiProducts, total, totalPages } = await fetchProducts({
    page,
    limit,
    categoryId: selectedCategory?.id,
    minPrice,
    maxPrice,
  })

  const categoryMap = new Map(categories.map(c => [c.id, c.name]))
  const usingApi = apiProducts.length > 0 || categories.length > 0

  const products = apiProducts.length > 0
    ? apiProducts.map(p => mapApiProduct(p, categoryMap.get(p.categoryId)))
    : staticProducts

  return (
    <>
      <PageBanner
        title="All Collections"
        subtitle="500+ handcrafted chandeliers & pendant lights for spaces that deserve to glow."
        stats={[
          { num: '500+', label: 'Designs' },
          { num: '12K+', label: 'Customers' },
          { num: '5yr', label: 'Warranty' },
        ]}
      />
      <Toolbar categories={categories} total={total} />
      <div className="flex items-start min-h-screen bg-[#EDE8E0]">
        {/* ponytail: sticky lives on the flex child, not the <aside>. A wrapper sized
            to its own content gives sticky no travel room, so it scrolls away. */}
        <div className="hidden lg:block sticky top-header-ticker">
          <FilterSidebar />
        </div>
        <InfiniteProductGrid
          initialProducts={products}
          initialPage={usingApi ? page : 1}
          totalPages={usingApi ? totalPages : 1}
        />
      </div>
    </>
  )
}
