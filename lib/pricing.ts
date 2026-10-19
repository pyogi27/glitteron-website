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
