import Link from 'next/link'
import ProductCard from '@/components/products/ProductCard'
import ScrollRail from '@/components/home/ScrollRail'
import DealCountdown from '@/components/home/DealCountdown'
import { Product } from '@/lib/types'

/**
 * Homepage Deal of the Day: today's biggest discounts. The ground is the hero's
 * #1A1210 (`black`) and the header mirrors ProductCarousel, eyebrow colour included,
 * so the section reads as part of the same site rather than a separate theme.
 */
export default function DealOfTheDay({ products }: { products: Product[] }) {
  if (products.length === 0) return null

  return (
    <section aria-labelledby="deal-heading" className="bg-black py-[100px] px-4 md:px-12">
      <div className="mb-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] uppercase text-[#C4714A] mb-4">
              <span className="w-8 h-px bg-[#C4714A] inline-block" />
              Limited Time
            </div>
            <h2 id="deal-heading" className="font-serif text-[clamp(32px,4vw,52px)] font-normal leading-[1.15] text-white">
              Deal of the <em className="">Day</em>
            </h2>
          </div>
          {/* /collections has no sort-by-discount param yet, so this is the plain listing. */}
          <Link href="/collections" className="shrink-0 text-[12px] font-medium tracking-[0.1em] uppercase text-white hover:text-[#C4714A] active:text-[#C4714A] flex items-center gap-2 no-underline border-b border-[#C4714A]/60 pb-1 transition-all hover:gap-3.5">
            View All →
          </Link>
        </div>
        {/* Below the row, not in it, so View All lines up with the h2 as in ProductCarousel. */}
        <DealCountdown />
      </div>

      <ScrollRail>
        {products.map(p => (
          <div key={p.id} className="flex-none w-[220px] md:w-[236px] [scroll-snap-align:start]">
            <ProductCard product={p} variant="deal" />
          </div>
        ))}
      </ScrollRail>
    </section>
  )
}
