import Link from 'next/link'
import ProductCard from '@/components/products/ProductCard'
import ScrollRail from '@/components/home/ScrollRail'
import DealCountdown from '@/components/home/DealCountdown'
import { Product } from '@/lib/types'

// Warm out-of-focus lights behind the section: [left, top, size px, opacity, animation].
// motion-safe only, so reduced-motion visitors get a still glow.
const BOKEH = [
  ['6%', '10%', 220, 0.22, 'motion-safe:animate-flicker1'],
  ['78%', '4%', 260, 0.18, 'motion-safe:animate-flicker2'],
  ['42%', '58%', 320, 0.12, 'motion-safe:animate-flicker1'],
  ['88%', '62%', 140, 0.24, 'motion-safe:animate-flicker2'],
  ['20%', '70%', 110, 0.2, 'motion-safe:animate-flicker2'],
  ['62%', '22%', 70, 0.35, 'motion-safe:animate-flicker1'],
  ['30%', '18%', 46, 0.4, ''],
  ['70%', '80%', 56, 0.3, ''],
] as const

/** Homepage Deal of the Day: dark, gold-lit carousel of today's biggest discounts. */
export default function DealOfTheDay({ products }: { products: Product[] }) {
  if (products.length === 0) return null

  return (
    <section aria-labelledby="deal-heading" className="relative isolate overflow-hidden bg-[#14100D] py-[90px] px-4 md:px-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(192,138,62,0.3),transparent_62%)]" />
        {BOKEH.map(([left, top, size, opacity, animation], i) => (
          <span
            key={i}
            className={`absolute rounded-full -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,#F2C46D_0%,rgba(242,196,109,0.35)_45%,transparent_70%)] ${animation}`}
            style={{ left, top, width: size, height: size, opacity }}
          />
        ))}
      </div>

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
