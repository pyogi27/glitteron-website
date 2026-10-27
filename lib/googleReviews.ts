// lib/googleReviews.ts
//
// Pure mapping from a Places API (New) Place Details response to what the Google
// Reviews banner renders (components/reviews/GoogleReviewsBanner.tsx).
// Tested by lib/googleReviews.test.mjs.

export interface GoogleReview {
  id: string
  rating: number
  text: string
  relativeTime: string
  /** The review on Google Maps; Places policy requires each review to link to its source. */
  reviewUrl?: string
  author: string
  authorUrl?: string
  authorPhoto?: string
}

export interface GoogleReviews {
  rating: number
  count: number
  mapsUrl?: string
  reviewsUrl?: string
  /** At most 5 (the API's limit), in Google's relevance order. */
  reviews: GoogleReview[]
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Only https links reach an href or img src; anything else from the wire is dropped. */
function httpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  try {
    return new URL(value).protocol === 'https:' ? value : undefined
  } catch {
    return undefined
  }
}

function mapReview(r: any, i: number): GoogleReview | null {
  const text = String(r?.text?.text ?? r?.originalText?.text ?? '').trim()
  const author = String(r?.authorAttribution?.displayName ?? '').trim()
  if (!text || !author) return null
  return {
    id: String(r?.name ?? i),
    rating: Number(r?.rating) || 0,
    text,
    relativeTime: String(r?.relativePublishTimeDescription ?? ''),
    reviewUrl: httpsUrl(r?.googleMapsUri),
    author,
    authorUrl: httpsUrl(r?.authorAttribution?.uri),
    authorPhoto: httpsUrl(r?.authorAttribution?.photoUri),
  }
}

/**
 * The banner's data, or null when there is nothing real to show: no rating, no
 * count, or no review with text. The banner never pads with placeholders.
 */
export function mapPlaceReviews(body: any): GoogleReviews | null {
  const rating = Number(body?.rating)
  const count = Number(body?.userRatingCount)
  if (!(rating > 0) || !(count > 0)) return null

  const reviews = (Array.isArray(body?.reviews) ? body.reviews : [])
    .map(mapReview)
    .filter((r: GoogleReview | null): r is GoogleReview => r !== null)
  if (reviews.length === 0) return null

  const mapsUrl = httpsUrl(body?.googleMapsUri)
  return {
    rating,
    count,
    mapsUrl,
    reviewsUrl: httpsUrl(body?.googleMapsLinks?.reviewsUri) ?? mapsUrl,
    reviews,
  }
}

/** "1,200+" for 1,234 (rounded down to the hundred, so it never overstates); exact below 100. */
export function trustedCountLabel(count: number): string {
  if (count < 100) return String(count)
  return `${(Math.floor(count / 100) * 100).toLocaleString('en-IN')}+`
}
