// lib/pricing.ts
//
// Website discounts as the backend reports them (glitteron-prod docs/discounts/DESIGN.md
// §7). The server decides every price; these helpers only shape its numbers for display.
// Tested by lib/pricing.test.mjs.

/** Strikethrough fields the backend adds to website product rows and variations. */
export interface SaleFields {
  compareAtPrice?: number | string | null
  discountedPrice?: number | string | null
}

export interface DisplayPrice {
  /** What the shopper pays per unit (before GST). */
  price: number
  /** The list price, struck through. Only set when there is a discount. */
  originalPrice?: number
  /** Whole percent saved, for the "–20%" badge. Only set when there is a discount. */
  discount?: number
}

function toNumber(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

/**
 * The price to show for a product or variation row.
 *
 * `fallback` keeps manually authored originalPrice/discount fields working when the row
 * carries no automatic discount.
 */
export function displayPrice(listPrice: number, row: SaleFields, fallback: Partial<DisplayPrice> = {}): DisplayPrice {
  const compare = toNumber(row.compareAtPrice)
  const discounted = toNumber(row.discountedPrice)
  if (compare != null && discounted != null && compare > 0 && discounted < compare) {
    return {
      price: discounted,
      originalPrice: compare,
      discount: Math.max(1, Math.round((1 - discounted / compare) * 100)),
    }
  }
  return { price: listPrice, ...fallback }
}

interface Range {
  min?: number | string | null
  max?: number | string | null
}

/** A product row as GET /api/products and /api/products/:id send it. */
export interface ListingFields extends SaleFields {
  price?: number | string | null
  hasVariations?: boolean
  /** Min/max over the active variations (productController, Product.getPriceRange). */
  priceRange?: Range | null
  /** priceRange after website discounts (discounts/listingPrices.js). */
  discountedPriceRange?: Range | null
}

export interface ListingPrice extends DisplayPrice {
  /** Top of the variation price range, set only when variations differ, for "From ₹X". */
  maxPrice?: number
}

/**
 * The price to show for a product on a card or listing.
 *
 * A variation product keeps a placeholder parent price (usually 0; 33 of 48 on the
 * first in-stock page, measured 2026-10-20), so `price` alone rendered "₹0". The real
 * prices live on the variations and the backend summarises them as `priceRange`.
 * Mirrors glitteron-prod client/src/utils/priceRange.js.
 */
export function listingPrice(row: ListingFields, fallback: Partial<DisplayPrice> = {}): ListingPrice {
  const min = toNumber(row.priceRange?.min)
  if (!row.hasVariations || min == null || min <= 0) {
    return displayPrice(toNumber(row.price) ?? 0, row, fallback)
  }
  const saleMin = toNumber(row.discountedPriceRange?.min)
  const price = saleMin != null && saleMin > 0 && saleMin < min ? saleMin : min
  const top = toNumber(row.discountedPriceRange?.max) ?? toNumber(row.priceRange?.max)
  return {
    price,
    ...(price < min && { originalPrice: min, discount: Math.max(1, Math.round((1 - price / min) * 100)) }),
    ...(top != null && top > price && { maxPrice: top }),
  }
}

/** "₹41,800", or "From ₹41,800" when the variations span a range. */
export function formatListingPrice(p: { price: number; maxPrice?: number }): string {
  return `${p.maxPrice ? 'From ' : ''}₹${p.price.toLocaleString('en-IN')}`
}

/** The fields a local cart line and a server cart line share. */
export interface LocalLineKey {
  productId: string
  apiProductId?: number
  productVariationId?: number
}
export interface ServerLineKey {
  productId: number
  productVariationId: number | null
}

/**
 * The server cart line for a local one. Same resolution as toSyncable(): apiProductId,
 * else the numeric productId. Static-catalogue lines ("p1") have no server line.
 */
export function serverLineFor<T extends ServerLineKey>(local: LocalLineKey, serverItems: T[]): T | undefined {
  const id = local.apiProductId ?? (parseInt(local.productId, 10) || undefined)
  if (id == null) return undefined
  const variationId = local.productVariationId ?? null
  return serverItems.find(s => s.productId === id && (s.productVariationId ?? null) === variationId)
}
