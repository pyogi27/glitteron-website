'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Product } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import StarRating from '@/components/ui/StarRating'
import { useCartStore } from '@/lib/stores/cartStore'
import { useWishlistStore } from '@/lib/stores/wishlistStore'
import { useFilterStore } from '@/lib/stores/filterStore'

type CardVariant = 'grid' | 'list' | 'related'

interface ProductCardProps {
  product: Product
  variant?: CardVariant
  /**
   * Load the image eagerly. Set on the cards above the fold only — a listing
   * page's LCP element is the first card image, and Next lazy-loads it by
   * default, which put the whole download behind layout.
   */
  priority?: boolean
}

/**
 * How many cards a listing grid should mark `priority`. Two rows on mobile
 * (2 columns), the first row plus one on desktop (3 columns) — enough to cover
 * the LCP candidate without the eager-load storm that priority-everything gives.
 */
export const EAGER_CARDS = 4

const FALLBACK_IMAGE =
  'https://images.pexels.com/photos/1123262/pexels-photo-1123262.jpeg?auto=compress&cs=tinysrgb&w=800&h=900&fit=crop'

export default function ProductCard({ product, variant = 'grid', priority = false }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const { toggle, has } = useWishlistStore()
  const [mounted, setMounted] = useState(false)
  const [imgSrc, setImgSrc] = useState(product.images[0] || FALLBACK_IMAGE)
  const lightOn = useFilterStore((s) => s.lightOn)
  const [litFailed, setLitFailed] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const isWishlisted = mounted && has(product.id)
  // Lit layer sits above the base image and crossfades in — and the base fades
  // OUT as it does. Both shots are alpha PNGs framed slightly differently, so
  // leaving the base at full opacity underneath showed its silhouette around
  // the lit one: one lamp rendered as two. Products without a lightOnImage
  // simply keep showing the off state.
  const litSrc = !litFailed ? product.lightOnImage : undefined
  const showLit = lightOn && Boolean(litSrc)
  // The lit layer is invisible until the lights-on toggle is used, but it was
  // still downloading on load — a second image per card, 100 cards per listing
  // page. Mount it on first use and keep it mounted so toggling back off still
  // crossfades rather than popping.
  const [litMounted, setLitMounted] = useState(false)
  useEffect(() => {
    if (showLit) setLitMounted(true)
  }, [showLit])

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
            className={`object-cover transition-[transform,opacity] duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.07]
              ${showLit ? 'opacity-0' : 'opacity-100'}`}
            sizes="220px"
            priority={priority}
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
          {litMounted && litSrc && (
            <Image
              src={litSrc}
              alt=""
              aria-hidden="true"
              fill
              className={`object-cover transition-[opacity,transform] duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]
                group-hover:scale-[1.07] ${showLit ? 'opacity-100' : 'opacity-0'}`}
              sizes="220px"
              onError={() => setLitFailed(true)}
            />
          )}
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
          className={`product-card-img object-cover transition-[transform,opacity] duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]
            ${showLit ? 'opacity-0' : 'opacity-100'}`}
          sizes={variant === 'related' ? '(max-width: 768px) 50vw, 25vw' : '(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw'}
          priority={priority}
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />

        {litMounted && litSrc && (
          <Image
            src={litSrc}
            alt=""
            aria-hidden="true"
            fill
            className={`product-card-img object-cover transition-[opacity,transform] duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] ${showLit ? 'opacity-100' : 'opacity-0'}`}
            sizes={variant === 'related' ? '(max-width: 768px) 50vw, 25vw' : '(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw'}
            onError={() => setLitFailed(true)}
          />
        )}

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

        {/* Hover reveal. No panel behind it — the text sits straight on the
            artwork and a text-shadow halo carries the contrast, so nothing
            covers the product. The halo direction flips with the light toggle:
            product shots are pale, so dark-text-on-light-halo by default;
            lit shots go dark, so white-text-on-dark-halo.

            On pointer devices this is the only copy of name and price, so
            unlike a decorative overlay it stays in the accessibility tree and
            its button stays focusable — and globals.css reveals it on
            :focus-within so a keyboard user can see what they have focused. */}
        <div
          className={`product-card-reveal absolute bottom-0 left-0 right-0 z-10 px-5 pt-4 pb-5
            ${lightOn ? 'product-card-overlay-text' : 'product-card-overlay-text-dark'}`}
        >
          <div className={`font-serif text-[19px] font-normal leading-[1.25] mb-2.5 truncate ${lightOn ? 'text-white' : 'text-[#1A1715]'}`}>
            {product.name}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className={`text-[17px] font-medium flex items-baseline gap-1.5 flex-wrap ${lightOn ? 'text-white' : 'text-[#1A1715]'}`}>
              ₹{product.price.toLocaleString('en-IN')}
              {product.originalPrice && (
                <span
                  className="text-[13px] font-light line-through"
                  style={{ color: lightOn ? 'rgba(255,255,255,0.8)' : 'rgba(26,23,21,0.68)' }}
                >
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              className="bg-gold text-white border-none w-[34px] h-[34px] rounded-full flex items-center justify-center transition-[background,transform] duration-300 hover:bg-gold-dark hover:scale-110 flex-shrink-0"
              style={{ boxShadow: '0 4px 14px rgba(168,91,59,0.45)' }}
              aria-label={`Add ${product.name} to cart`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Touch fallback only — hidden wherever hover works, so pointer devices
          get the clean image-only card. It has to exist for phones and tablets:
          with no hover there is otherwise no name, no price and no way to add
          to cart anywhere on the card. */}
      <div className="product-card-info pt-3 pb-1 px-1">
        {/* API products can have an empty category — don't render a blank eyebrow. */}
        {product.category && (
          <div className="text-[10px] text-[#A8552C] tracking-[0.14em] uppercase font-medium mb-1">{product.category}</div>
        )}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-serif text-[16px] font-normal leading-[1.3] text-[#2C2825] truncate">{product.name}</div>
            {/* API products come back with reviewCount 0, which rendered an empty
                five-star row and a bare "(0)" on every card — worse than showing
                no rating at all. */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <StarRating rating={product.rating} size={10} />
                <span className="text-[10px] text-[#6E655C]">({product.reviewCount})</span>
              </div>
            )}
            <div className="text-[16px] font-medium text-[#2C2825] mt-1 flex items-baseline gap-1.5 flex-wrap">
              ₹{product.price.toLocaleString('en-IN')}
              {product.originalPrice && (
                <span className="text-[13px] text-[#6E655C] line-through font-light">₹{product.originalPrice.toLocaleString('en-IN')}</span>
              )}
              {product.discount && (
                <span className="text-[10px] text-green-700 bg-green-700/10 px-1.5 py-0.5 rounded-md font-medium">–{product.discount}%</span>
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
