import type { Metadata } from 'next'
import PageBanner from '@/components/collections/PageBanner'
import Toolbar from '@/components/collections/Toolbar'
import FilterSidebar from '@/components/collections/FilterSidebar'
import ProductGrid from '@/components/collections/ProductGrid'
import { products } from '@/lib/data/products'

export const metadata: Metadata = {
  title: 'Collections — GlitterOn',
  description: '500+ handcrafted chandeliers & pendant lights for every space.',
}

export default function CollectionsPage() {
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
      <Toolbar />
      <div className="flex items-start min-h-screen bg-[#EDE8E0]">
        <div className="hidden lg:block">
          <FilterSidebar />
        </div>
        <ProductGrid products={products} />
      </div>
    </>
  )
}
