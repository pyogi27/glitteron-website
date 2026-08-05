import { NextRequest, NextResponse } from 'next/server'
import { fetchProductById } from '@/lib/api/server'
import type { Product } from '@/lib/types'

/**
 * Hydrates a list of product ids into full products.
 *
 * The wishlist lives in localStorage as bare ids, so the only way to render it is to
 * look each one up. The backend's list endpoint has no `ids` filter, so this fans out
 * to the detail endpoint and reuses the same mapper the product page uses — which is
 * why this is a route handler and not a client-side fetch: `fetchProductById` is
 * server-only.
 */
const MAX_IDS = 60

export async function GET(req: NextRequest): Promise<NextResponse> {
  const raw = new URL(req.url).searchParams.get('ids') ?? ''
  const requested = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_IDS)

  if (requested.length === 0) {
    return NextResponse.json({ success: true, data: [], missing: [] })
  }

  // Entries like "p3" come from the pre-API static catalog and can never resolve.
  // They are reported as missing rather than dropped, so the page can offer to
  // remove them instead of quietly shrinking the shopper's list.
  const numeric = requested.filter((id) => /^\d+$/.test(id))

  const settled = await Promise.all(
    numeric.map((id) => fetchProductById(Number(id)).catch(() => null)),
  )
  const found = settled.filter((p): p is Product => p !== null)

  // ponytail: `fetchProductById` returns null for a 404 and for a dead backend alike.
  // Treating an all-failed batch as an outage means a wishlist holding exactly one
  // genuinely-deleted product shows the error state instead of "unavailable" — the
  // harmless direction to be wrong in. The alternative claims products were deleted
  // every time the API blips.
  if (numeric.length > 0 && found.length === 0) {
    return NextResponse.json(
      { success: false, message: 'Could not load your saved items' },
      { status: 502 },
    )
  }

  const foundIds = new Set(found.map((p) => p.id))
  const missing = requested.filter((id) => !foundIds.has(id))

  return NextResponse.json({ success: true, data: found, missing })
}
