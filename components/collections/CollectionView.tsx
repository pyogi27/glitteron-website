import PageBanner from '@/components/collections/PageBanner'
import Toolbar from '@/components/collections/Toolbar'
import InfiniteProductGrid from '@/components/collections/InfiniteProductGrid'
import CrawlablePagination from '@/components/collections/CrawlablePagination'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbSchema, itemListSchema } from '@/lib/seo/schema'
import { categoryIdOf, fetchCategories, fetchProducts, mapApiProduct } from '@/lib/api/server'
import { products as staticProducts } from '@/lib/data/products'
import { MIN_ROOM_PRODUCTS } from '@/lib/data/rooms'
import { backendValues, COLORS, MATERIALS, type ListingFilters } from '@/lib/data/filters'

const INITIAL_BATCH = 100

interface Props {
  /** Backend category name. Omitted on the unfiltered grid. */
  categoryName?: string
  /**
   * Several backend category names, for an umbrella page whose grid spans more
   * than one (/hanging-lights). Takes precedence over `categoryName`.
   */
  categoryNames?: string[]
  /** Header search term, sent as the backend `search` (a name/SKU match). */
  search?: string
  /** Comma-joined MATERIALS slugs: a facet page's own, or the shopper's picks. */
  material?: string
  /** Comma-joined COLORS slugs. */
  color?: string
  /** Backend `whereUsed` room tag, e.g. 'Dining Room'. */
  whereUsed?: string
  heading: string
  subtitle: string
  page: number
  minPrice?: string
  maxPrice?: string
  /** Path the pagination links hang off. */
  basePath: string
  /**
   * Where the filter panel navigates. A page that reads material, color and
   * price from its own query passes its path; the rest hand off to /collections,
   * which names the category in its query.
   */
  filterPath?: string
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
  search,
  material,
  color,
  whereUsed,
  heading,
  subtitle,
  page,
  minPrice: minPriceStr,
  maxPrice: maxPriceStr,
  basePath,
  filterPath = '/collections',
  listPath,
  breadcrumb,
  children,
}: Props) {
  const minPrice = minPriceStr ? Number(minPriceStr) : undefined
  const maxPrice = maxPriceStr ? Number(maxPriceStr) : undefined
  const materials = backendValues(MATERIALS, material)
  const bodyColors = backendValues(COLORS, color)

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
    search,
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
  if (search) gridParams.set('search', search)
  if (materials) gridParams.set('materials', materials)
  if (bodyColors) gridParams.set('bodyColors', bodyColors)
  if (whereUsed && roomTagUsed) gridParams.set('whereUsed', whereUsed)
  if (minPrice !== undefined && Number.isFinite(minPrice)) gridParams.set('minPrice', String(minPrice))
  if (maxPrice !== undefined && Number.isFinite(maxPrice)) gridParams.set('maxPrice', String(maxPrice))
  if (page > 1) gridParams.set('page', String(page))
  const gridQuery = gridParams.toString()

  const categoryMap = new Map(categories.map(c => [c.id, c.name]))
  const usingApi = apiProducts.length > 0 || categories.length > 0

  // The static catalogue stands in only when the backend is unreachable. An
  // empty result from a reachable backend (a search or filter with no match)
  // must show as empty, not as a grid of unrelated demo products.
  const products = usingApi
    ? apiProducts.map(p => mapApiProduct(p, categoryMap.get(categoryIdOf(p))))
    : staticProducts

  // What this page shows, in the query terms of `filterPath`. The filter panel
  // starts from it and every change lands on `filterPath`. A room tag has no
  // query equivalent there and drops out.
  const filters: ListingFilters = {
    // Only /collections names the category in its query; elsewhere the path
    // does, including /hanging-lights, whose two categories one param cannot.
    category: filterPath === '/collections' ? categoryName : undefined,
    q: filterPath === '/collections' ? search : undefined,
    material,
    color,
    minPrice: minPriceStr,
    maxPrice: maxPriceStr,
  }

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
      {/* The filter panel lives in the toolbar now, overlaying the grid on demand. */}
      <Toolbar categories={categories} total={total} filters={filters} filterPath={filterPath} />
      <div className="min-h-screen bg-[#EDE8E0]">
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
        params={{
          // Filters ride in the query only where the page reads them from there;
          // on a facet page the path already carries them.
          ...(filterPath === basePath && { category: filters.category, q: filters.q, material, color }),
          minPrice: minPriceStr,
          maxPrice: maxPriceStr,
        }}
      />
      {children}
    </>
  )
}
