import Link from 'next/link'
import ProductCard from '@/components/products/ProductCard'
import ScrollRail from '@/components/home/ScrollRail'
import DealCountdown from '@/components/home/DealCountdown'
import GlitterBackground from '@/components/home/GlitterBackground'
import { Product } from '@/lib/types'

/**
 * Homepage Deal of the Day: today's biggest discounts. The ground is the hero's
 * #1A1210 (`black`) with live glitter over it, and the header mirrors
 * ProductCarousel, eyebrow colour included, so the section reads as part of the
 * same site rather than a separate theme.
 */
export default function DealOfTheDay({ products }: { products: Product[] }) {
  if (products.length === 0) return null

  return (
    <section aria-labelledby="deal-heading" className="relative overflow-hidden bg-black py-[100px] px-4 md:px-12">
      <GlitterBackground />

      <div className="relative">
        <div className="mb-12">
          <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] uppercase text-[#C4714A] mb-4">
            <span className="w-8 h-px bg-[#C4714A] inline-block" />
            Limited Time
          </div>
          <h2 id="deal-heading" className="font-serif text-[clamp(32px,4vw,52px)] font-normal leading-[1.15] text-white">
            Deal of the <em className="">Day</em>
          </h2>
          <DealCountdown />
        </div>

        <ScrollRail>
          {products.map(p => (
            <div key={p.id} className="flex-none w-[220px] md:w-[236px] [scroll-snap-align:start]">
              <ProductCard product={p} variant="deal" />
            </div>
          ))}
        </ScrollRail>

        <div className="mt-6 flex justify-center">
          <Link
            href="/deal-of-the-day"
            className="inline-flex items-center gap-2 px-9 py-3.5 border border-[#C4714A] text-white text-[12px] font-medium tracking-[0.15em] uppercase no-underline transition-all hover:bg-[#C4714A] hover:gap-3.5 active:bg-[#C4714A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C4714A]"
          >
            View All Deals →
          </Link>
        </div>
      </div>
    </section>
  )
}
