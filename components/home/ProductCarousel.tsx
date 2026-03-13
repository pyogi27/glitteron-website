'use client'
import { useRef } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/products/ProductCard'
import { Product } from '@/lib/types'

interface Props { title: string; label: string; products: Product[] }

export default function ProductCarousel({ title, label, products }: Props) {
  const track = useRef<HTMLDivElement>(null)
  const scrollBy = (dir: number) => track.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })

  return (
    <section className="py-[100px] px-12">
      <div className="flex items-end justify-between mb-12">
        <div>
          <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] uppercase text-[#C4714A] mb-4">
            <span className="w-8 h-px bg-[#C4714A] inline-block" />
            {label}
          </div>
          <h2 className="font-serif text-[clamp(32px,4vw,52px)] font-light leading-[1.15]" dangerouslySetInnerHTML={{ __html: title }} />
        </div>
        <Link href="/collections" className="text-[12px] font-medium tracking-[0.1em] uppercase text-[#1A1714] opacity-50 hover:opacity-100 flex items-center gap-2 no-underline border-b border-[#E8E4DC] pb-1 transition-all hover:gap-3.5">
          View All →
        </Link>
      </div>
      <div className="relative -mx-12">
        <button onClick={() => scrollBy(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white border border-[#E8E4DC] rounded-full flex items-center justify-center z-10 shadow-md hover:bg-[#C8A96E] hover:border-[#C8A96E] transition-all hover:scale-[1.08]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div ref={track} className="flex gap-6 px-12 pb-12 overflow-x-auto [scroll-snap-type:x_mandatory] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map(p => (
            <div key={p.id} className="flex-none w-[280px] [scroll-snap-align:start]">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        <button onClick={() => scrollBy(1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white border border-[#E8E4DC] rounded-full flex items-center justify-center z-10 shadow-md hover:bg-[#C8A96E] hover:border-[#C8A96E] transition-all hover:scale-[1.08]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </section>
  )
}
