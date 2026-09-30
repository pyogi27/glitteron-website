import type { Metadata } from 'next'
import CollectionView from '@/components/collections/CollectionView'
import { categoryPath } from '@/lib/data/categories'
import { COLORS, MATERIALS, parseSearch, pickSlugs } from '@/lib/data/filters'

interface Props {
  searchParams: Promise<{
    category?: string
    /** Header search term, matched by the backend against name and SKU. */
    q?: string | string[]
    minPrice?: string
    maxPrice?: string
    /** Comma-joined MATERIALS slugs; a repeated key arrives as an array. */
    material?: string | string[]
    /** Comma-joined COLORS slugs. */
    color?: string | string[]
    page?: string
  }>
}

/**
 * 1-based page from the URL; anything malformed falls back to page 1.
 * Matched against plain digits so exponent forms like "1e3" (which Number()
 * happily turns into 1000) cannot request a page far past the end.
 */
const MAX_PAGE = 1000

function parsePage(raw?: string): number {
  if (!raw || !/^\d+$/.test(raw)) return 1
  const n = Number(raw)
  return n >= 1 && n <= MAX_PAGE ? n : 1
}

/**
 * The canonical for a category view is now the flat landing page —
 * `/pendant-lights`, not `/collections?category=Pendant+Lights`. The filter
 * sidebar still navigates by query string, so both URLs stay reachable; only
 * one of them is indexed, and it is the one carrying the category copy.
 *
 * Page 2+ of a category has no flat equivalent, so it canonicalises to itself.
 */
function canonicalFor(category: string | undefined, page: number): string {
  const flat = category ? categoryPath(category) : undefined
  if (flat && page === 1) return flat

  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `/collections?${query}` : '/collections'
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { category, q, minPrice, maxPrice, material, color, page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const search = parseSearch(q)
  const canonical = canonicalFor(category, page)
  const filtered = search || minPrice || maxPrice || pickSlugs(MATERIALS, material) || pickSlugs(COLORS, color)

  const pageSuffix = page > 1 ? ` — Page ${page}` : ''
  const title = search
    ? `Search results for “${search}”${pageSuffix}`
    : category
    ? `Buy ${category} Online in India${pageSuffix}`
    : `Buy Lights Online in India — 500+ Handcrafted Designs${pageSuffix}`

  const description = category
    ? `Shop handcrafted ${category.toLowerCase()} from LitMeUp. Free shipping across India, 5-year warranty and easy returns.`
    : 'Browse 500+ handcrafted chandeliers, pendants, ceiling and wall lights. Filter by style, room and price. Free shipping across India.'

  return {
    title,
    description,
    alternates: { canonical },
    // Filtered slices and search results add no unique value to the index.
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url: canonical, type: 'website' },
  }
}

export default async function CollectionsPage({ searchParams }: Props) {
  const { category, q, minPrice, maxPrice, material, color, page: pageParam } = await searchParams
  const search = parseSearch(q)
  // Honour ?page= so the crawlable pagination links resolve to real, distinct
  // result sets. Previously this was hardcoded to 1, so every ?page=N returned
  // page 1 — duplicate content behind different URLs.
  const page = parsePage(pageParam)

  const breadcrumb = category
    ? [
        { name: 'Home', path: '/' },
        { name: 'Collections', path: '/collections' },
        { name: category, path: categoryPath(category) ?? `/collections?category=${encodeURIComponent(category)}` },
      ]
    : [
        { name: 'Home', path: '/' },
        { name: 'Collections', path: '/collections' },
      ]

  return (
    <CollectionView
      categoryName={category}
      search={search}
      heading={search ? `Results for “${search}”` : category ?? 'All Collections'}
      subtitle={
        search
          ? `Handcrafted ${category?.toLowerCase() ?? 'lights'} matching your search.`
          : category
          ? `Handcrafted ${category.toLowerCase()} for spaces that deserve to glow.`
          : '500+ handcrafted chandeliers & pendant lights for spaces that deserve to glow.'
      }
      page={page}
      minPrice={minPrice}
      maxPrice={maxPrice}
      material={pickSlugs(MATERIALS, material)}
      color={pickSlugs(COLORS, color)}
      basePath="/collections"
      listPath="/collections"
      breadcrumb={breadcrumb}
    />
  )
}
