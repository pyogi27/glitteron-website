'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import StarRating from '@/components/ui/StarRating'
import { useCartStore } from '@/lib/stores/cartStore'
import { useWishlistStore } from '@/lib/stores/wishlistStore'

type CardVariant = 'grid' | 'list' | 'related'

interface ProductCardProps {
  product: Product
  variant?: CardVariant
}

export default function ProductCard({ product, variant = 'grid' }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const { toggle, has } = useWishlistStore()
  const isWishlisted = has(product.id)

  const imgHeight = variant === 'related' ? 'h-[220px]' : 'h-[250px]'

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: 1,
      size: product.variants.sizes[0] ?? '',
      finish: product.variants.finishes[0] ?? '',
    })
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    toggle(product.id)
  }

  return (
    <Link
      href={`/collections/${product.slug}`}
      className={`group relative rounded-[14px] overflow-hidden bg-white border border-warm-gray flex flex-col no-underline text-dark transition-all duration-[420ms] cursor-none
        hover:-translate-y-[7px] hover:border-gold/45 hover:shadow-card-hover
        ${variant === 'list' ? 'flex-row h-[180px]' : ''}`}
    >
      {/* Image area */}
      <div
        className={`relative overflow-hidden bg-offwhite flex-shrink-0
          ${variant === 'list' ? 'w-[220px] h-full' : imgHeight}`}
      >
        {product.badge && <Badge variant={product.badge} />}

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 z-10 bg-white/90 border-none w-8 h-8 rounded-full flex items-center justify-center transition-all duration-[250ms] hover:bg-gold-light shadow-sm cursor-none"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={isWishlisted ? '#9A7840' : 'none'}
            stroke={isWishlisted ? '#9A7840' : '#9A958C'}
            strokeWidth="1.8"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Quick View */}
        <button
          onClick={(e) => e.preventDefault()}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-2.5 bg-white/96 border border-warm-gray text-dark px-5 py-[7px] rounded-2xl text-[10px] font-medium tracking-[0.1em] uppercase opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[280ms] z-10 hover:bg-gold hover:border-gold whitespace-nowrap cursor-none"
        >
          Quick View
        </button>

        {/* Product image */}
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-[600ms] group-hover:scale-[1.07]"
          sizes={
            variant === 'related'
              ? '(max-width: 768px) 50vw, 25vw'
              : '(max-width: 768px) 100vw, 33vw'
          }
        />
      </div>

      {/* Info area */}
      <div
        className={`flex flex-col flex-1 relative z-[1] bg-white
          ${variant === 'list' ? 'p-[20px_24px] justify-between' : 'p-[18px_20px_20px]'}`}
      >
        <div className="text-[10px] text-gold tracking-[0.16em] uppercase font-medium mb-1.5">
          {product.category}
        </div>
        <div
          className={`font-serif font-normal leading-[1.25] text-dark mb-1.5
            ${variant === 'list' ? 'text-[20px]' : 'text-[18px]'}`}
        >
          {product.name}
        </div>
        <div className="text-[11.5px] text-mid-gray leading-[1.75] mb-2.5 line-clamp-2 flex-1">
          {product.subtitle}
        </div>

        <div className="flex items-center gap-1 mb-3">
          <StarRating rating={product.rating} size={11} />
          <span className="text-[10px] text-mid-gray ml-1">({product.reviewCount})</span>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="text-[17px] font-medium text-dark flex items-baseline gap-1.5 flex-wrap">
            ₹{product.price.toLocaleString('en-IN')}
            {product.originalPrice && (
              <span className="text-[12px] text-mid-gray line-through font-light">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
            {product.discount && (
              <span className="text-[10px] text-green-600 bg-green-600/10 px-1.5 py-0.5 rounded-lg font-medium">
                –{product.discount}%
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            className="bg-dark text-white border-none w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all duration-300 hover:bg-gold hover:scale-110 flex-shrink-0 cursor-none"
            aria-label={`Add ${product.name} to cart`}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  )
}
