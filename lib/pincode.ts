/** Indian pincode: six digits, never starting with 0. */
export const PINCODE_RE = /^[1-9]\d{5}$/

export interface PincodePlace {
  city: string
  state: string
}

interface PostOffice {
  District?: unknown
  State?: unknown
}

/**
 * City and state from an India Post lookup (api.postalpincode.in/pincode/:pin), or null.
 *
 * The reply is `[{ Status, PostOffice: [...] }]`; an unknown pincode comes back as
 * `Status: "Error"` with `PostOffice: null`. Every post office under one pincode shares a
 * district and state, so the first one with both is enough. City is the district, which
 * is what shoppers write (Surat, not "Athwa"); they can still edit it.
 */
export function placeFromIndiaPost(body: unknown): PincodePlace | null {
  const first = Array.isArray(body) ? body[0] : undefined
  if (!first || first.Status !== 'Success' || !Array.isArray(first.PostOffice)) return null
  for (const po of first.PostOffice as PostOffice[]) {
    const city = typeof po?.District === 'string' ? po.District.trim() : ''
    const state = typeof po?.State === 'string' ? po.State.trim() : ''
    if (city && state) return { city, state }
  }
  return null
}
