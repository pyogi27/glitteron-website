# Navigation speed: product and category pages

Phase 1 (measure) — 2026-11-16. No code changed.

## How it was measured

- **Live**: `www.litmeup.in` (Cloudflare → App Runner us-east-1). Measured from the developer's machine; the
  round trip to the storefront is **~255 ms** (`robots.txt` TTFB on a kept-alive connection).
- **Local prod build**: `next build && next start -p 3001`, `API_URL` = the real backend (`msyevmpefs…`), GET only.
- **Click timing**: Playwright (Chromium, 1366×900). Load page, let prefetch settle, click, record click → first DOM
  change in `<main>` and click → URL commit. 3 runs per route.
- **Backend**: Node `fetch` with keep-alive, 5 runs per endpoint, minus a 404 baseline to isolate server time.
- **SQL**: real controllers + real models on a **throwaway local mysqld** seeded at prod scale (1,030 products,
  354 with variations). Schema approximated from models + migrations. Prod RDS was not touched.

## Timing breakdown (before)

| | Product `/collections/[slug]` | Category `/[category]`, `/[category]/[sub]` |
|---|---|---|
| **a) Click → first visual feedback, live** | 360 / 520 / **8,016** ms | 762 / 897 / 1,738 ms |
| a) same, local prod build (no network, warm) | 38–56 ms (first: 2,298) | 83–89 ms |
| Feedback before the new page arrives? | **None** — first DOM change = URL commit (±3 ms) | **None** |
| **b) Server render, warm data cache** | 18 ms | 34–37 ms |
| b) Server render, cold | 1,966 ms (cold process: catalog crawl) / +300–600 ms on first hit per product live | 687 ms / 1,781 ms (sub, room fallback) |
| Live server time above RTT (warm) | ~15–40 ms | ~80–130 ms |
| Render mode in build | **ƒ dynamic** (despite `revalidate = 3600`) | ƒ dynamic (reads `searchParams`) |
| Live `Cache-Control` | `private, no-cache, no-store` | same |
| Prefetch on hover/viewport fetches | `/_tree` only (0.4 KB, no content) | `/_tree` only |
| Payload | HTML 150 KB, RSC 55 KB | HTML **965 KB** (77 KB br), RSC **275 KB** |

### c) Backend calls per render

| Page | Calls | Order | Backend server time each |
|---|---|---|---|
| Product | catalog `GET /api/products?limit=250` ×4 (cold instance only, memo 1 h) → `GET /api/products/:id` → `GET /api/products?category=&limit=5` | **all sequential**; related does not need the detail response | 58 / 5 / 13 ms |
| Category | `GET /api/categories` → `GET /api/products?category=&limit=100` | sequential (the id lookup needs categories) | 4 / 30–45 ms |
| Sub (room) | categories → products `whereUsed=` → products again when < 4 tagged | 3 sequential | 4 / ~10 / 30–45 ms |

Backend is fast: every endpoint answers in **5–60 ms** of server time. It is gzip-compressed, sends an ETag, and sends no
`Cache-Control`. All SSR calls share the storefront's egress IP and count against the backend rate limits
(1,000/15 min global, 200/min and **50/10 s** on `/api/products`). A burst of cold renders can therefore 429 and render
an empty grid or a 404 product.

### d) SQL per endpoint (throwaway DB, loopback)

| Endpoint | Queries | N+1 | Wall |
|---|---|---|---|
| Category listing, limit 100 | 83 | 78 (`getPriceRange` + `getTotalStock` per variation product) | 13.7 ms |
| Umbrella (cat 4+5) | 77 | 72 | 15.9 ms |
| Catalog crawl page, limit 250 | 139–171 | 134–166 | 17–20 ms |
| Related, limit 5 | 9 | 4 | 3.1 ms |
| Product detail (with variations) | 9 | 2, plus 3 re-reads of variations already loaded | 3.3 ms |
| Categories | 2 | 0 | 0.5 ms |

EXPLAIN: every listing is `type=ALL` (~970 rows) + filesort on `created_at`. There is no index on `products.category`,
`created_at`, `show_on_website` or `where_used`. `where_used` is wrapped as `JSON_CONTAINS(...) = 1`, which no
index can serve. The `in_stock` EXISTS uses `(productId, isActive)`.

**Pagination is unstable.** `ORDER BY created_at DESC` has no tiebreaker, and 130 of 1,030 seeded rows share a
timestamp. With an index added on `created_at`, the 3-page crawl returned one product twice and dropped another. This
is a likely source of the duplicate products the storefront already dedupes.

## Top 3 bottlenecks

1. **No feedback until the full server round trip finishes.** Both routes are dynamic and have no `loading.tsx`, so
   `<Link>` prefetch fetches only the route tree. A click waits for India → us-east-1 RTT + render + payload with the
   old page frozen. This is why every live click misses the 100 ms target.
2. **Product pages are rendered on every request.** `/collections/[slug]` has no `generateStaticParams`. The Next 16
   docs say a route needs one (even `return []`) or `dynamic = 'force-static'` for ISR. So `revalidate = 3600` is
   ignored, the page is `no-store`, and prefetch cannot fetch it. First visits per instance add 300–600 ms. A cold
   instance crawls the catalog in 4 *sequential* calls before it can resolve a slug (the 8 s outlier).
3. **Category pages are heavy and serial.** 275 KB RSC / 965 KB HTML for 100 cards (full `Product` objects, including
   composed descriptions and specs, are serialized for the client grid). Data fetches run one after another.

The backend is **not** a bottleneck at today's scale. The N+1 is real but costs ~15 ms locally.

## One recommended fix per layer

| Layer | Fix | Expected effect |
|---|---|---|
| Client | `loading.tsx` skeletons for `collections/[slug]` and `[category]` (also covers `[sub]`). Links are already `<Link>` everywhere; nothing to change there. | Prefetch now carries the skeleton, so click → feedback ≈ one frame (< 100 ms) |
| Next.js | Product: add `generateStaticParams` (top in-stock products, empty-array fallback for the rest) so ISR works, set `revalidate` to the price/stock limit, and fetch detail + related in parallel. Category: `Promise.all` where the id is known statically. | Product pages served from the full-route cache and fully prefetchable; no first-hit penalty after the first visitor |
| Backend | Batch `getPriceRange`/`getTotalStock` into one grouped query per page; `ORDER BY created_at DESC, id DESC` + indexes `(category, created_at, id)` and `(created_at, id)`; `Cache-Control` on public catalogue GETs. | 83 → ~5 queries per listing, stable pagination (fewer duplicates), fewer rate-limit hits |

Not recommended now: an in-process TTL cache (endpoints already answer in 5–60 ms) and Redis/ElastiCache.

Candidate SQL (to confirm against prod first — read-only):

```sql
-- confirm what prod already has
SELECT VERSION();
SHOW INDEX FROM products;
SHOW INDEX FROM ProductVariations;
SHOW COLUMNS FROM products LIKE 'created_at';

-- candidates (do not run until confirmed)
CREATE INDEX products_category_created_id_idx ON products (category, created_at, id);
CREATE INDEX products_created_id_idx         ON products (created_at, id);
CREATE INDEX product_variations_stock_idx    ON ProductVariations (productId, isActive, quantity, reservedQuantity, price);
```

Raw EXPLAIN output and per-query SQL: `results-baseline.json` / `results-candidates.json` from the measurement run.

## Phase 2 (implemented 2026-11-16)

Freshness chosen: content, images and categories ≤ 60 min; price and stock ≤ 60 s.

1. **Skeletons**: `app/collections/[slug]/loading.tsx`, `app/[category]/(listing)/loading.tsx`, `app/[category]/[sub]/loading.tsx`.
   - A streamed skeleton makes a page's own `notFound()` a 200 + noindex soft 404. On the live site these URLs return 404.
   - To keep the real 404, unknown slugs are rejected in layouts that sit above the skeletons:
     `collections/[slug]/layout.tsx`, `[category]/layout.tsx`, `[category]/[sub]/layout.tsx`.
   - The category page moved into the `(listing)` route group (no URL change) so the `[sub]` check can sit outside a
     skeleton too.
   - `dynamicParams = false` does not work for this: it is not enforced on routes that render per request.
2. **Next caching**:
   - Product route: `generateStaticParams` (24 newest in-stock products) turns ISR on, and `revalidate = 60`.
   - Detail and related are fetched in parallel, and metadata takes its price from the 60 s detail fetch.
   - The catalog crawl fetches its pages in parallel.
   - `fetchProducts` dedupes by id.
   - Category routes stay dynamic because they read `?page=` and filters. `generateStaticParams` cannot help them.
3. **Backend**:
   - One grouped variation query per page replaces the per-row N+1.
   - `ORDER BY created_at DESC, id DESC`.
   - `Cache-Control`: `public, max-age=60` on products, `3600` on categories, `private, no-store` for staff, `Vary: Authorization`.
   - The TTL cache was skipped (backend answers in 5–60 ms). Redis was not needed.

### Before / after

"After" is measured on the local production build with **255 ms of emulated latency** (Chrome DevTools), matching the
live RTT. "Before" is the live site, where every click waited for its content.

| | Before | After |
|---|---|---|
| Category → product: first visual feedback | 360–8,016 ms (median 520) | **32–33 ms** (full page, prefetched) |
| Category → product: page usable | same as above | **32–33 ms** |
| Product → category: first visual feedback | 762–1,738 ms (median 897) | **30–31 ms** (skeleton) |
| Product → category: page usable | same as above | **347–370 ms** |
| Product page render mode | ƒ dynamic, `no-store` | ● ISR, `s-maxage=60`, cache HIT TTFB 4–8 ms |
| Product page backend calls | 3 sequential (+4 sequential on a cold instance) | 2 parallel (+3 parallel on a cold instance), and only on cache miss |
| SQL per category listing | 83 queries, full scan + filesort | **6 queries**, index range scan (throwaway DB) |
| SQL per catalog crawl page | 139–171 queries | **6 queries** |
| Crawl pagination | duplicates/gaps possible on `created_at` ties | 709/709 distinct, verified with the new indexes |
| Category page prefetch on load | 24 requests / 213 KB | 42 requests / 318 KB (full product pages for cards in view) |

Not yet measured live: the "after" column needs a deploy of both apps. The backend changes are verified on a throwaway
MySQL, not against production.

## Cloudflare edge cache (product + category HTML)

Redis was considered and skipped. After batching, a listing is 6 queries / ~4 ms, and the storefront already caches
backend reads for 60 s. ElastiCache would also need an App Runner VPC connector, and probably a NAT gateway.

Origin side (in the app):

| Response | Header Cloudflare acts on | Browser sees |
|---|---|---|
| Product `/collections/<slug>` (ISR) | `Cache-Control: s-maxage=60, stale-while-revalidate=…` | same; no `max-age`, so browsers do not store it |
| Category `/<category>`, `/<category>/<sub>` (any query) | `Cloudflare-CDN-Cache-Control: max-age=60`, set in `proxy.ts` | `no-store` (Cloudflare does not forward the header) |
| Any request with an `rsc` header (page data for client navigation) | nothing | — |
| Unknown slugs (404), cart, checkout, account, `/api/*` | nothing / not matched by the rule | — |

Cloudflare side — **Caching → Cache Rules → Create rule**, name `Edge cache product and category HTML`:

```txt
(http.host eq "www.litmeup.in"
 and http.request.method eq "GET"
 and not any(lower(http.request.headers.names[*])[*] eq "rsc")
 and not http.request.uri.query contains "_rsc="
 and (
   starts_with(http.request.uri.path, "/collections/")
   or http.request.uri.path in {"/chandelier-lights" "/pendant-lights" "/ceiling-lights" "/wall-lights" "/table-lamps" "/floor-lamps" "/hanging-lights"}
   or starts_with(http.request.uri.path, "/chandelier-lights/")
   or starts_with(http.request.uri.path, "/pendant-lights/")
   or starts_with(http.request.uri.path, "/ceiling-lights/")
   or starts_with(http.request.uri.path, "/wall-lights/")
   or starts_with(http.request.uri.path, "/table-lamps/")
   or starts_with(http.request.uri.path, "/floor-lamps/")
   or starts_with(http.request.uri.path, "/hanging-lights/")
 ))
```

- **Cache eligibility:** Eligible for cache
- **Edge TTL:** *Use cache-control header if present, bypass cache if not*. Only responses the app marks are stored.
- **Browser TTL:** Respect origin
- **Serve stale content while revalidating:** **Off**. Next sends a ~1-year `stale-while-revalidate`, and with this
  on, Cloudflare could keep serving an old price while it refetches.
- **Cache key:** default (query string included, so `?page=2` and filter combinations are cached separately)

Why the rule is this narrow:
- Static pages (`/about`, `/cart`, …) send `s-maxage=31536000`. Caching them would pin HTML that points at an old
  deploy's JS chunks.
- RSC payloads share the page URL, and Cloudflare ignores `Vary`, so the rule must never store one.

After every deploy, purge the cache (*Caching → Configuration → Purge Everything*, or the API). Otherwise cached
HTML can point at the previous build's chunks for up to 60 s.

**Freshness, honestly.**
- Cloudflare adds at most 60 s.
- Next's ISR still serves the first visit after a quiet period from its own stale copy, then re-renders. So an
  idle product page's price can be older than 60 s once.
- That was already true of the 60 s data cache before this work. Checkout re-prices from the database, so no one is
  charged a stale price.
- Strict ≤60 s on display would need price/stock fetched client-side, which is not done.

Verify after deploy:
- the first `curl -sI` of a product/category URL shows `cf-cache-status: MISS`, the second `HIT` with `age`;
- `curl -sI -H "rsc: 1"` and `/cart` show `DYNAMIC`.

### Live verification (2026-11-17, after deploy + rule)

| Check | Result |
|---|---|
| Product and category HTML | `MISS` → `HIT`, `age` climbs, then `EXPIRED` after 60 s; query strings cached separately |
| Request with `rsc: 1` header (unique probe URL) | `DYNAMIC`, `text/x-component`; the same URL without the header gets HTML, so there is no poisoning |
| Real browser navigation (Playwright, 2 clicks) | 49 RSC requests, all `_rsc=`, all `DYNAMIC`, all `text/x-component`; 0 full reloads |
| `/cart`, `/checkout`, `/about`, `/api/products` | `DYNAMIC` |
| Unknown category / sub / product | 404 |
| TTFB from the test machine (via Paris PoP, keep-alive) | edge HIT 164–178 ms vs origin 238–336 ms |
| Backend `GET /api/products` | `Cache-Control: public, max-age=60`, `Vary: … Authorization` |

Test-harness gotcha: in zsh, an unquoted `$2` holding `-H rsc:1` reaches curl as one argument, so no `rsc` header is
sent. Pass headers as separate quoted arguments.

Index SQL. **Applied to production on 2026-11-17.** After that, `EXPLAIN` of the category listing showed `ref` on
`products_category_created_id_idx`, `Backward index scan; Using index`, and no filesort.
`ProductVariations` also still has a single-column `productId` index and two identical `sku` unique indexes. Both
are redundant but harmless at 452 rows, so they were left in place.

```sql
CREATE INDEX products_category_created_id_idx ON products (category, created_at, id);
CREATE INDEX products_created_id_idx         ON products (created_at, id);
CREATE INDEX product_variations_stock_idx    ON ProductVariations (productId, isActive, quantity, reservedQuantity, price);
```
