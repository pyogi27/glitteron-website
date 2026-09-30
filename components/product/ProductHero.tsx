// components/product/ProductHero.tsx
'use client'
import { useState } from 'react'
import type { Product, ProductVariation } from '@/lib/types'
import ProductGallery from './ProductGallery'
import ProductInfo from './ProductInfo'

/**
 * Gallery + buy box. Exists only so the variation the shopper picks in ProductInfo can
 * drive which photos ProductGallery shows. Starts at null so the server render shows the
 * product's own photography; the first pick swaps to the variation's.
 */
export default function ProductHero({ product }: { product: Product }) {
  const [picked, setPicked] = useState<ProductVariation | null>(null)

  const usePicked = Boolean(picked?.images?.length)
  const images = usePicked ? picked!.images! : product.images
  // The product-level lit shot is framed for the product photo; over a variation photo
  // it would outline a second lamp, so only the variation's own lit shot is used there.
  const lightOnImage = usePicked ? picked!.lightOnImage : product.lightOnImage

  return (
    // Split layout — gallery sticks, buy box scrolls with the page.
    // One scroll container for the whole route.
    <div className="grid grid-cols-1 lg:grid-cols-2 items-start">
      {/* key: a new image set restarts at image 1 (and slide 1 of the mobile carousel).
          The whole list, not images[0]: two sets can share a first photo and differ in
          length, which would leave `active` pointing past the end. The lit shot is in the
          key too, so a stale load failure cannot hide a different lit image. */}
      <ProductGallery
        key={`${images.join('|')}#${lightOnImage ?? ''}`}
        images={images}
        name={product.name}
        lightOnImage={lightOnImage}
      />
      <ProductInfo product={product} onVariationChange={setPicked} />
    </div>
  )
}
