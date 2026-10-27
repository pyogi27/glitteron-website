import { mapPlaceReviews, type GoogleReviews } from "@/lib/googleReviews";

// Server-only: the key is read here and sent as a header, never handed to a client
// component. Both vars are unprefixed so Next will not inline them into the bundle.
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACE_ID = process.env.GOOGLE_PLACE_ID;

const FIELD_MASK = "rating,userRatingCount,reviews,googleMapsUri,googleMapsLinks.reviewsUri";
const TIMEOUT_MS = 5000;
// ponytail: an hour, the same window as the product pages. Places terms only let place
// IDs be cached, so this is an accepted deviation (chosen 2026-10-22); drop to
// `cache: "no-store"` if it has to be strictly compliant.
const REVALIDATE_SECONDS = 3600;

let warnedMissingEnv = false;

/**
 * Rating, count and up to 5 reviews for the store's Google Business Profile, or null
 * on any failure: the banner then renders nothing. Identical requests share one
 * Next data-cache entry, so the home and product pages reuse the same response.
 */
export async function fetchGoogleReviews(): Promise<GoogleReviews | null> {
  if (!API_KEY || !PLACE_ID) {
    // Once per process, or a build without the vars logs this for every product page.
    if (!warnedMissingEnv) console.error("[fetchGoogleReviews] GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID is not set");
    warnedMissingEnv = true;
    return null;
  }

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(PLACE_ID)}?languageCode=en`;
  try {
    const res = await fetch(url, {
      headers: { "X-Goog-Api-Key": API_KEY, "X-Goog-FieldMask": FIELD_MASK },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      // The status is enough; the error body can echo request details.
      console.error(`[fetchGoogleReviews] ${res.status} from Places API`);
      return null;
    }
    const reviews = mapPlaceReviews(await res.json());
    if (!reviews) console.error("[fetchGoogleReviews] no rating or no reviews with text");
    return reviews;
  } catch (err) {
    console.error("[fetchGoogleReviews] request failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
