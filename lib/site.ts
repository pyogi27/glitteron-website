const PRODUCTION_URL = 'https://www.litmeup.in'

const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
const isLocal = !configured || /^https?:\/\/(localhost|127\.0\.0\.1)/.test(configured)

/**
 * Canonical origin. Single source for metadataBase, sitemap and canonicals.
 *
 * NEXT_PUBLIC_SITE_URL is localhost in dev, which is correct there but would
 * poison the sitemap and every canonical tag if it ever leaked into a
 * production build — so production always falls back to the real domain.
 */
export const SITE_URL =
  process.env.NODE_ENV === 'production' && isLocal ? PRODUCTION_URL : configured ?? PRODUCTION_URL

export const SITE_NAME = 'LitMeUp'

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
