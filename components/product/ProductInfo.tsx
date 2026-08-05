// components/product/ProductInfo.tsx
'use client'
import { useState, useEffect } from 'react'
import { Product } from '@/lib/types'
import StarRating from '@/components/ui/StarRating'
import VariantSelector from './VariantSelector'
import QuantityControl from './QuantityControl'
import ProductTabs from './ProductTabs'
import { useCartStore } from '@/lib/stores/cartStore'
import { useWishlistStore } from '@/lib/stores/wishlistStore'
import {
  resolveVariation,
  sizeOptions,
  finishOptions,
  unavailableFinishes,
  unlabelledVariations,
} from '@/lib/variations'
import { parseWhereUsed } from '@/lib/data/visualizer'
import RoomVisualizerModal from './RoomVisualizerModal'

const PERKS = [
  { icon: '🚚', label: 'Free Delivery', sub: 'Above ₹15,000' },
  { icon: '🛡️', label: '5yr Warranty', sub: 'On all products' },
  { icon: '🔧', label: 'Expert Install', sub: 'Available on request' },
]

export default function ProductInfo({ product }: { product: Product }) {
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

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

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
   * Finish is presented ONCE, as either swatches or text — never both.
   *
   * `crystalTones` was measured to be a strict subset of `finishes`, never carrying a
   * value the finish list lacks, so rendering both showed the shopper the same choice
   * twice. Swatches win where they cover every offered finish: on a lighting product,
   * seeing the finish beats reading its name. Where a finish has no swatch (composite
   * names like "Frosted + Gloden" have no hex), fall back to the text selector so no
   * option becomes unreachable.
   */
  const swatches = (product.variants.crystalTones ?? []).filter(ct =>
    finishes.includes(ct.name),
  )
  const swatchesCoverAllFinishes =
    swatches.length > 0 && finishes.every(f => swatches.some(s => s.name === f))
  const showSwatches = swatchesCoverAllFinishes
  const showFinishText = !swatchesCoverAllFinishes && finishes.length > 0

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
  const selectSize = (value: string) => {
    setSize(value)
    setPickedVariationId(undefined)
    // If the current finish is not available for the new size, move to one that is.
    const available = finishOptions(product.variations, value)
    if (available.length && !available.includes(finish)) setFinish(available[0])
  }
  const selectFinish = (value: string) => {
    if (finishesUnavailable.includes(value)) return
    setFinish(value)
    setPickedVariationId(undefined)
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
      image: product.images[0],
      quantity: qty,
      size,
      finish,
      apiProductId: product.apiProductId,
      productVariationId: selectedVariation?.id,
    })
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
    <div className="p-5 lg:p-[40px_48px_48px_40px] overflow-y-auto h-auto lg:h-[calc(100vh-var(--spacing-header))] bg-white">
      {/* Category */}
      <div className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#C4714A] mb-3">{product.category}</div>

      {/* Title */}
      <h1 className="font-serif text-[clamp(28px,3vw,40px)] font-light leading-[1.2] text-[#2C2825] mb-2">
        {product.name}
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

      {/* Rating */}
      <div className="flex items-center gap-2 mb-5">
        <StarRating rating={product.rating} size={14} />
        <span className="text-[12px] text-[#A09488]">({product.reviewCount} reviews)</span>
      </div>

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
      {showFinishText && (
        <VariantSelector
          label="Finish"
          value={finish}
          options={finishes}
          disabledOptions={finishesUnavailable}
          onChange={selectFinish}
        />
      )}

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
          }}
        />
      )}

      {/* Finish, as swatches — the primary presentation when every offered finish has one.
          Measured 2026-08-04: `crystalTones` is a strict SUBSET of `finishes` and never
          carries a value the finish list lacks, and all 84 real `variation.color` values
          appear in the finish list. So this was never a separate variant axis. It used to
          render alongside the text selector as a second control for the same attribute,
          with state nothing read — never sent to the cart, never affecting price. Now it
          IS the finish control, and the text selector only appears when some finish has no
          swatch. Swatches unavailable for the chosen size disable rather than resolving to
          no row and silently falling back to the parent price. */}
      {showSwatches && (
        <div className="mb-5">
          <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#2C2825] mb-3">
            Finish
            <span className="text-[#A09488] font-light tracking-[0.04em] normal-case ml-1.5">— {finish}</span>
          </div>
          <div className="flex gap-2.5">
            {swatches.map(ct => {
              const selectable = finishes.includes(ct.name) && !finishesUnavailable.includes(ct.name)
              return (
                <button
                  key={ct.name}
                  type="button"
                  title={selectable ? ct.name : `${ct.name} — not available`}
                  aria-label={ct.name}
                  aria-pressed={finish === ct.name}
                  disabled={!selectable}
                  onClick={() => selectFinish(ct.name)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    finish === ct.name
                      ? 'border-[#C4714A] scale-110'
                      : 'border-[#D8D0C4] hover:border-[#C4714A]'
                  } disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#D8D0C4]`}
                  style={{ backgroundColor: ct.hex }}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Quantity + Actions */}
      <div className="flex items-center gap-3 mb-4">
        <QuantityControl value={qty} max={maxQty} onChange={setQty} />
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock}
          className="flex-1 bg-[#2C2825] text-white border-none py-3 rounded-3xl font-sans text-[13px] font-medium tracking-[0.08em] uppercase transition-all hover:bg-[#8B5E3C] hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#2C2825] disabled:hover:translate-y-0"
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
        onClick={handleAddToCart}
        disabled={!inStock}
        className="w-full bg-[#C4714A] text-[#2C2825] border-none py-3 rounded-3xl font-sans text-[13px] font-semibold tracking-[0.08em] uppercase transition-all hover:bg-[#E8A87C] hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#C4714A] disabled:hover:translate-y-0"
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

      {/* Perks */}
      <div className="flex gap-4 py-5 border-y border-[#D8D0C4] mb-7">
        {PERKS.map(p => (
          <div key={p.label} className="flex items-center gap-2.5 flex-1">
            <span className="text-[20px]">{p.icon}</span>
            <div>
              <div className="text-[11px] font-semibold text-[#2C2825]">{p.label}</div>
              <div className="text-[10px] text-[#A09488]">{p.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <ProductTabs product={product} />

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
