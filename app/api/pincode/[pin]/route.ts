import { NextResponse } from 'next/server'
import { PINCODE_RE, placeFromIndiaPost } from '@/lib/pincode'

// India Post's free lookup: no key, ~1s, occasionally down. Fetched here rather than
// from the browser so the shopper's page never talks to a third party, and so one
// cached answer per pincode serves everyone.
const INDIA_POST = 'https://api.postalpincode.in/pincode/'
const TIMEOUT_MS = 5000
// Pincode boundaries change on the order of years.
const CACHE_SECONDS = 60 * 60 * 24 * 30

type RouteContext = { params: Promise<{ pin: string }> }

/** GET /api/pincode/395007 → { city, state }; 404 unknown, 400 malformed, 502 lookup down. */
export async function GET(_req: Request, ctx: RouteContext) {
  const { pin } = await ctx.params
  if (!PINCODE_RE.test(pin)) {
    return NextResponse.json({ success: false, message: 'Invalid pincode' }, { status: 400 })
  }

  let body: unknown
  try {
    const res = await fetch(INDIA_POST + pin, {
      next: { revalidate: CACHE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) throw new Error(`India Post ${res.status}`)
    body = await res.json()
  } catch (err) {
    console.error('[pincode] lookup failed', pin, err instanceof Error ? err.message : err)
    return NextResponse.json({ success: false, message: 'Lookup unavailable' }, { status: 502 })
  }

  const place = placeFromIndiaPost(body)
  if (!place) {
    return NextResponse.json({ success: false, message: 'Pincode not found' }, { status: 404 })
  }
  return NextResponse.json(
    { success: true, ...place },
    { headers: { 'Cache-Control': `public, max-age=86400, s-maxage=${CACHE_SECONDS}` } },
  )
}
