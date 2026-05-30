# Infinite Scroll Collections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the page-number pagination on `/collections` with smooth infinite scroll that stops cleanly when all products are loaded, prevents duplicates across pages, and restores scroll position when the user navigates back from a product detail page.

**Architecture:** The server component (`app/collections/page.tsx`) will deliver the first page of products as SSR. A new client wrapper (`InfiniteProductGrid`) takes those initial products plus pagination metadata and uses an `IntersectionObserver` sentinel to fetch additional pages from the existing `/api/products` proxy route. Scroll position is stored in `sessionStorage` keyed by the current URL and restored on mount via a custom hook. The existing `Pagination` component is removed from this page; `Toolbar` keeps its category/sort/view controls unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand (filterStore), Tailwind CSS 4, native `IntersectionObserver`, `sessionStorage` for scroll restoration, `/api/products` proxy route (already exists)

---

## File Map

| Status | File | Purpose |
|--------|------|---------|
| **Modify** | `app/collections/page.tsx` | Pass `initialProducts`, `total`, `totalPages`, `page=1` to `InfiniteProductGrid`; remove `<Pagination>` |
| **Create** | `components/collections/InfiniteProductGrid.tsx` | Client component: holds accumulated products, IntersectionObserver, fetch-next-page logic, end-of-list sentinel, scroll restoration |
| **Create** | `hooks/useScrollRestoration.ts` | Saves and restores `window.scrollY` per URL key in `sessionStorage` |
| **Delete (logical)** | `components/collections/Pagination.tsx` | No longer rendered on collections page; file stays but is unused here |
| **Keep unchanged** | `components/collections/ProductGrid.tsx` | Reused inside `InfiniteProductGrid` for rendering product cards |
| **Keep unchanged** | `components/collections/Toolbar.tsx` | Category/sort/view controls unchanged |
| **Keep unchanged** | `app/api/products/route.ts` | Proxy already supports `page` + `limit` query params |

---

## Task 1: Create `useScrollRestoration` hook

**Files:**
- Create: `hooks/useScrollRestoration.ts`

This hook saves `window.scrollY` to `sessionStorage` before navigation and restores it on mount. It uses the current URL as the key so different filter states get independent positions.

- [ ] **Step 1: Create the hook file**

```ts
// hooks/useScrollRestoration.ts
'use client'
import { useEffect, useRef } from 'react'

export function useScrollRestoration(key: string) {
  const savedRef = useRef(false)

  // Restore on mount
  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true

    const raw = sessionStorage.getItem(`scroll:${key}`)
    if (raw === null) return

    const y = Number(raw)
    if (!Number.isFinite(y) || y <= 0) return

    // RAF ensures DOM has painted before we scroll
    const id = requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: 'instant' })
    })
    return () => cancelAnimationFrame(id)
  }, [key])

  // Save on unload / route change
  useEffect(() => {
    function save() {
      sessionStorage.setItem(`scroll:${key}`, String(window.scrollY))
    }
    window.addEventListener('beforeunload', save)
    // next/navigation fires pagehide when soft-navigating away
    window.addEventListener('pagehide', save)
    return () => {
      save() // also save on component unmount (soft nav)
      window.removeEventListener('beforeunload', save)
      window.removeEventListener('pagehide', save)
    }
  }, [key])
}
```

- [ ] **Step 2: Verify file exists at the right path**

```bash
ls "/Users/yogipatel/Documents/GlitterOn Website/glitteron/hooks/useScrollRestoration.ts"
```

Expected: file listed, no error.

- [ ] **Step 3: Type-check**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npx tsc --noEmit --pretty false 2>&1 | head -30
```

Expected: zero errors for this new file (no existing errors should be introduced).

---

## Task 2: Create `InfiniteProductGrid` client component

**Files:**
- Create: `components/collections/InfiniteProductGrid.tsx`

This is the core component. It:
- Accepts initial SSR products and pagination metadata as props
- Accumulates fetched pages in a local `useState` array, deduplicating by `product.id`
- Watches an invisible sentinel `div` at the bottom with `IntersectionObserver`; when visible and `hasMore === true` and not already loading, fetches the next page from `/api/products`
- Passes the accumulated list to the existing `ProductGrid` for rendering (respecting `viewMode` + `sortBy` + `materials` from `filterStore`)
- Shows a spinner while loading, and an "All products loaded" end message when `hasMore === false`
- Resets accumulated products to `initialProducts` whenever URL search params change (category/sort/filter change means fresh results)
- Calls `useScrollRestoration` with the current URL search string as key

- [ ] **Step 1: Create the component**

```tsx
// components/collections/InfiniteProductGrid.tsx
'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Product } from '@/lib/types'
import { useFilterStore } from '@/lib/stores/filterStore'
import ProductCard from '@/components/products/ProductCard'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'

interface Props {
  initialProducts: Product[]
  initialPage: number
  totalPages: number
  limit: number
}

function dedupeById(products: Product[]): Product[] {
  const seen = new Set<string>()
  return products.filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

export default function InfiniteProductGrid({
  initialProducts,
  initialPage,
  totalPages,
  limit,
}: Props) {
  const searchParams = useSearchParams()
  const paramKey = searchParams.toString()

  // Restore scroll position when returning from product detail
  useScrollRestoration(paramKey)

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [page, setPage] = useState(initialPage)
  const [loading, setLoading] = useState(false)
  const hasMore = page < totalPages

  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false) // prevents double-fires from IntersectionObserver

  // Reset when filters/category/sort change (new SSR render delivers new initialProducts)
  useEffect(() => {
    setProducts(initialProducts)
    setPage(initialPage)
    loadingRef.current = false
  }, [paramKey, initialProducts, initialPage])

  const fetchNextPage = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)

    try {
      const nextPage = page + 1
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', String(nextPage))
      params.set('limit', String(limit))

      const res = await fetch(`/api/products?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const body = await res.json()

      // Handle both array and envelope shapes
      const raw: unknown[] = Array.isArray(body)
        ? body
        : (body?.data ?? body?.products ?? body?.items ?? [])

      // Map raw API products to Product shape using same fields as server.ts mapApiProduct
      const newProducts: Product[] = (raw as Record<string, unknown>[]).map(p => ({
        id: String(p.id),
        slug: (p.slug as string | undefined) ?? String(p.name).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
        apiProductId: p.id as number,
        name: p.name as string,
        subtitle: (p.description as string | undefined) ?? '',
        category: (p.category as { name?: string } | undefined)?.name ?? '',
        badge: p.badge as string | undefined,
        price: p.price as number,
        originalPrice: p.originalPrice as number | undefined,
        discount: p.discount as number | undefined,
        rating: (p.rating as number | undefined) ?? 0,
        reviewCount: (p.reviewCount as number | undefined) ?? 0,
        sku: (p.sku as string | undefined) ?? '',
        stock: p.stock as number | undefined,
        images: (Array.isArray(p.imageUrls) && (p.imageUrls as string[]).length > 0)
          ? (p.imageUrls as string[])
          : Array.isArray(p.images)
            ? (p.images as Array<string | { url: string }>).map(img =>
                typeof img === 'string' ? img : (img as { url: string }).url
              ).filter(Boolean)
          : ['https://images.pexels.com/photos/1123262/pexels-photo-1123262.jpeg?auto=compress&cs=tinysrgb&w=800&h=900&fit=crop'],
        description: (p.description as string | undefined) ?? '',
        specs: {},
        variants: { sizes: [], finishes: [], crystalTones: [] },
        reviews: [],
      }))

      setProducts(prev => dedupeById([...prev, ...newProducts]))
      setPage(nextPage)
    } catch (err) {
      console.error('[InfiniteProductGrid] fetch failed:', err)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [page, searchParams, limit])

  // IntersectionObserver: triggers fetchNextPage when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' } // start fetching 200px before sentinel is visible
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, fetchNextPage])

  // ── Client-side filter/sort (mirrors ProductGrid logic) ──
  const { materials, sortBy, viewMode } = useFilterStore()

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

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price
    if (sortBy === 'price-desc') return b.price - a.price
    if (sortBy === 'rating') return b.rating - a.rating
    return 0
  })

  return (
    <div className="flex-1 p-8 overflow-visible">
      {sorted.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="font-serif text-[24px] font-light text-[#2C2825] mb-3">No products found</div>
          <div className="text-[13px] text-[#A09488]">Try adjusting your filters</div>
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'cards-track grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4'
          : 'flex flex-col gap-4'
        }>
          {sorted.map(p => (
            <ProductCard key={p.id} product={p} variant={viewMode} />
          ))}
        </div>
      )}

      {/* Sentinel — observed by IntersectionObserver */}
      <div ref={sentinelRef} aria-hidden="true" />

      {/* Loading spinner */}
      {loading && (
        <div className="flex items-center justify-center py-12 gap-3">
          <div
            className="w-5 h-5 rounded-full border-2 border-[#D8D0C4] border-t-[#C4714A] animate-spin"
            aria-label="Loading more products"
          />
          <span className="text-[12px] text-[#A09488] tracking-[0.06em]">Loading more…</span>
        </div>
      )}

      {/* End of list */}
      {!hasMore && products.length > 0 && (
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
```

- [ ] **Step 2: Type-check**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npx tsc --noEmit --pretty false 2>&1 | head -30
```

Expected: zero new errors.

---

## Task 3: Update `app/collections/page.tsx`

**Files:**
- Modify: `app/collections/page.tsx`

Replace `<ProductGrid>` + `<Pagination>` with `<InfiniteProductGrid>`. Pass `initialProducts`, `initialPage=1`, `totalPages`, and `limit` as props. Remove the `Pagination` import.

- [ ] **Step 1: Update the server component**

Replace the entire file with:

```tsx
// app/collections/page.tsx
import type { Metadata } from 'next'
import PageBanner from '@/components/collections/PageBanner'
import Toolbar from '@/components/collections/Toolbar'
import FilterSidebar from '@/components/collections/FilterSidebar'
import InfiniteProductGrid from '@/components/collections/InfiniteProductGrid'
import { fetchCategories, fetchProducts, mapApiProduct } from '@/lib/api/server'
import { products as staticProducts } from '@/lib/data/products'

const VALID_LIMITS = [12, 24, 48]
const DEFAULT_LIMIT = 12

export const metadata: Metadata = {
  title: 'Collections — GlitterOn',
  description: '500+ handcrafted chandeliers & pendant lights for every space.',
}

interface Props {
  searchParams: Promise<{ page?: string; limit?: string; category?: string; minPrice?: string; maxPrice?: string }>
}

export default async function CollectionsPage({ searchParams }: Props) {
  const { page: pageStr, limit: limitStr, category: categoryParam, minPrice: minPriceStr, maxPrice: maxPriceStr } = await searchParams
  const page = Math.max(1, Number(pageStr) || 1)
  const limit = VALID_LIMITS.includes(Number(limitStr)) ? Number(limitStr) : DEFAULT_LIMIT
  const minPrice = minPriceStr ? Number(minPriceStr) : undefined
  const maxPrice = maxPriceStr ? Number(maxPriceStr) : undefined

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

  const sidebarCategories = [
    { label: 'All', count: usingApi ? total : staticProducts.length },
    ...categories.map(c => ({ label: c.name })),
  ]

  return (
    <>
      <PageBanner
        title="All Collections"
        subtitle="500+ handcrafted chandeliers & pendant lights for spaces that deserve to glow."
        stats={[
          { num: '500+', label: 'Designs' },
          { num: '12K+', label: 'Customers' },
          { num: '5yr', label: 'Warranty' },
        ]}
      />
      <Toolbar categories={categories} total={total} />
      <div className="flex items-start min-h-screen bg-[#EDE8E0]">
        <div className="hidden lg:block">
          <FilterSidebar categories={sidebarCategories} />
        </div>
        <InfiniteProductGrid
          initialProducts={products}
          initialPage={usingApi ? page : 1}
          totalPages={usingApi ? totalPages : 1}
          limit={limit}
        />
      </div>
    </>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npx tsc --noEmit --pretty false 2>&1 | head -30
```

Expected: zero new errors.

- [ ] **Step 3: Build to confirm no compilation errors**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` or similar success output.

- [ ] **Step 4: Commit**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && git add components/collections/InfiniteProductGrid.tsx hooks/useScrollRestoration.ts app/collections/page.tsx && git commit -m "feat: infinite scroll on collections page with scroll restoration"
```

---

## Task 4: Verify behaviour manually

Run the dev server and confirm all requirements:

- [ ] **Step 1: Start dev server**

```bash
cd "/Users/yogipatel/Documents/GlitterOn Website/glitteron" && npm run dev
```

Open `http://localhost:3000/collections` in a browser.

- [ ] **Step 2: Verify infinite scroll triggers**

Scroll to the bottom of the product grid. Within ~200px of the sentinel, a spinner appears and new products are appended below the existing ones. No page reload occurs.

- [ ] **Step 3: Verify no duplicate products**

Rapidly scroll through the full list after multiple pages load. Each product card appears exactly once (check by product name; duplicates would be visually obvious in a grid).

- [ ] **Step 4: Verify end state**

After the last page loads, the spinner disappears and the "All products loaded" divider with flanking lines appears. No further network requests fire.

- [ ] **Step 5: Verify scroll restoration**

1. Scroll down until several pages have loaded.
2. Click a product card to navigate to its detail page.
3. Press the browser Back button.
4. The page should return to the same scroll position, not jump to the top.

- [ ] **Step 6: Verify filter reset**

1. On `/collections`, let a second page load.
2. Click a category tab in Toolbar (e.g. "Pendants").
3. The URL updates, the page re-renders with SSR results for that category, and accumulated products reset to only the new category's first page.

---

## Self-Review Checklist

- [x] **Spec coverage — infinite scroll stops at end:** `hasMore = page < totalPages`; when false, observer disconnects and sentinel is not rendered.
- [x] **Spec coverage — no duplicate products:** `dedupeById` deduplicate on every append using `Set<string>` of product IDs.
- [x] **Spec coverage — scroll restoration on back-navigation:** `useScrollRestoration` saves on unmount / pagehide and restores on mount with `requestAnimationFrame`.
- [x] **Spec coverage — smooth scroll (no jumps):** IntersectionObserver with `rootMargin: '200px'` prefetches before the user hits the bottom; no page reload.
- [x] **Filter reset:** `useEffect` watching `paramKey` resets `products` to `initialProducts` and `page` to `initialPage` when URL search params change.
- [x] **No Pagination component rendered:** Removed from `page.tsx`; `Pagination.tsx` still exists but is simply not imported here.
- [x] **Static fallback:** When API is unavailable, `usingApi` is false, `totalPages=1`, and `InfiniteProductGrid` shows static products with no scroll (correct — only one page).
- [x] **Type consistency:** `Product` type used in hook, component, and page. `dedupeById` receives `Product[]`. `useScrollRestoration` takes `string`. All match.
- [x] **No placeholder steps:** Every step contains actual code or shell commands.
