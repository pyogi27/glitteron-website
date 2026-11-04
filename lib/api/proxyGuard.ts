/**
 * Shared by the /api route handlers that proxy the cart, payments and guest calls to
 * the backend. Pure (plain Headers in, plain values out) so it tests without Next.
 */

/**
 * Browsers send Origin on every POST/PATCH/DELETE. One from another site must not
 * drive a shopper's session (the guest cookie is SameSite=Strict too; this is the
 * second lock). No Origin means not a browser, and that can't carry a shopper's cookie.
 * Compared with Host, which next.config.ts already trusts for its redirects.
 */
export function isCrossSite(method: string, headers: Headers): boolean {
  if (method === 'GET' || method === 'HEAD') return false
  const origin = headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).host !== headers.get('host')
  } catch {
    return true // "null" and other opaque origins
  }
}

/**
 * The shopper's IP as the hosting edge recorded it: the LAST x-forwarded-for hop.
 * Earlier hops can be typed by the client, so trusting the first lets anyone dodge
 * the backend's per-IP limits.
 */
export function clientIpFrom(headers: Headers): string | null {
  const hops = (headers.get('x-forwarded-for') ?? '').split(',').map(h => h.trim()).filter(Boolean)
  return hops.at(-1) ?? headers.get('x-real-ip')
}

/** Headers for the backend call: auth, cookie, and the shopper's IP vouched for by the shared secret. */
export function backendHeaders(headers: Headers, secret = process.env.PROXY_SHARED_SECRET): Record<string, string> {
  const out: Record<string, string> = { 'Content-Type': 'application/json' }
  const authorization = headers.get('authorization')
  if (authorization) out.authorization = authorization
  const cookie = headers.get('cookie')
  if (cookie) out.cookie = cookie
  const ip = clientIpFrom(headers)
  if (ip && secret) {
    out['x-client-ip'] = ip
    out['x-proxy-secret'] = secret
  }
  return out
}

let edgeHeadersLogged = false

/**
 * AWS doesn't document which headers App Runner adds. Logs their names (never values)
 * and the x-forwarded-for hop count once per process, to confirm clientIpFrom picks
 * the shopper and not an internal hop before guest checkout is switched on.
 * ponytail: delete once confirmed in the App Runner logs.
 */
export function logEdgeHeadersOnce(headers: Headers): void {
  if (edgeHeadersLogged) return
  edgeHeadersLogged = true
  const hops = (headers.get('x-forwarded-for') ?? '').split(',').filter(h => h.trim()).length
  console.info('[api-proxy] request header names', { names: [...headers.keys()].sort(), forwardedForHops: hops })
}
