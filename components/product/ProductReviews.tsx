// components/product/ProductReviews.tsx
import { Product } from '@/lib/types'
import StarRating from '@/components/ui/StarRating'
import ReviewForm from '@/components/product/ReviewForm'

/** Reviews are the only product detail below the fold now — description and specs
 *  moved up into the buy column (ProductDetails). Reviews are still genuinely empty
 *  catalogue-wide, and a blank panel reads as a broken page, so the empty state is
 *  written out. */
export default function ProductReviews({ product }: { product: Product }) {
  return (
    <div>
      <h2 className="font-sans text-[12px] font-medium tracking-[0.1em] uppercase text-[#2C2825] pb-3 border-b border-[#D8D0C4]">
        Reviews{product.reviewCount > 0 ? ` (${product.reviewCount})` : ''}
      </h2>

      <div className="pt-[18px]">
        {product.reviews.length > 0 ? (
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
          <p className="text-[13.5px] leading-[1.9] text-[#A09488] italic max-w-prose">
            No reviews yet for this piece. If you own it, we&apos;d genuinely like to
            hear how it lives in your room.
          </p>
        )}

        {/* Only renders for a signed-in customer whose paid order contained this
            product — see ReviewForm. */}
        <ReviewForm productId={product.apiProductId} />
      </div>
    </div>
  )
}
