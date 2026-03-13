// components/product/ProductTabs.tsx
'use client'
import { useState } from 'react'
import { Product } from '@/lib/types'
import StarRating from '@/components/ui/StarRating'

type Tab = 'desc' | 'specs' | 'reviews'

export default function ProductTabs({ product }: { product: Product }) {
  const [tab, setTab] = useState<Tab>('desc')
  return (
    <div>
      <div className="border-b border-[#E8E4DC] mb-0">
        <div className="flex">
          {(['desc', 'specs', 'reviews'] as Tab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`font-sans text-[12px] font-medium tracking-[0.1em] uppercase px-5 py-3 relative transition-colors
                ${tab === t
                  ? 'text-[#1A1714] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:bg-[#C8A96E]'
                  : 'text-[#9A958C] hover:text-[#1A1714]'
                }`}
            >
              {t === 'desc' ? 'Description' : t === 'specs' ? 'Specifications' : `Reviews (${product.reviewCount})`}
            </button>
          ))}
        </div>
      </div>
      <div className="pt-[18px]">
        {tab === 'desc' && (
          <p className="text-[13.5px] leading-[1.9] text-[#4A4540]">{product.description}</p>
        )}
        {tab === 'specs' && (
          <div className="grid grid-cols-2 gap-x-6">
            {Object.entries(product.specs).map(([k, v]) => (
              <div key={k} className="flex justify-between text-[12.5px] py-2.5 border-b border-[#E8E4DC]">
                <span className="text-[#9A958C]">{k}</span>
                <span className="text-[#1A1714] text-right max-w-[55%]">{v}</span>
              </div>
            ))}
          </div>
        )}
        {tab === 'reviews' && (
          <div className="flex flex-col gap-4">
            {product.reviews.map(r => (
              <div key={r.id} className="py-4 border-b border-[#E8E4DC]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-[34px] h-[34px] rounded-full bg-[#F4F1EB] border border-[#E8E4DC] flex items-center justify-center font-serif text-[14px] text-[#9A7840]">
                      {r.author[0]}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-[#1A1714]">{r.author}</div>
                      <div className="text-[11px] text-[#9A958C]">{r.location}</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#9A958C]">{r.date}</span>
                </div>
                <StarRating rating={r.rating} size={12} />
                <p className="font-serif text-[16px] italic mt-2 text-[#4A4540] leading-[1.8]">{r.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
