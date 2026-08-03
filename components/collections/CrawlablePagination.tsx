import Link from 'next/link'

interface Props {
  /** 1-based current page. */
  page: number
  totalPages: number
  /** Path the links point at, e.g. '/collections' or '/rooms/living-room'. */
  basePath: string
  /** Query params to preserve on every page link (category, price filters…). */
  params?: Record<string, string | undefined>
}

function hrefFor(basePath: string, page: number, params?: Props['params']): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) qs.set(key, value)
  }
  // Page 1 is the canonical, param-free URL.
  if (page > 1) qs.set('page', String(page))
  const query = qs.toString()
  return query ? `${basePath}?${query}` : basePath
}

/**
 * Real <a href> links to every page of the listing.
 *
 * The grid itself loads more products via IntersectionObserver, which a crawler
 * never triggers — so without these links everything past the first batch is
 * undiscoverable. Visually hidden because the infinite scroll is the intended
 * human experience; `sr-only` keeps them in the DOM, focusable, and crawlable
 * rather than hiding them with display:none (which Google discounts).
 */
export default function CrawlablePagination({ page, totalPages, basePath, params }: Props) {
  if (totalPages <= 1) return null

  return (
    <nav className="sr-only" aria-label="Pagination">
      <ul>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
          <li key={n}>
            <Link
              href={hrefFor(basePath, n, params)}
              {...(n === page ? { 'aria-current': 'page' as const } : {})}
            >
              Page {n}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
