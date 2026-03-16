// components/product/RelatedProducts.tsx
import ProductCard from '@/components/products/ProductCard'
import { Product } from '@/lib/types'

interface Props { products: Product[] }

export default function RelatedProducts({ products }: Props) {
  if (products.length === 0) return null
  return (
    <section className="py-[80px] px-12 bg-[#E2DAD0] overflow-visible">
      <div className="text-center mb-10">
        <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C4714A] mb-3">You May Also Like</div>
        <h2 className="font-serif text-[32px] font-light text-[#2C2825]">Related Pieces</h2>
      </div>
      <div className="cards-track grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto pt-4">
        {products.map(p => (
          <ProductCard key={p.id} product={p} variant="related" />
        ))}
      </div>
    </section>
  )
}
