import { NextResponse, type NextRequest } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'
import { getCategoryBySlug } from '@/lib/data/categories'

/**
 * Edge cache for category HTML (/pendant-lights, /pendant-lights/under-25000).
 *
 * Category pages read ?page= and filters, so Next renders them per request and
 * sends `no-store`. This Cloudflare-only header lets the Cloudflare cache rule
 * keep each URL (query string included) for 60 s, the price/stock limit, while
 * browsers still see `no-store`. Cloudflare reads it ahead of Cache-Control and
 * does not forward it. Product pages need nothing here: as ISR pages they
 * already send `s-maxage=60`.
 */
const CATEGORY_EDGE_CACHE = 'max-age=60'

function isCategoryHtml(req: NextRequest): boolean {
  // RSC payloads share the page URL and Cloudflare ignores Vary, so only plain
  // HTML is ever marked cacheable. Next picks RSC vs HTML from the `rsc` header
  // alone (verified: `?_rsc=` without it gets HTML), so that header is the test.
  // The Cloudflare rule also skips requests carrying it or an `_rsc` param.
  if (req.method !== 'GET' || req.headers.has('rsc')) return false
  const segments = req.nextUrl.pathname.split('/').filter(Boolean)
  return segments.length >= 1 && segments.length <= 2 && Boolean(getCategoryBySlug(segments[0]))
}

// Clerk's request middleware (Next 16 names this file proxy.ts). Routes are not
// gated here: account pages redirect client-side via useRequireAuth, and the
// backend rejects API calls without a valid Clerk token. Clerk returns its own
// handshake redirects before this handler runs, so those are never marked.
export default clerkMiddleware(
  (_auth, req) => {
    if (!isCategoryHtml(req)) return
    const res = NextResponse.next()
    res.headers.set('Cloudflare-CDN-Cache-Control', CATEGORY_EDGE_CACHE)
    return res
  },
  { signInUrl: '/login', signUpUrl: '/signup' },
)

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|cur|heic|heif|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
