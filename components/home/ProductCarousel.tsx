import Link from 'next/link'
import ProductCard from '@/components/products/ProductCard'
import ScrollRail from '@/components/home/ScrollRail'
import { Product } from '@/lib/types'

interface Props { titlePrefix: string; titleHighlight: string; label: string; products: Product[] }

export default function ProductCarousel({ titlePrefix, titleHighlight, label, products }: Props) {
  return (
    <section className="py-[100px] px-4 md:px-12">
      <div className="flex items-end justify-between mb-12">
        <div>
          <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] uppercase text-[#C4714A] mb-4">
            <span className="w-8 h-px bg-[#C4714A] inline-block" />
            {label}
          </div>
          <h2 className="font-serif text-[clamp(32px,4vw,52px)] font-normal leading-[1.15]">
            {titlePrefix} <em className="">{titleHighlight}</em>
          </h2>
        </div>
        {/* opacity-50 on #2C2825 put this link at 2.51:1. A link is the last thing
            that should be the lowest-contrast text on the page. */}
        <Link href="/collections" className="text-[12px] font-medium tracking-[0.1em] uppercase text-[#5A5249] hover:text-[#2C2825] active:text-[#2C2825] flex items-center gap-2 no-underline border-b border-[#BCAF9C] pb-1 transition-all hover:gap-3.5">
          View All →
        </Link>
      </div>
      <ScrollRail>
        {products.map(p => (
          <div key={p.id} className="flex-none w-[300px] [scroll-snap-align:start]">
            <ProductCard product={p} sizes="300px" />
          </div>
        ))}
      </ScrollRail>
    </section>
  )
}
