import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'

/**
 * Only paths that must never be *fetched*.
 *
 * The account and transactional pages (`/cart`, `/login`, `/checkout`,
 * `/profile`, `/orders`, `/signup`, `/reset-password`, `/forgot-password`) used
 * to be listed here too, and that was the wrong tool: they each already send
 * `<meta name="robots" content="noindex">`, and a crawler that is disallowed
 * can never read it. The header links to `/login`, `/signup` and `/profile`, so
 * Google discovered them anyway and filed them under "Blocked by robots.txt"
 * (GSC, 3 URLs) — a URL in that state can still be indexed from anchor text
 * alone. Left crawlable, the noindex is read and the exclusion is definite.
 *
 * `/api/` has no HTML to carry a meta tag, and the visualizer share pages are
 * unbounded user-generated URLs that hit the API on every render — those two
 * genuinely want crawl control, not an indexing directive.
 */
const NO_CRAWL_PATHS = ['/api/', '/room-visualizer/share/']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: NO_CRAWL_PATHS }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  }
}
