'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
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

const FALLBACK_IMAGE =
  'https://images.pexels.com/photos/1123262/pexels-photo-1123262.jpeg?auto=compress&cs=tinysrgb&w=800&h=900&fit=crop'

export default function ProductCard({ product, variant = 'grid' }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const { toggle, has } = useWishlistStore()
  const [mounted, setMounted] = useState(false)
  const [imgSrc, setImgSrc] = useState(product.images[0] || FALLBACK_IMAGE)
  useEffect(() => { setMounted(true) }, [])
  const isWishlisted = mounted && has(product.id)

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
      apiProductId: product.apiProductId,
    })
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    toggle(product.id)
  }

  // ── List variant ──
  if (variant === 'list') {
    return (
      <Link
        href={`/collections/${product.slug}`}
        className="group relative rounded-[16px] overflow-hidden flex flex-row h-[180px] no-underline text-dark cursor-none border border-warm-gray bg-white
          transition-[transform,box-shadow,border-color] duration-[450ms] [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]
          hover:-translate-y-[4px] hover:border-gold/40 hover:shadow-card-hover"
      >
        <div className="relative w-[220px] h-full flex-shrink-0 overflow-hidden bg-offwhite">
          {product.badge && <Badge variant={product.badge} />}
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-[650ms] [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.07]"
            sizes="220px"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
        </div>
        <div className="flex flex-col flex-1 p-[20px_24px] justify-between">
          <div>
            <div className="text-[10px] text-gold tracking-[0.15em] uppercase font-medium mb-1.5">{product.category}</div>
            <div className="font-serif text-[20px] font-normal leading-[1.3] text-dark mb-1.5">{product.name}</div>
            <div className="text-[11.5px] text-mid-gray leading-[1.75] line-clamp-2">{product.subtitle}</div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <StarRating rating={product.rating} size={11} />
                <span className="text-[10px] text-mid-gray ml-1">({product.reviewCount})</span>
              </div>
              <div className="text-[17px] font-medium text-dark flex items-baseline gap-1.5 flex-wrap">
                ₹{product.price.toLocaleString('en-IN')}
                {product.originalPrice && (
                  <span className="text-[13px] text-mid-gray line-through font-light ml-1.5">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                )}
                {product.discount && (
                  <span className="text-[10px] text-green-600 bg-green-600/10 px-1.5 py-0.5 rounded-lg font-medium">–{product.discount}%</span>
                )}
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              className="bg-dark text-white border-none w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all duration-300 hover:bg-gold hover:scale-110 flex-shrink-0 cursor-none"
              aria-label={`Add ${product.name} to cart`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>
      </Link>
    )
  }

  // ── Grid / Related variant ──
  const imgHeight = variant === 'related' ? 'h-[300px]' : 'h-[240px] sm:h-[360px]'

  return (
    <Link
      href={`/collections/${product.slug}`}
      className="product-card relative no-underline cursor-none block"
    >
      {/* Image block — fixed height, clips to rounded corners */}
      <div className={`relative rounded-[20px] overflow-hidden w-full ${imgHeight}`}>

        <Image
          src={imgSrc}
          alt={product.name}
          fill
          className="product-card-img object-cover transition-transform duration-[650ms] [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]"
          sizes={variant === 'related' ? '(max-width: 768px) 50vw, 25vw' : '(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw'}
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />

        {product.badge && <Badge variant={product.badge} />}

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 z-20 border-none w-8 h-8 rounded-full flex items-center justify-center cursor-none shadow-sm transition-[background] duration-300 hover:bg-gold"
          style={{ background: 'rgba(245,240,235,0.95)' }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24"
            fill={isWishlisted ? '#8B5E3C' : 'none'}
            stroke={isWishlisted ? '#8B5E3C' : '#A09488'}
            strokeWidth="1.8"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Desktop hover overlay — hidden by default, slides up on hover via CSS */}
        <div
          className="product-card-overlay absolute bottom-0 left-0 right-0 z-10 px-5 pt-9 pb-5"
          style={{
            background: 'linear-gradient(to top, rgba(44,40,37,0.88) 0%, rgba(44,40,37,0.62) 55%, transparent 100%)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
          }}
        >
          <div className="text-[10px] text-[#E8A87C] tracking-[0.15em] uppercase font-medium mb-1.5">{product.category}</div>
          <div className="font-serif text-[19px] font-normal leading-[1.25] text-[#EDE8E0] mb-2.5">{product.name}</div>
          <div className="flex items-center justify-between">
            <div className="text-[16px] font-medium text-[#EDE8E0] flex items-baseline gap-1.5">
              ₹{product.price.toLocaleString('en-IN')}
              {product.originalPrice && (
                <span className="text-[13px] font-light" style={{ color: 'rgba(250,247,243,0.5)' }}>
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              className="bg-gold text-white border-none w-[34px] h-[34px] rounded-full flex items-center justify-center transition-[background,transform] duration-300 hover:bg-gold-dark hover:scale-110 flex-shrink-0 cursor-none"
              style={{ boxShadow: '0 4px 14px rgba(196,113,74,0.4)' }}
              aria-label={`Add ${product.name} to cart`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile info strip — visible only on touch devices, hidden on hover-capable screens */}
      <div className="product-card-mobile-info pt-3 pb-1 px-1">
        <div className="text-[9px] text-[#C4714A] tracking-[0.14em] uppercase font-medium mb-1">{product.category}</div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-serif text-[15px] font-normal leading-[1.3] text-[#2C2825] truncate">{product.name}</div>
            <div className="flex items-center gap-1 mt-1">
              <StarRating rating={product.rating} size={10} />
              <span className="text-[9px] text-[#A09488]">({product.reviewCount})</span>
            </div>
            <div className="text-[14px] font-medium text-[#2C2825] mt-1 flex items-baseline gap-1.5">
              ₹{product.price.toLocaleString('en-IN')}
              {product.discount && (
                <span className="text-[10px] text-green-600 bg-green-600/10 px-1.5 py-0.5 rounded-md font-medium">–{product.discount}%</span>
              )}
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            className="flex-shrink-0 mt-0.5 bg-[#2C2825] text-white border-none w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-none transition-[background,transform] duration-300 active:scale-95"
            aria-label={`Add ${product.name} to cart`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  )
}
