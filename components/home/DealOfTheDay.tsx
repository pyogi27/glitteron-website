import Link from 'next/link'
import ProductCard from '@/components/products/ProductCard'
import ScrollRail from '@/components/home/ScrollRail'
import DealCountdown from '@/components/home/DealCountdown'
import { Product } from '@/lib/types'

/** Homepage Deal of the Day: dark carousel of today's biggest discounts. */
export default function DealOfTheDay({ products }: { products: Product[] }) {
  if (products.length === 0) return null

  return (
    <section aria-labelledby="deal-heading" className="relative overflow-hidden bg-[#14100D] py-[90px] px-4 md:px-12">
      <div className="flex flex-col items-center text-center gap-7 mb-10 md:mb-12">
        <div>
          <div className="flex items-center justify-center gap-3 text-[11px] font-medium tracking-[0.2em] uppercase text-[#D9B27A] mb-4">
            <span className="w-8 h-px bg-[#C08A3E] inline-block" />
            Limited Time
            <span className="w-8 h-px bg-[#C08A3E] inline-block" />
          </div>
          <h2 id="deal-heading" className="font-serif text-[clamp(32px,4vw,52px)] font-light leading-[1.15] text-[#F2C46D]">
            Deal of the <em className="italic">Day</em>
          </h2>
        </div>
        <DealCountdown />
      </div>

      <ScrollRail>
        {products.map(p => (
          <div key={p.id} className="flex-none w-[220px] md:w-[236px] [scroll-snap-align:start]">
            <ProductCard product={p} variant="deal" />
          </div>
        ))}
      </ScrollRail>

      <div className="flex justify-center mt-4">
        {/* /collections has no sort-by-discount param yet, so this is the plain listing. */}
        <Link
          href="/collections"
          className="text-[12px] font-medium tracking-[0.12em] uppercase text-[#F2C46D] no-underline border-b border-[#C08A3E]/70 pb-1 flex items-center gap-2 transition-all hover:gap-3.5 hover:text-[#FBE3B0]"
        >
          View All Products <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  )
}
