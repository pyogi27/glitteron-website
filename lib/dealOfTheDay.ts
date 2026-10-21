// lib/dealOfTheDay.ts
//
// Pure helpers for the homepage Deal of the Day (components/home/DealOfTheDay.tsx).
// Tested by lib/dealOfTheDay.test.mjs.

const DAY_MS = 86_400_000
/** Asia/Kolkata is UTC+05:30 all year — no DST, so a fixed offset is exact. */
const IST_OFFSET_MS = 5.5 * 3_600_000
/** The deal resets daily at 23:59:59 IST. */
const DEAL_END_MS_INTO_DAY = DAY_MS - 1000

/** Most deals the carousel shows, and the fewest before featured products fill in. */
export const DEAL_MAX = 12
export const DEAL_MIN = 5

/**
 * Milliseconds until today's deal ends at 23:59:59 IST. Exactly 0 at the deadline;
 * past it, counts to tomorrow's. Always in [0, DAY_MS).
 *
 * ponytail: no backend end time exists, so every deal "resets" daily. If the backend
 * ever sends one, count to that instead.
 */
export function dealTimeLeft(nowMs: number): number {
  const msIntoDay = (((nowMs + IST_OFFSET_MS) % DAY_MS) + DAY_MS) % DAY_MS
  const left = DEAL_END_MS_INTO_DAY - msIntoDay
  return left < 0 ? left + DAY_MS : left
}

/**
 * ["HH", "MM", "SS"]. Floors, so the largest value is 23:59:59 and the last second
 * before the deadline reads 00:00:00.
 */
export function splitCountdown(ms: number): [string, string, string] {
  const total = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  return [pad(Math.floor(total / 3600)), pad(Math.floor(total / 60) % 60), pad(total % 60)]
}

interface DealCandidate {
  id: string
  slug?: string
  price: number
  /** listingPrice()'s whole-percent discount, set only when there is one. */
  discount?: number
}

/**
 * First of each product. GET /api/products repeats products within one page of
 * results, so every slice of it needs this before it is shown.
 */
export function dedupeProducts<T extends DealCandidate>(products: readonly T[]): T[] {
  const seen = new Set<string>()
  return products.filter(p => {
    const key = p.slug || p.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * The deal carousel: discounted candidates, biggest discount first (ties keep catalogue
 * order), at most DEAL_MAX. Fewer than DEAL_MIN fills from `featured` without repeats.
 * A ₹0 price is a placeholder, never a deal, so it is never picked.
 */
export function selectDealProducts<T extends DealCandidate>(candidates: readonly T[], featured: readonly T[]): T[] {
  const deals = dedupeProducts(candidates)
    .filter(p => p.price > 0 && (p.discount ?? 0) > 0)
    .sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0))
    .slice(0, DEAL_MAX)
  if (deals.length >= DEAL_MIN) return deals

  const picked = new Set(deals.map(p => p.slug || p.id))
  const fill = dedupeProducts(featured)
    .filter(p => p.price > 0 && !picked.has(p.slug || p.id))
    .slice(0, DEAL_MIN - deals.length)
  return [...deals, ...fill]
}
