import PageBanner from '@/components/collections/PageBanner'
import Toolbar from '@/components/collections/Toolbar'
import FilterSidebar from '@/components/collections/FilterSidebar'
import InfiniteProductGrid from '@/components/collections/InfiniteProductGrid'
import CrawlablePagination from '@/components/collections/CrawlablePagination'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbSchema, itemListSchema } from '@/lib/seo/schema'
import { categoryIdOf, fetchCategories, fetchProducts, mapApiProduct } from '@/lib/api/server'
import { products as staticProducts } from '@/lib/data/products'
import { MIN_ROOM_PRODUCTS } from '@/lib/data/rooms'

const INITIAL_BATCH = 100

interface Props {
  /** Backend category name. Omitted on the unfiltered grid. */
  categoryName?: string
  /**
   * Several backend category names, for an umbrella page whose grid spans more
   * than one (/hanging-lights). Takes precedence over `categoryName`.
   */
  categoryNames?: string[]
  /** Comma-joined backend `materials` values, on material facet pages. */
  materials?: string
  /** Comma-joined backend `bodyColors` values, on finish facet pages. */
  bodyColors?: string
  /** Backend `whereUsed` room tag, e.g. 'Dining Room'. */
  whereUsed?: string
  heading: string
  subtitle: string
  page: number
  minPrice?: string
  maxPrice?: string
  /**
   * Price ceiling implied by the slug on a band sub-page (/pendant-lights/under-10000).
   * Filters the grid but never enters a URL — the path already says it, and
   * repeating it as ?maxPrice= gave every paginated page a parameterised twin.
   */
  priceCeiling?: string
  /** Path the pagination links hang off. */
  basePath: string
  /** Canonical path for the ItemList. */
  listPath: string
  breadcrumb: { name: string; path: string }[]
  /** Bottom-of-page copy: category prose, FAQs, internal links. */
  children?: React.ReactNode
}

/**
 * The product grid, shared by `/collections` and the flat category landing
 * pages. Both surfaces fetch and render identically; only the copy wrapped
 * around them differs.
 */
export default async function CollectionView({
  categoryName,
  categoryNames,
  materials,
  bodyColors,
  whereUsed,
  heading,
  subtitle,
  page,
  minPrice: minPriceStr,
  maxPrice: maxPriceStr,
  priceCeiling,
  basePath,
  listPath,
  breadcrumb,
  children,
}: Props) {
  const minPrice = minPriceStr ? Number(minPriceStr) : undefined
  const maxPriceRaw = maxPriceStr ?? priceCeiling
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined

  const categories = await fetchCategories()

  const selectedCategory = categoryName
    ? categories.find(c => c.name === categoryName)
    : undefined

  // Umbrella page: resolve every name it spans. Unknown names drop out rather
  // than widening the grid to the whole catalogue.
  const selectedCategoryIds = (categoryNames ?? [])
    .flatMap(name => {
      const match = categories.find(c => c.name === name)
      return match ? [match.id] : []
    })

  const query = {
    page,
    limit: INITIAL_BATCH,
    // categoryIds wins where it is populated; sending both would AND a single
    // category against a set that contains it and narrow the grid by accident.
    categoryId: selectedCategoryIds.length > 0 ? undefined : selectedCategory?.id,
    categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
    materials,
    bodyColors,
    minPrice,
    maxPrice,
  }

  let result = await fetchProducts({ ...query, whereUsed })
  // Room tag too sparse to fill a page — widen to the category. The copy on a
  // room page never claims a curated subset, so the wider grid stays honest.
  const roomTagUsed = !whereUsed || result.total >= MIN_ROOM_PRODUCTS
  if (!roomTagUsed) result = await fetchProducts(query)

  const { products: apiProducts, total, totalPages } = result

  // The filters the grid must repeat on every load-more request. It used to
  // read these with useSearchParams, which suspended and made the Suspense
  // fallback render a second full copy of the grid into the HTML. These must
  // mirror the query that actually ran, or page 2 would contradict page 1.
  const gridParams = new URLSearchParams()
  // The backend matches `category` on id, not name. This used to send the name,
  // so every load-more on a filtered listing came back empty and the grid
  // stopped dead at the first 100 products.
  if (selectedCategoryIds.length > 0) {
    for (const id of selectedCategoryIds) gridParams.append('category', String(id))
  } else if (selectedCategory) {
    gridParams.set('category', String(selectedCategory.id))
  }
  if (materials) gridParams.set('materials', materials)
  if (bodyColors) gridParams.set('bodyColors', bodyColors)
  if (whereUsed && roomTagUsed) gridParams.set('whereUsed', whereUsed)
  if (minPrice !== undefined && Number.isFinite(minPrice)) gridParams.set('minPrice', String(minPrice))
  if (maxPrice !== undefined && Number.isFinite(maxPrice)) gridParams.set('maxPrice', String(maxPrice))
  if (page > 1) gridParams.set('page', String(page))
  const gridQuery = gridParams.toString()

  const categoryMap = new Map(categories.map(c => [c.id, c.name]))
  const usingApi = apiProducts.length > 0 || categories.length > 0

  const products = apiProducts.length > 0
    ? apiProducts.map(p => mapApiProduct(p, categoryMap.get(categoryIdOf(p))))
    : staticProducts

  return (
    <>
      <JsonLd data={breadcrumbSchema(breadcrumb)} />
      {products.length > 0 && <JsonLd data={itemListSchema(products, listPath)} />}
      <PageBanner
        title={heading}
        subtitle={subtitle}
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
        basePath={basePath}
        params={{ category: basePath === '/collections' ? categoryName : undefined, minPrice: minPriceStr, maxPrice: maxPriceStr }}
      />
      {children}
    </>
  )
}
