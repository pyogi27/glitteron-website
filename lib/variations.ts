import type { ProductVariation } from '@/lib/types'
import type { ApiVariation } from '@/lib/api/types'

/**
 * Variation resolution — turning the shopper's dropdown picks into the id that
 * checkout will price against.
 *
 *   selectors (display strings)          variation rows (authoritative)
 *   ---------------------------          ------------------------------
 *   size:   "400mm"   ─────────┐
 *   finish: "Grey"    ─────────┼──▶ resolveVariation() ──▶ { id: 317, price: 5700 }
 *                              │                                    │
 *   no match ──────────────────┘                                    ▼
 *        ▼                                    cart line carries productVariationId 317,
 *   null ──▶ no id sent ──▶ backend           reconciled by lib/api/cartSync.ts
 *            prices from product.price
 *
 * Why this exists: both cart sync sites used to hardcode `null` for the variation id,
 * so AddToCart/CreateCheckout took the product branch and charged `product.price`.
 * 58% of variation products have a diverging variation price (measured 2026-08-04);
 * the worst case undercharged by 113,400 per unit.
 */

/**
 * Selector options derived from the real variation rows.
 *
 * Why not use the API's `availableSizes` / `availableColors` / `bodyColors` summaries:
 * they are denormalised and lossy. Measured across all 60 products with variations
 * (2026-08-04):
 *
 *   - 8 of 125 variation rows (6.4%) were unreachable by ANY combination of summary
 *     options, because their `size` and `color` are blank and the distinction lives
 *     only in `name`/`sku` (e.g. product 1494: D39073-M at 15,500 and D39073-L at
 *     17,800, both with empty `size`, and `availableSizes` is []).
 *   - `bodyColors` is a decorative comma string. Splitting "Frosted + Gloden" yielded
 *     phantom options "Frosted" and "Golden" that match no row and silently fell back
 *     to the parent price.
 *   - `crystalTones` was a strict subset of `finishes` and never carried a value
 *     `finishes` lacked, so it is not a real axis. All 84 real `variation.color`
 *     values appear in the finish list.
 *
 * Deriving from rows means every option maps to something purchasable, and the second
 * axis can be narrowed to what actually exists for the first pick.
 */

/** Distinct sizes across the rows, preserving row order. Empty when no row has one. */
export function sizeOptions(variations: ProductVariation[] | undefined): string[] {
  if (!variations?.length) return []
  return dedupePreserving(variations.map(v => v.size))
}

/**
 * Distinct finishes, optionally narrowed to those available for a chosen size.
 * Narrowing is what prevents phantom pairs: product 1466 has 3 real sizes x 4 colours
 * but a naive cross-product offered 16 combinations for 12 rows.
 */
export function finishOptions(
  variations: ProductVariation[] | undefined,
  forSize?: string,
): string[] {
  if (!variations?.length) return []
  const all = dedupePreserving(variations.map(v => v.color))
  const scoped = forSize
    ? variations.filter(v => normalise(v.size) === normalise(forSize))
    : []
  // Fall back to the full set when the size filter matches nothing, so the selector
  // never renders empty mid-interaction.
  if (!scoped.length) return all
  // Return the full list's spelling, not the scoped rows': product 1645 spells it
  // "Yellow " on the 300mm row and "Yellow" on the 400mm one, and callers compare these
  // strings raw — the mismatch struck Yellow through as "not available in 400".
  const keys = new Set(scoped.map(v => normalise(v.color)))
  return all.filter(f => keys.has(normalise(f)))
}

/**
 * Finishes that exist in the catalogue but not for the currently chosen size. These are
 * rendered struck-through rather than hidden, so the shopper can see the combination is
 * unavailable instead of watching options silently appear and disappear.
 */
export function unavailableFinishes(
  variations: ProductVariation[] | undefined,
  forSize: string,
): string[] {
  if (!variations?.length || !forSize) return []
  const all = finishOptions(variations)
  const available = new Set(finishOptions(variations, forSize))
  return all.filter(f => !available.has(f))
}

/**
 * Rows no size/finish pair can reach, because both axes are blank. Their identity lives
 * in `name`, so they are offered as name-labelled options instead of being unbuyable.
 * 8 such rows across 5 products as of 2026-08-04 (worst: product 1337 at 18,300/unit).
 */
export function unlabelledVariations(
  variations: ProductVariation[] | undefined,
): ProductVariation[] {
  if (!variations?.length) return []
  return variations.filter(v => !normalise(v.size) && !normalise(v.color))
}

/**
 * Pick from an ambiguous set: prefer in-stock, then cheapest. Never charge more than the
 * shopper could have paid for a selection they cannot disambiguate.
 */
function cheapestPreferInStock(rows: ProductVariation[]): ProductVariation {
  const inStock = rows.filter(v => v.inStock)
  const pool = inStock.length ? inStock : rows
  return pool.reduce((lo, v) => (v.price < lo.price ? v : lo), pool[0])
}

function dedupePreserving(values: (string | null | undefined)[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of values) {
    if (!v) continue
    const key = normalise(v)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(v)
  }
  return out
}

/** Normalise a size or colour for comparison. Handles the "300" vs "300mm" case. */
function normalise(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .toLowerCase()
    .replace(/\s+/g, '')
    // "300" and "300mm" are the same size entered inconsistently in the admin panel.
    // Verified on product 1466: variation 280 has size "300", three others have "300mm".
    .replace(/mm$/, '')
}

/**
 * Ceiling for the quantity stepper when the API gives no numeric stock but says the
 * item is in stock. Matches QuantityControl's own default.
 */
export const DEFAULT_MAX_QTY = 99

/**
 * Units available to sell: on hand minus held by pending payments, never below 0
 * (negative stock exists in this catalogue). Shared by products and variations.
 */
export function availableStock(quantity: unknown, reserved: unknown): number {
  const num = (x: unknown) => (Number.isFinite(Number(x)) ? Number(x) : 0)
  return Math.max(0, num(quantity) - num(reserved))
}

/** A variation row's available stock; trusts the boolean only when no count was sent. */
export function variationStock(v: ApiVariation): number {
  if (v.quantity != null) return availableStock(v.quantity, v.reservedQuantity)
  return v.inStock ? DEFAULT_MAX_QTY : 0
}

/** Map the API's wide variation row onto the narrow shape the storefront uses. */
export function mapVariation(v: ApiVariation): ProductVariation {
  const price = typeof v.price === 'string' ? parseFloat(v.price) : v.price
  const stock = variationStock(v)
  return {
    id: v.id,
    name: v.name ?? '',
    size: v.size ?? '',
    color: v.color ?? '',
    price: Number.isFinite(price) ? price : 0,
    stock,
    // Not the API's own `inStock`: that ignores reservations.
    inStock: stock > 0,
    images: [v.mainImage, ...(Array.isArray(v.additionalImages) ? v.additionalImages : [])]
      .filter((src): src is string => typeof src === 'string' && src.trim() !== ''),
    lightOnImage: v.lightOnImage || undefined,
  }
}

/**
 * Photo for a finish option: the photo of the exact row a click would select, so the
 * chip never promises a picture the gallery then fails to show. A matching row with no
 * photos yields undefined (the chip falls back to its colour dot or name), exactly as
 * the gallery falls back to the product photos.
 */
export function finishImage(
  variations: ProductVariation[] | undefined,
  finish: string,
  forSize: string,
): string | undefined {
  const row = resolveVariation(variations, forSize, finish)
  if (row) return row.images?.[0]
  // Not offered in this size, so the chip is disabled and cannot be clicked: any row of
  // that colour is a fair picture of the finish.
  return variations?.find(v => normalise(v.color) === normalise(finish) && v.images?.length)
    ?.images?.[0]
}

export function mapVariations(rows: ApiVariation[] | undefined): ProductVariation[] {
  if (!rows?.length) return []
  return rows.filter(r => r.isActive !== false).map(mapVariation)
}

/**
 * Find the variation matching the selected size and finish.
 *
 * Returns null when nothing matches — the caller must then send a null variation id
 * rather than guessing, which preserves today's behaviour instead of charging a price
 * the shopper did not pick.
 *
 * Matching is deliberately lenient on formatting (case, whitespace, a trailing "mm")
 * because the catalogue has inconsistent entries, but never lenient on identity: two
 * genuinely different sizes never collapse into one.
 */
export function resolveVariation(
  variations: ProductVariation[] | undefined,
  size: string,
  finish: string,
  /**
   * Explicit row id, used when the shopper picked a name-labelled option (a row whose
   * size and colour are both blank). Wins outright — there is nothing to match on.
   */
  variationId?: number,
): ProductVariation | null {
  if (!variations?.length) return null

  if (variationId != null) {
    return variations.find(v => v.id === variationId) ?? null
  }

  const wantSize = normalise(size)
  const wantColor = normalise(finish)

  // Exact match on both axes is the common case.
  const both = variations.filter(
    v => normalise(v.size) === wantSize && normalise(v.color) === wantColor,
  )
  if (both.length === 1) return both[0]
  if (both.length > 1) {
    // Several rows share this size/colour pair. Measured 2026-08-04: 6 such pairs across
    // the catalogue, and 5 of them price identically (same-price A/B variants), so either
    // row is correct. Prefer an in-stock one, else the cheapest, so an ambiguous pair can
    // never silently charge MORE than the shopper could have paid — product 1353 has
    // "D280 H220 / Beige" at both 12,600 and 26,400.
    const inStock = both.filter(v => v.inStock)
    const pool = inStock.length ? inStock : both
    return pool.reduce((lo, v) => (v.price < lo.price ? v : lo), pool[0])
  }

  // Single-axis products: only one of the two fields is populated on the rows.
  const anySize = variations.every(v => !normalise(v.size))
  const anyColor = variations.every(v => !normalise(v.color))

  if (anyColor && wantSize) {
    const bySize = variations.filter(v => normalise(v.size) === wantSize)
    if (bySize.length) return cheapestPreferInStock(bySize)
  }
  if (anySize && wantColor) {
    const byColor = variations.filter(v => normalise(v.color) === wantColor)
    if (byColor.length) return cheapestPreferInStock(byColor)
  }

  // A product with exactly one variation and no meaningful axes still needs its id,
  // or it would be priced from the parent — which is the bug this file exists to fix.
  if (variations.length === 1 && !wantSize && !wantColor) return variations[0]

  return null
}
