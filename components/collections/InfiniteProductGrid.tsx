'use client'
import { Suspense, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Product } from '@/lib/types'
import { useFilterStore } from '@/lib/stores/filterStore'
import ProductCard from '@/components/products/ProductCard'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'

const BATCH_SIZE = 100

interface Props {
  initialProducts: Product[]
  initialPage: number
  totalPages: number
  /** Query params merged into every load-more request (e.g. { whereUsed: 'Living Room' }) */
  extraParams?: Record<string, string>
}

function dedupeById(products: Product[]): Product[] {
  const seen = new Set<string>()
  return products.filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

const PLACEHOLDER_IMAGE =
  'https://images.pexels.com/photos/1123262/pexels-photo-1123262.jpeg?auto=compress&cs=tinysrgb&w=800&h=900&fit=crop'

type RawProduct = Record<string, unknown>

/** Backend returns numbers as JSON strings (e.g. price "7800.00"); coerce safely. */
function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
  }
  return fallback
}

function mapRawProduct(p: RawProduct): Product {
  // Image sources, in priority order, matching the backend shape:
  // imageUrls[] / images[] (legacy) → thumbnailImage → mainImage → arImages
  const imageUrls = Array.isArray(p.imageUrls) ? (p.imageUrls as string[]) : []
  const images_ = Array.isArray(p.images)
    ? (p.images as Array<string | { url: string }>).map(img =>
        typeof img === 'string' ? img : (img as { url: string }).url
      ).filter(Boolean)
    : []
  const singleImages = [p.thumbnailImage, p.mainImage, p.arImages]
    .filter((u): u is string => typeof u === 'string' && u.length > 0)

  const candidates = imageUrls.length > 0 ? imageUrls
    : images_.length > 0 ? images_
    : singleImages
  const images = candidates.length > 0 ? Array.from(new Set(candidates)) : [PLACEHOLDER_IMAGE]

  const categoryName = typeof p.category === 'object' && p.category !== null
    ? ((p.category as { name?: string }).name ?? '')
    : typeof p.category === 'string' ? p.category : ''

  return {
    id: String(p.id),
    slug: typeof p.slug === 'string' ? p.slug : slugify(String(p.name ?? '')),
    apiProductId: typeof p.id === 'number' ? p.id : (Number.isFinite(Number(p.id)) ? Number(p.id) : 0),
    name: String(p.name ?? ''),
    subtitle: typeof p.description === 'string' ? p.description : '',
    category: categoryName,
    badge: (p.badge === 'new' || p.badge === 'sale' || p.badge === 'best') ? p.badge : undefined,
    price: toNumber(p.price),
    originalPrice: p.originalPrice != null ? toNumber(p.originalPrice) : undefined,
    discount: p.discount != null ? toNumber(p.discount) : undefined,
    rating: toNumber(p.rating),
    reviewCount: toNumber(p.reviewCount),
    sku: typeof p.sku === 'string' ? p.sku : '',
    // Mirrors resolveStock() in lib/api/server.ts — kept local because that module is
    // server-only. The API sends no `stock` field: use totalStock for products with
    // variations, else quantity minus what pending payments have reserved. Clamped
    // because some rows carry negative stock.
    stock: p.hasVariations && p.totalStock != null
      ? toNumber(p.totalStock)
      : Math.max(0, toNumber(p.quantity ?? p.totalStock) - toNumber(p.reservedQuantity)),
    images,
    description: typeof p.description === 'string' ? p.description : '',
    specs: {},
    variants: { sizes: [], finishes: [], crystalTones: [] },
    reviews: [],
    lightOnImage: typeof p.lightOnImage === 'string' && p.lightOnImage.length > 0 ? p.lightOnImage : undefined,
  }
}

function InfiniteProductGridInner({
  initialProducts,
  initialPage,
  totalPages,
  extraParams,
}: Props) {
  const searchParams = useSearchParams()
  const extraKey = useMemo(
    () => new URLSearchParams(extraParams ?? {}).toString(),
    [extraParams],
  )
  const paramKey = useMemo(() => {
    const merged = new URLSearchParams(searchParams.toString())
    new URLSearchParams(extraKey).forEach((value, key) => merged.set(key, value))
    return merged.toString()
  }, [searchParams, extraKey])

  useScrollRestoration(paramKey)

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [page, setPage] = useState(initialPage)
  const [loading, setLoading] = useState(false)
  const [serverTotalPages, setServerTotalPages] = useState(totalPages)
  const [errorCount, setErrorCount] = useState(0)

  const pageRef = useRef(initialPage)
  const serverTotalPagesRef = useRef(totalPages)
  const hasMore = page < serverTotalPages && errorCount < 3

  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  // Reset when URL params change (new SSR render with new initialProducts)
  useEffect(() => {
    setProducts(initialProducts)
    setPage(initialPage)
    serverTotalPagesRef.current = totalPages
    setServerTotalPages(totalPages)
    pageRef.current = initialPage
    loadingRef.current = false
    setErrorCount(0)
  }, [paramKey, initialProducts, initialPage, totalPages])

  const fetchNextPage = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)

    try {
      const nextPage = pageRef.current + 1
      const params = new URLSearchParams(paramKey)
      params.set('page', String(nextPage))
      params.set('limit', String(BATCH_SIZE))

      const res = await fetch(`/api/products?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const body: unknown = await res.json()
      const bodyObj = body as Record<string, unknown>
      const raw: RawProduct[] = Array.isArray(body)
        ? (body as RawProduct[])
        : Array.isArray(bodyObj?.data)
          ? (bodyObj.data as RawProduct[])
          : Array.isArray(bodyObj?.products)
            ? (bodyObj.products as RawProduct[])
            : Array.isArray(bodyObj?.items)
              ? (bodyObj.items as RawProduct[])
              : []

      const apiTotal: number =
        ((bodyObj?.pagination as Record<string, unknown> | undefined)?.totalPages as number | undefined)
        ?? bodyObj?.totalPages as number | undefined
        ?? serverTotalPagesRef.current

      const resolvedTotal = typeof apiTotal === 'number' && Number.isFinite(apiTotal) ? apiTotal : serverTotalPagesRef.current
      serverTotalPagesRef.current = resolvedTotal
      setServerTotalPages(resolvedTotal)

      const newProducts = raw.map(mapRawProduct)
      setProducts(prev => dedupeById([...prev, ...newProducts]))
      setPage(nextPage)
      pageRef.current = nextPage
      setErrorCount(0)
    } catch {
      setErrorCount(prev => prev + 1)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [paramKey])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, fetchNextPage])

  const { materials, sortBy, viewMode } = useFilterStore()

  const sorted = useMemo(() => {
    let filtered = products
    if (materials.length > 0) {
      filtered = filtered.filter(p =>
        materials.some(m =>
          p.name.toLowerCase().includes(m.toLowerCase()) ||
          p.subtitle.toLowerCase().includes(m.toLowerCase()) ||
          p.category.toLowerCase().includes(m.toLowerCase())
        )
      )
    }
    return [...filtered].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price
      if (sortBy === 'price-desc') return b.price - a.price
      if (sortBy === 'rating') return b.rating - a.rating
      return 0
    })
  }, [products, materials, sortBy])

  return (
    <div className="flex-1 p-4 sm:p-8 overflow-visible">
      {sorted.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="font-serif text-[24px] font-light text-[#2C2825] mb-3">No products found</div>
          <div className="text-[13px] text-[#A09488]">Try adjusting your filters</div>
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'cards-track grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 pt-4'
          : 'flex flex-col gap-4'
        }>
          {sorted.map(p => (
            <ProductCard key={p.id} product={p} variant={viewMode} />
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 gap-3" aria-live="polite" aria-atomic="true">
          <div
            className="w-5 h-5 rounded-full border-2 border-[#D8D0C4] border-t-[#C4714A] animate-spin"
            aria-label="Loading more products"
          />
          <span className="text-[12px] text-[#A09488] tracking-[0.06em]">Loading more…</span>
        </div>
      )}

      <div ref={sentinelRef} aria-hidden="true" />

      {errorCount >= 3 && page < serverTotalPages && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-4">
            <div className="h-px w-16 bg-[#D8D0C4]" />
            <span className="text-[11px] text-[#A09488] tracking-[0.12em] uppercase">Failed to load — try refreshing</span>
            <div className="h-px w-16 bg-[#D8D0C4]" />
          </div>
        </div>
      )}
      {!hasMore && errorCount < 3 && products.length > 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-4">
            <div className="h-px w-16 bg-[#D8D0C4]" />
            <span className="text-[11px] text-[#A09488] tracking-[0.12em] uppercase">All products loaded</span>
            <div className="h-px w-16 bg-[#D8D0C4]" />
          </div>
        </div>
      )}
    </div>
  )
}

/** Static fallback (no useSearchParams): renders the server-fetched products. */
function InitialGrid({ initialProducts }: Pick<Props, 'initialProducts'>) {
  return (
    <div className="flex-1 p-4 sm:p-8 overflow-visible">
      <div className="cards-track grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 pt-4">
        {initialProducts.map(p => (
          <ProductCard key={p.id} product={p} variant="grid" />
        ))}
      </div>
    </div>
  )
}

// useSearchParams() requires a Suspense boundary on statically prerendered
// pages (e.g. /rooms/[slug]); wrapping here protects every call site.
export default function InfiniteProductGrid(props: Props) {
  return (
    <Suspense fallback={<InitialGrid initialProducts={props.initialProducts} />}>
      <InfiniteProductGridInner {...props} />
    </Suspense>
  )
}
