// components/product/ProductTabs.tsx
'use client'
import { useState } from 'react'
import { Product } from '@/lib/types'
import StarRating from '@/components/ui/StarRating'
import ReviewForm from '@/components/product/ReviewForm'

type Tab = 'desc' | 'specs' | 'reviews'

/** Description and specs are now composed from the product's stored attributes
 *  (see lib/seo/product-copy.ts), so these empty states only show for a record
 *  with no attributes at all. Reviews are still genuinely empty catalogue-wide.
 *  A blank panel reads as a broken page; a written empty state reads as a page
 *  with nothing to say yet. */
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13.5px] leading-[1.9] text-[#A09488] italic max-w-prose">{children}</p>
  )
}

export default function ProductTabs({ product }: { product: Product }) {
  const [tab, setTab] = useState<Tab>('desc')
  const specs = Object.entries(product.specs)
  const hasDescription = Boolean(product.description?.trim())

  const label = (t: Tab) =>
    t === 'desc' ? 'Description' : t === 'specs' ? 'Specifications' : 'Reviews'

  return (
    <div>
      <div className="border-b border-[#D8D0C4]">
        <div className="flex" role="tablist" aria-label="Product details">
          {(['desc', 'specs', 'reviews'] as Tab[]).map(t => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`tab-${t}`}
              aria-selected={tab === t}
              aria-controls={`panel-${t}`}
              onClick={() => setTab(t)}
              className={`font-sans text-[12px] font-medium tracking-[0.1em] uppercase px-5 min-h-11 relative transition-colors cursor-pointer
                ${tab === t
                  ? 'text-[#2C2825] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:bg-[#C4714A]'
                  : 'text-[#A09488] hover:text-[#2C2825]'
                }`}
            >
              {label(t)}
              {t === 'reviews' && product.reviewCount > 0 ? ` (${product.reviewCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* All three panels stay in the DOM and the inactive ones are hidden, so
          the specifications and reviews ship in the server HTML. Rendering only
          the active tab meant crawlers and answer engines saw the description
          and nothing else. */}
      <div
        id="panel-desc"
        role="tabpanel"
        aria-labelledby="tab-desc"
        hidden={tab !== 'desc'}
        tabIndex={0}
        className="pt-[18px] min-h-[120px]"
      >
        {
          hasDescription ? (
            <p className="text-[13.5px] leading-[1.9] text-[#4A4540] max-w-prose">{product.description}</p>
          ) : (
            <Empty>
              We haven&apos;t written this piece up yet. The specifications tab and the
              product photographs carry everything we can confirm today — call us on the
              contact page and we&apos;ll answer anything they don&apos;t.
            </Empty>
          )
        }
      </div>

      <div
        id="panel-specs"
        role="tabpanel"
        aria-labelledby="tab-specs"
        hidden={tab !== 'specs'}
        tabIndex={0}
        className="pt-[18px] min-h-[120px]"
      >
        {
          specs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 max-w-4xl">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 text-[12.5px] py-2.5 border-b border-[#D8D0C4]">
                  <span className="text-[#A09488]">{k}</span>
                  <span className="text-[#2C2825] text-right max-w-[55%]">{v}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty>
              Full specifications for this piece aren&apos;t published yet. The size and
              finish options above are accurate, and the SKU will get you an exact answer
              on dimensions and wattage from our team.
            </Empty>
          )
        }
      </div>

      <div
        id="panel-reviews"
        role="tabpanel"
        aria-labelledby="tab-reviews"
        hidden={tab !== 'reviews'}
        tabIndex={0}
        className="pt-[18px] min-h-[120px]"
      >
        {
          product.reviews.length > 0 ? (
            <div className="flex flex-col gap-4 max-w-3xl">
              {product.reviews.map(r => (
                <div key={r.id} className="py-4 border-b border-[#D8D0C4]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[34px] h-[34px] rounded-full bg-[#E2DAD0] border border-[#D8D0C4] flex items-center justify-center font-serif text-[14px] text-[#8B5E3C]">
                        {r.author[0]}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-[#2C2825]">{r.author}</div>
                        <div className="text-[11px] text-[#A09488]">{r.location}</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#A09488]">{r.date}</span>
                  </div>
                  <StarRating rating={r.rating} size={12} />
                  {r.title && (
                    <p className="text-[13.5px] font-medium text-[#2C2825] mt-2">{r.title}</p>
                  )}
                  <p className="font-serif text-[16px] italic mt-2 text-[#4A4540] leading-[1.8]">{r.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <Empty>
              No reviews yet for this piece. If you own it, we&apos;d genuinely like to
              hear how it lives in your room.
            </Empty>
          )
        }

        {/* Only renders for a signed-in customer whose paid order contained this
            product — see ReviewForm. */}
        <ReviewForm productId={product.apiProductId} />
      </div>
    </div>
  )
}
