// lib/promoBanners.ts
//
// Pure helpers for the homepage promo banners (components/home/PromoBanners.tsx).
// Tested by lib/promoBanners.test.mjs.

export interface PromoImageFields {
  promoImage?: string | null
  bannerImage?: string | null
  image?: string | null
}

/** The category's promo image, falling back to its listing banner, then its card image. */
export function promoImageOf(category: PromoImageFields | undefined): string | null {
  for (const src of [category?.promoImage, category?.bannerImage, category?.image]) {
    const trimmed = src?.trim()
    if (trimmed) return trimmed
  }
  return null
}

/**
 * "Up to {max}% Off" from the category's real website discounts, or `fallback` when
 * none is running. Rounds down, so the banner can never promise more than a product
 * actually gives.
 */
export function promoValueLine(discounts: ReadonlyArray<number | undefined>, fallback: string): string {
  const max = Math.max(0, ...discounts.map(d => (Number.isFinite(d) ? Math.floor(d as number) : 0)))
  return max > 0 ? `Up to ${max}% Off` : fallback
}
