// components/product/ProductInfo.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Product, ProductVariation } from '@/lib/types'
import StarRating from '@/components/ui/StarRating'
import VariantSelector from './VariantSelector'
import QuantityControl from './QuantityControl'
import { useCartStore } from '@/lib/stores/cartStore'
import { useWishlistStore } from '@/lib/stores/wishlistStore'
import {
  resolveVariation,
  sizeOptions,
  finishOptions,
  unavailableFinishes,
  unlabelledVariations,
  finishImage,
} from '@/lib/variations'
import { parseWhereUsed } from '@/lib/data/visualizer'
import RoomVisualizerModal from './RoomVisualizerModal'
import ProductDetails from './ProductDetails'

const PERKS = [
  {
    label: 'Free Delivery',
    sub: 'On every order, no minimum',
    path: 'M1 3h13v13H1zM14 8h4l3 3v5h-7M5.5 19.5a2 2 0 100-4 2 2 0 000 4zM16.5 19.5a2 2 0 100-4 2 2 0 000 4z',
  },
  {
    label: '5yr Warranty',
    sub: 'On all products',
    path: 'M12 2l8 3.5v6c0 4.8-3.3 9.1-8 10.5-4.7-1.4-8-5.7-8-10.5v-6zM9 12l2 2 4-4',
  },
  {
    label: 'Expert Install',
    sub: 'Available on request',
    path: 'M14.7 6.3a4 4 0 01-5 5L4 17v3h3l5.7-5.7a4 4 0 015-5l-2.5 2.5 2.1 2.1z',
  },
]

interface Props {
  product: Product
  /** Fired on every pick with the row it resolved to, so the gallery can follow. */
  onVariationChange?: (variation: ProductVariation | null) => void
}

export default function ProductInfo({ product, onVariationChange }: Props) {
  // Options come from the real variation rows when the product has them, and fall back to
  // the denormalised summary strings otherwise (products with no variations, or when the
  // detail endpoint was not the source). Row-derived options are always purchasable; the
  // summary strings include phantoms split out of the decorative `bodyColors` field.
  const rowSizes = sizeOptions(product.variations)
  const hasRowVariations = (product.variations?.length ?? 0) > 0

  const [qty, setQty] = useState(1)
  const [size, setSize] = useState(
    (hasRowVariations ? rowSizes[0] : product.variants.sizes[0]) ?? '',
  )
  const [finish, setFinish] = useState(
    (hasRowVariations
      ? finishOptions(product.variations, rowSizes[0])[0]
      : product.variants.finishes[0]) ?? '',
  )
  /**
   * Set when the shopper picks a name-labelled option — a variation row whose size and
   * colour are both blank, so nothing can be matched on. Measured 2026-08-04: 8 such rows
   * across 5 products were previously unbuyable, the worst worth 18,300 per unit.
   */
  const [pickedVariationId, setPickedVariationId] = useState<number | undefined>(undefined)
  /** The gallery shows product photos until the first pick, and the cart line follows it. */
  const [hasPicked, setHasPicked] = useState(false)

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const router = useRouter()

  // Sticky mobile buy bar: shown once the real Add to Cart row has scrolled out of view.
  const actionsRef = useRef<HTMLDivElement>(null)
  const [showStickyBar, setShowStickyBar] = useState(false)
  useEffect(() => {
    const el = actionsRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { rootMargin: '0px 0px -80px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const [vizOpen, setVizOpen] = useState(false)
  const parsedRoomTypes = parseWhereUsed(product.whereUsed)
  // Fall back to Living Room so the button always shows
  const roomTypes: import('@/lib/data/visualizer').RoomType[] = parsedRoomTypes.length > 0 ? parsedRoomTypes : ['Living Room']

  const addItem = useCartStore(s => s.addItem)
  const { toggle, has } = useWishlistStore()
  const wishlisted = mounted && has(product.id)

  // Options for the selectors, narrowed so every offered pair maps to a real row.
  const sizes = hasRowVariations ? rowSizes : product.variants.sizes
  const finishes = hasRowVariations
    ? finishOptions(product.variations)
    : product.variants.finishes
  // Finishes that exist but not for the chosen size — shown struck-through rather than
  // hidden, so options do not silently appear and disappear as the size changes.
  const finishesUnavailable = hasRowVariations
    ? unavailableFinishes(product.variations, size)
    : []
  // Rows reachable only by name.
  const namedOnly = unlabelledVariations(product.variations)

  /**
   * Finish is ONE control. Each option shows the best picture the data allows: the
   * variation's own photo, else its `crystalTones` colour dot, else just its name.
   * `crystalTones` was measured to be a strict subset of `finishes`, so the dot is a
   * picture of a finish, never a second axis.
   */
  const toneHex = new Map((product.variants.crystalTones ?? []).map(ct => [ct.name, ct.hex]))
  const finishVisual = (f: string) => {
    const photo = finishImage(product.variations, f, size)
    if (photo) {
      return (
        <Image
          src={photo}
          alt=""
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover bg-[#E2DAD0] flex-shrink-0"
        />
      )
    }
    const hex = toneHex.get(f)
    if (hex) {
      return (
        <span
          aria-hidden="true"
          className="w-[22px] h-[22px] ml-2 rounded-full border border-[#D8D0C4] flex-shrink-0"
          style={{ backgroundColor: hex }}
        />
      )
    }
    return null
  }

  // The variation the current selection points at. An explicit id (from a name-labelled
  // option) wins; otherwise size + finish are matched against the rows. null means no
  // match, so no id is sent and the backend prices from the parent product.
  const selectedVariation = resolveVariation(
    product.variations,
    size,
    finish,
    pickedVariationId,
  )

  // Picking a size or finish supersedes a previously picked name-labelled option.
  // Each pick reports the row it lands on from the handler itself, not an effect, so the
  // first paint keeps the product's own photos and only a real pick swaps them.
  const selectSize = (value: string) => {
    setSize(value)
    setPickedVariationId(undefined)
    // If the current finish is not available for the new size, move to one that is.
    const available = finishOptions(product.variations, value)
    const nextFinish = available.length && !available.includes(finish) ? available[0] : finish
    setFinish(nextFinish)
    setHasPicked(true)
    onVariationChange?.(resolveVariation(product.variations, value, nextFinish))
  }
  const selectFinish = (value: string) => {
    if (finishesUnavailable.includes(value)) return
    setFinish(value)
    setPickedVariationId(undefined)
    setHasPicked(true)
    onVariationChange?.(resolveVariation(product.variations, size, value))
  }

  // Show the price that will actually be charged. Checkout re-reads variation.price
  // server-side, so displaying the parent price here while charging the variation price
  // would just move the surprise to the payment screen.
  const effectivePrice = selectedVariation?.price ?? product.price

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: effectivePrice,
      // Same picture the gallery is showing (see ProductHero).
      image: (hasPicked && selectedVariation?.images?.[0]) || product.images[0],
      quantity: qty,
      size,
      finish,
      apiProductId: product.apiProductId,
      productVariationId: selectedVariation?.id,
    })
  }

  // Buy Now used to call handleAddToCart and stay put — same behaviour as Add to Cart
  // under a label that promises checkout.
  const handleBuyNow = () => {
    handleAddToCart()
    router.push('/checkout')
  }

  const emi = Math.round(effectivePrice / 12)

  // A variation carries its own stock. Fall back to the product-level count when the
  // selection has not resolved to a row.
  const inStock = selectedVariation ? selectedVariation.inStock : product.stock > 0

  // Ceiling for the quantity stepper. A resolved variation has its own stock but the
  // API's variation rows do not expose a usable count here, so cap by the product total
  // rather than pinning to 1 — the backend re-checks availability at checkout anyway
  // (CreateCheckout locks the row and rejects if quantity - reserved is short).
  const maxQty = product.stock > 0 ? product.stock : undefined

  return (
    // ponytail: no overflow/height here — the buy box flows in the page scroll.
    // A second scroll container next to the page scroll traps the wheel and hides
    // the Add to Cart button behind an invisible boundary.
    <div className="p-5 lg:p-[40px_48px_48px_40px] bg-white">
      {/* Category */}
      <div className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#C4714A] mb-3">{product.category}</div>

      {/* Title */}
      {/* The headline describes the piece; `name` is the model code and stays
          visible on the SKU line below. */}
      <h1 className="font-serif text-[clamp(28px,3vw,40px)] font-light leading-[1.2] text-[#2C2825] mb-2">
        {product.headline || product.name}
      </h1>

      {/* SKU + Stock */}
      <div className="flex items-center gap-4 text-[11px] text-[#A09488] mb-4 mt-3">
        <span>SKU: {product.sku}</span>
        {inStock ? (
          <span className="text-green-600 font-medium">in stock</span>
        ) : (
          <span className="text-[#C4714A] font-medium">out of stock</span>
        )}
      </div>

      {/* Rating — hidden with no reviews. An empty 5-star row reading "(0 reviews)"
          sits above the price and tells the shopper nobody has bought this. */}
      {product.reviewCount > 0 && (
        <div className="flex items-center gap-2 mb-5">
          <StarRating rating={product.rating} size={14} />
          <span className="text-[12px] text-[#A09488]">({product.reviewCount} reviews)</span>
        </div>
      )}

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-3 mb-1">
          <span className="font-serif text-[32px] font-light text-[#2C2825]">
            ₹{effectivePrice.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && (
            <span className="text-[15px] text-[#A09488] line-through font-light">
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
          {product.discount && (
            <span className="text-[11px] text-green-600 bg-green-600/10 px-2 py-0.5 rounded-lg font-medium">
              Save {product.discount}%
            </span>
          )}
        </div>
      </div>

      {/* Variants */}
      <VariantSelector label="Size" value={size} options={sizes} onChange={selectSize} />
      <VariantSelector
        label="Finish"
        value={finish}
        options={finishes}
        disabledOptions={finishesUnavailable}
        disabledReason={`not available in ${size}`}
        visual={finishVisual}
        onChange={selectFinish}
      />

      {/* Variation rows whose size and colour are both blank cannot be reached by the
          selectors above — their identity is the name. Offering them here is what makes
          them purchasable at all. */}
      {namedOnly.length > 1 && (
        <VariantSelector
          label="Option"
          value={selectedVariation && namedOnly.some(v => v.id === selectedVariation.id)
            ? selectedVariation.name
            : ''}
          options={namedOnly.map(v => v.name)}
          onChange={(name) => {
            const row = namedOnly.find(v => v.name === name)
            if (!row) return
            setPickedVariationId(row.id)
            setHasPicked(true)
            onVariationChange?.(row)
          }}
        />
      )}

      {/* Quantity + Actions */}
      <div ref={actionsRef} className="flex items-center gap-3 mb-4">
        <QuantityControl value={qty} max={maxQty} onChange={setQty} />
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock}
          className="flex-1 bg-[#2C2825] text-white border-none min-h-11 py-3 rounded-3xl font-sans text-[13px] font-medium tracking-[0.08em] uppercase cursor-pointer transition-colors hover:bg-[#8B5E3C] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#2C2825]"
        >
          {inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all ${wishlisted ? 'bg-[#E8A87C] border-[#C4714A]' : 'border-[#D8D0C4] hover:border-[#C4714A] hover:bg-[#E2DAD0]'}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? '#8B5E3C' : 'none'} stroke={wishlisted ? '#8B5E3C' : '#A09488'} strokeWidth="1.8">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={!inStock}
        className="w-full bg-[#C4714A] text-[#2C2825] border-none min-h-11 py-3 rounded-3xl font-sans text-[13px] font-semibold tracking-[0.08em] uppercase cursor-pointer transition-colors hover:bg-[#E8A87C] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#C4714A]"
      >
        Buy Now
      </button>

      {/* View in Room */}
      <button
          type="button"
          onClick={() => setVizOpen(true)}
          className="w-full flex items-center justify-center gap-2 border border-[#D8D0C4] text-[#2C2825] py-3 rounded-3xl font-sans text-[13px] font-medium tracking-[0.06em] mt-3 mb-7 transition-all hover:border-[#C4714A] hover:text-[#C4714A] hover:bg-[#FDF9F6]"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth={1.6}>
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          View in Room
        </button>

      <ProductDetails product={product} />

      {/* Perks */}
      <div className="grid grid-cols-3 gap-4 py-5 border-y border-[#D8D0C4] mb-7">
        {PERKS.map(p => (
          <div key={p.label} className="flex items-start gap-2.5">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="w-5 h-5 flex-shrink-0 stroke-[#8B5E3C] fill-none"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={p.path} />
            </svg>
            <div>
              <div className="text-[11px] font-semibold text-[#2C2825]">{p.label}</div>
              <div className="text-[10px] leading-[1.45] text-[#A09488]">{p.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky mobile buy bar. Desktop keeps the sticky gallery as its anchor, so this
          is below lg only. Hidden until the real buy row leaves the viewport, otherwise
          it duplicates a button the shopper is already looking at. */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-[#D8D0C4] px-4 py-3 flex items-center gap-3 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!showStickyBar}
      >
        <div className="min-w-0">
          <div className="font-serif text-[19px] leading-none text-[#2C2825]">
            ₹{effectivePrice.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-[#A09488] truncate">{size}{finish ? ` · ${finish}` : ''}</div>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock}
          tabIndex={showStickyBar ? 0 : -1}
          className="flex-1 bg-[#2C2825] text-white min-h-11 rounded-3xl font-sans text-[13px] font-medium tracking-[0.08em] uppercase cursor-pointer transition-colors hover:bg-[#8B5E3C] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>

      {/* Room visualizer modal */}
      {vizOpen && roomTypes.length > 0 && (
        <RoomVisualizerModal
          product={{
            id: Number(product.id) || 0,
            name: product.name,
            type: product.category,
            category: product.category,
            price: `₹ ${product.price.toLocaleString('en-IN')}`,
            priceValue: product.price,
            match: 100,
            thumb: product.images[0] ?? '',
            full: product.arImage || (product.images[0] ?? ''),
            iw: 90,
            ih: 110,
          }}
          roomTypes={roomTypes}
          onClose={() => setVizOpen(false)}
        />
      )}
    </div>
  )
}
