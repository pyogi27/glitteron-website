import type { Metadata } from 'next'
import PageBanner from '@/components/collections/PageBanner'
import Toolbar from '@/components/collections/Toolbar'
import FilterSidebar from '@/components/collections/FilterSidebar'
import InfiniteProductGrid from '@/components/collections/InfiniteProductGrid'
import CrawlablePagination from '@/components/collections/CrawlablePagination'
import { fetchCategories, fetchProducts, mapApiProduct } from '@/lib/api/server'
import { products as staticProducts } from '@/lib/data/products'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbSchema, itemListSchema } from '@/lib/seo/schema'

const INITIAL_BATCH = 100

interface Props {
  searchParams: Promise<{
    category?: string
    minPrice?: string
    maxPrice?: string
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

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { category, minPrice, maxPrice, page: pageParam } = await searchParams
  const page = parsePage(pageParam)

  // A category view is a real landing page and canonicalises to itself. Price
  // filters only slice an existing set, so they fold back to the category.
  // Each page of results is its own canonical — folding page 2+ into page 1
  // would tell Google those products do not exist.
  const canonicalParams = new URLSearchParams()
  if (category) canonicalParams.set('category', category)
  if (page > 1) canonicalParams.set('page', String(page))
  const canonicalQuery = canonicalParams.toString()
  const canonical = canonicalQuery ? `/collections?${canonicalQuery}` : '/collections'

  const pageSuffix = page > 1 ? ` — Page ${page}` : ''
  const title = category
    ? `${category} — Handcrafted Designs${pageSuffix}`
    : `All Chandeliers & Pendant Lights — 500+ Designs${pageSuffix}`

  const description = category
    ? `Shop handcrafted ${category.toLowerCase()} from LitMeUp. Free shipping across India, 5-year warranty and easy returns.`
    : 'Browse 500+ handcrafted chandeliers, pendants, ceiling and wall lights. Filter by style, room and price. Free shipping across India.'

  return {
    title,
    description,
    alternates: { canonical },
    // Price-filtered slices add no unique value to the index.
    ...(minPrice || maxPrice ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, url: canonical, type: 'website' },
  }
}

export default async function CollectionsPage({ searchParams }: Props) {
  const {
    category: categoryParam,
    minPrice: minPriceStr,
    maxPrice: maxPriceStr,
    page: pageParam,
  } = await searchParams
  // Honour ?page= so the crawlable pagination links resolve to real, distinct
  // result sets. Previously this was hardcoded to 1, so every ?page=N returned
  // page 1 — duplicate content behind different URLs.
  const page = parsePage(pageParam)
  const limit = INITIAL_BATCH
  const minPrice = minPriceStr ? Number(minPriceStr) : undefined
  const maxPrice = maxPriceStr ? Number(maxPriceStr) : undefined

  // The filters the grid must repeat on every load-more request. It used to
  // read these with useSearchParams, which suspended and made the Suspense
  // fallback render a second full copy of the grid into the HTML.
  const gridParams = new URLSearchParams()
  if (categoryParam) gridParams.set('category', categoryParam)
  if (minPrice !== undefined && Number.isFinite(minPrice)) gridParams.set('minPrice', String(minPrice))
  if (maxPrice !== undefined && Number.isFinite(maxPrice)) gridParams.set('maxPrice', String(maxPrice))
  if (page > 1) gridParams.set('page', String(page))
  const gridQuery = gridParams.toString()

  const categories = await fetchCategories()

  const selectedCategory = categoryParam
    ? categories.find(c => c.name === categoryParam)
    : undefined

  const { products: apiProducts, total, totalPages } = await fetchProducts({
    page,
    limit,
    categoryId: selectedCategory?.id,
    minPrice,
    maxPrice,
  })

  const categoryMap = new Map(categories.map(c => [c.id, c.name]))
  const usingApi = apiProducts.length > 0 || categories.length > 0

  const products = apiProducts.length > 0
    ? apiProducts.map(p => mapApiProduct(p, categoryMap.get(p.categoryId)))
    : staticProducts

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(
          categoryParam
            ? [
                { name: 'Home', path: '/' },
                { name: 'Collections', path: '/collections' },
                { name: categoryParam, path: `/collections?category=${encodeURIComponent(categoryParam)}` },
              ]
            : [
                { name: 'Home', path: '/' },
                { name: 'Collections', path: '/collections' },
              ],
        )}
      />
      {products.length > 0 && <JsonLd data={itemListSchema(products, '/collections')} />}
      <PageBanner
        // The h1 must track the filtered view, not always read "All Collections".
        title={categoryParam ?? 'All Collections'}
        subtitle={
          categoryParam
            ? `Handcrafted ${categoryParam.toLowerCase()} for spaces that deserve to glow.`
            : '500+ handcrafted chandeliers & pendant lights for spaces that deserve to glow.'
        }
        stats={[
          { num: '500+', label: 'Designs' },
          { num: '12K+', label: 'Customers' },
          { num: '5yr', label: 'Warranty' },
        ]}
      />
      <Toolbar categories={categories} total={total} />
      <div className="flex items-start min-h-screen bg-[#EDE8E0]">
        {/* ponytail: sticky lives on the flex child, not the <aside>. A wrapper sized
            to its own content gives sticky no travel room, so it scrolls away. */}
        {/* ponytail: relative z-10 — .cards-track is an isolated stacking context
            painted after this sibling, so hovered cards (scale 1.04) drew over
            the sidebar. z-10 puts the filters back on top. */}
        <div className="hidden lg:block sticky top-header-ticker relative z-10">
          <FilterSidebar />
        </div>
        <InfiniteProductGrid
          initialProducts={products}
          initialPage={usingApi ? page : 1}
          totalPages={usingApi ? totalPages : 1}
          queryKey={gridQuery}
        />
      </div>
      <CrawlablePagination
        page={page}
        totalPages={usingApi ? totalPages : 1}
        basePath="/collections"
        params={{ category: categoryParam, minPrice: minPriceStr, maxPrice: maxPriceStr }}
      />
    </>
  )
}
