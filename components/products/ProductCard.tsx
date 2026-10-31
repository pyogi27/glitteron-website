'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Product } from '@/lib/types'
import { formatListingPrice } from '@/lib/pricing'
import Badge from '@/components/ui/Badge'
import StarRating from '@/components/ui/StarRating'
import { useCartStore } from '@/lib/stores/cartStore'
import { useWishlistStore } from '@/lib/stores/wishlistStore'
import { useFilterStore } from '@/lib/stores/filterStore'

/** `deal`: the homepage Deal of the Day card — the shared card on a light panel, discount as its badge. */
type CardVariant = 'grid' | 'list' | 'related' | 'deal'

interface ProductCardProps {
  product: Product
  variant?: CardVariant
  /**
   * Load the image eagerly. Set on the cards above the fold only — a listing
   * page's LCP element is the first card image, and Next lazy-loads it by
   * default, which put the whole download behind layout.
   */
  priority?: boolean
  /** Grid variant only: override the `sizes` hint when the card is not in a column grid (e.g. a fixed-width rail). */
  sizes?: string
  /**
   * Follow the collections page Light toggle (on by default): show the lit shot,
   * and the unlit one on hover. Off elsewhere, where there is no toggle to turn it off.
   */
  lightToggle?: boolean
}

/**
 * How many cards a listing grid should mark `priority`. Two rows on mobile
 * (2 columns), the first row plus one on desktop (3 columns) — enough to cover
 * the LCP candidate without the eager-load storm that priority-everything gives.
 */
export const EAGER_CARDS = 4

// `sizes` hints, matched to each variant's rendered width per breakpoint.
// List: 38% of the card on phones, capped at 220px.
const LIST_SIZES = '(min-width: 640px) 220px, 38vw'
// Deal: fixed-width rail item (DealOfTheDay: w-[220px] md:w-[236px]).
const DEAL_SIZES = '(min-width: 768px) 236px, 220px'
// Related: 1 column, 2 from sm, 4 from lg inside max-w-6xl.
const RELATED_SIZES = '(min-width: 1024px) 270px, (min-width: 640px) 50vw, 100vw'
// Grid: 2 columns, 3+ from lg (collections, wishlist).
const GRID_SIZES = '(min-width: 1024px) 33vw, 50vw'

const FALLBACK_IMAGE =
  'https://images.pexels.com/photos/1123262/pexels-photo-1123262.jpeg?auto=compress&cs=tinysrgb&w=800&h=900&fit=crop'

export default function ProductCard({ product, variant = 'grid', priority = false, sizes, lightToggle = false }: ProductCardProps) {
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
  const showLit = lightToggle && lightOn && Boolean(litSrc)
  // Mount the lit layer only once it is shown, so cards that never light up don't
  // download a second image, and keep it mounted so toggling back off still
  // crossfades rather than popping. Starts mounted when lit on first render, so
  // the grid opens on the lit shot instead of flashing the unlit one.
  const [litMounted, setLitMounted] = useState(showLit)
  // While lit, hovering the card fades back to the unlit shot (group-hover only
  // fires on hover-capable devices, so touch keeps the lit one).
  const baseFade = showLit ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
  const litFade = showLit ? 'opacity-100 group-hover:opacity-0' : 'opacity-0'
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
        className="group relative rounded-[16px] overflow-hidden flex flex-row no-underline text-dark cursor-none border border-warm-gray bg-white
          transition-[transform,box-shadow,border-color] duration-[450ms] [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]
          hover:-translate-y-[4px] hover:border-gold/40 hover:shadow-card-hover"
      >
        {/* The ratio sets the row's minimum height (220x180 at full size, as before); the
            column still stretches if the text runs taller, and object-contain shows the
            whole photo either way. 38% on phones so the text column keeps room. */}
        <div className="relative w-[38%] max-w-[220px] aspect-[11/9] flex-shrink-0 overflow-hidden bg-offwhite">
          {product.badge && <Badge variant={product.badge} />}
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className={`object-contain transition-[transform,opacity] duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.07]
              ${baseFade}`}
            sizes={LIST_SIZES}
            priority={priority && !showLit}
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
          {litMounted && litSrc && (
            <Image
              src={litSrc}
              alt=""
              aria-hidden="true"
              fill
              className={`object-contain transition-[opacity,transform] duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]
                group-hover:scale-[1.07] ${litFade}`}
              sizes={LIST_SIZES}
              priority={priority && showLit}
              onError={() => setLitFailed(true)}
            />
          )}
        </div>
        <div className="flex flex-col flex-1 min-w-0 p-4 sm:p-[20px_24px] justify-between">
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
                {formatListingPrice(product)}
                {product.originalPrice && (
                  <span className="text-[13px] text-mid-gray line-through font-normal ml-1.5">₹{product.originalPrice.toLocaleString('en-IN')}</span>
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

  // ── Grid / Related / Deal ──
  // One card everywhere, modelled on the Fig Living grid: image tile with a tinted
  // badge, then name and price always visible underneath. No hover reveal, which
  // touch screens cannot trigger. An <article> with two links to the product, not
  // one big <Link>, so the wishlist and add buttons are real buttons rather than
  // ones nested in an <a>. The image link is a duplicate, so it is hidden from
  // keyboard and screen readers; the name link is the one they use.
  // `deal` sits on the dark Deal of the Day ground, so it gets a light panel and
  // the discount as its badge.
  const href = `/collections/${product.slug}`
  const isDeal = variant === 'deal'
  const imgSizes = isDeal ? DEAL_SIZES : variant === 'related' ? RELATED_SIZES : sizes ?? GRID_SIZES
  const imgClass = 'product-card-img object-contain transition-[transform,opacity] duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)]'

  return (
    <article className={`product-card group relative h-full flex flex-col ${isDeal ? 'bg-white p-2.5 pb-3.5' : ''}`}>
      {/* #FFF: the catalogue shots are on white, so the tile reads as one photo edge to edge. */}
      <div className="relative aspect-square overflow-hidden bg-[#FFFFFF]">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0 cursor-none">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className={`${imgClass} ${baseFade}`}
            sizes={imgSizes}
            priority={priority && !showLit}
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
          {litMounted && litSrc && (
            <Image
              src={litSrc}
              alt=""
              fill
              className={`${imgClass} ${litFade}`}
              sizes={imgSizes}
              priority={priority && showLit}
              onError={() => setLitFailed(true)}
            />
          )}
        </Link>

        {isDeal && product.discount
          ? <Badge variant="sale" label={`${product.discount}% Off`} />
          : product.badge && <Badge variant={product.badge} />}

        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 z-20 border-none w-8 h-8 rounded-full flex items-center justify-center cursor-none shadow-sm bg-[#F5F0EB]/95 transition-[background] duration-300 hover:bg-gold"
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={isWishlisted ? '#8B5E3C' : 'none'} stroke={isWishlisted ? '#8B5E3C' : '#7A6E62'} strokeWidth="1.8">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* A variation product has no single price or stock to add: send the shopper
            to pick one rather than adding a variation they did not choose. */}
        {product.hasVariations ? (
          <Link
            href={href}
            aria-label={`Choose options for ${product.name}`}
            className="absolute bottom-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-[#2C2825] text-[#EDE8E0] no-underline cursor-none shadow-sm transition-[background,transform] duration-300 hover:bg-gold active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </Link>
        ) : (
          <button
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className="absolute bottom-3 right-3 z-20 border-none w-9 h-9 rounded-full flex items-center justify-center bg-[#2C2825] text-[#EDE8E0] cursor-none shadow-sm transition-[background,transform] duration-300 hover:bg-gold active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}
      </div>

      <Link href={href} className="block pt-3 no-underline cursor-none">
        <div className="font-sans text-[13px] font-bold uppercase tracking-[0.04em] leading-[1.35] text-[#2C2825] truncate">
          {product.name}
        </div>
        <div className="mt-1.5 text-[13px] font-bold text-[#2C2825] flex items-baseline gap-x-2 flex-wrap">
          {formatListingPrice(product)}
          {product.originalPrice && (
            <s className="font-medium text-[#6E655C]">₹{product.originalPrice.toLocaleString('en-IN')}</s>
          )}
          {product.discount && !isDeal && (
            <span className="text-[11px] text-[#2E6B2A]">{product.discount}% off</span>
          )}
        </div>
      </Link>
    </article>
  )
}
