# TODOS

Deferred work with the context needed to pick it up cold. Each item states **why** it was
deferred and any **precondition** that must be true before starting — several of these are
blocked on facts nobody has checked yet, and starting them out of order wastes the work.

Source: `/plan-ceo-review` on 2026-08-04 (branch `master`).

---

## P1 — Blocked on a query, not on effort

### T12 · Determine the Phase 2 notification channel
**What:** `SELECT COUNT(*) FROM website_users WHERE email IS NOT NULL;`
**Why:** `WebsiteUser.email` is nullable and signup is phone-first (`phone` is the NOT NULL
unique key). If most users are phone-only, Phase 2 is MSG91 SMS, not SES email.
**Why it matters more than it looks:** Indian SMS marketing consent is a **DLT-registered
regime**, not a boolean column. The `marketingConsent` + `unsubscribeToken` schema below is
shaped for email. Running this query first decides whether that schema is even correct.
**Effort:** S (~15 min) · **Priority:** P1 · **Blocks:** everything under "Phase 2 features"

### Variation divergence check
**What:** Count `product_variations` rows, and how many have a price differing from their parent
product.
**Why:** sizes the P0 pricing bug. If few diverge, the bug is real but narrow.
**Effort:** S (~10 min) · **Priority:** P1

### `cart_items` row + duplicate count
**What:**
```sql
SELECT COUNT(*) AS total FROM cart_items;
SELECT websiteUserId, productId, COALESCE(productVariationId,0), COUNT(*)
FROM cart_items GROUP BY 1,2,3 HAVING COUNT(*) > 1;
```
**Why:** the deferred dedupe + unique index (below) forces a full MySQL table rebuild via a STORED
generated column. Nothing prunes abandoned cart rows — `releaseExpiredReservations` releases
stock, not rows — so the table may be larger than expected. Above ~10,000 rows, that migration
needs a maintenance window because it locks the live checkout path.
**Effort:** S (~5 min) · **Priority:** P2 · **Blocks:** the `cart_items` unique index work

---

## P1 — Test and CI infrastructure

### Repair the Jest harness
**What:** the backend test suite cannot load a single test file.
**Why:** two of the plan's success criteria are specified as Jest tests, on a checkout path.
**The real defect (not a path typo):** `tests/setup.js:2` does `require('../models/User')` and
destructures `{ initUser }`. **Both parts are wrong** — there is no root `models/` directory, AND
`src/models/User.js:7` is `module.exports = (sequelize) => {...}`, a bare function with no named
export. Correcting only the path leaves it broken. Use the `src/models/index.js` aggregate.
**Then also:** register all models (not just User), wire `setupFilesAfterEnv`, ensure a reachable
MySQL test DB via `tests/.env.test`, and fix the coverage globs.
**Coverage-glob trap:** `jest.config.js` globs `controllers/`, `models/`, `middleware/`, `utils/`.
The layout is **not** uniformly `src/`-prefixed: `middleware/` and `utils/` are root-level;
`controllers/` and `models/` are under `src/`. **And `src/utils/` also exists**, uncovered by the
root `utils/**` glob — silently omitting ~11 files including `jwt.js` and `password.js`. Do not
blanket-prefix all four.
**Also:** `npm test` runs `lint:logs` first (`scripts/check-no-console.sh`), which hard-fails on
any `console.*` in `src`/`utils`/`middleware`/`app.js`.
**Effort:** L → CC ~45min · **Priority:** P1

### Backend CI/CD
**What:** there is **no** `.github/workflows/` in the backend repo, and `npm run migrate` is a
manual script. The frontend auto-deploys to App Runner on every push to `master` with **no test,
lint, or typecheck gate**.
**Why:** any "migrate first, deploy second" reasoning assumes a pipeline that does not exist. The
real sequence is a manual migration followed by an independent git push.
**Effort:** L · **Priority:** P1

### Frontend test tooling
**What:** stand up Vitest. `package.json` defines only `dev`, `build`, `start` — no test runner,
no lint script.
**Effort:** M → CC ~30min · **Priority:** P2

---

## P1 — `trust proxy` (its own PR — do not bundle)

**What:** `app.set('trust proxy', 1)` is unset, so behind App Runner every request presents the
load balancer IP and **all** IP-keyed rate limiting buckets globally.
**Why it is not a one-liner — three verified reasons:**
1. **It can fail at startup.** `express-rate-limit@7.5.1` is installed and **none** of the four
   limiters (`app.js:78`, `:119`, `:161`, `:200`) sets `validate` or `keyGenerator`. v7 throws
   `ERR_ERL_PERMISSIVE_TRUST_PROXY` on permissive settings. Each limiter needs explicit
   `validate` config or a `keyGenerator` reading the leftmost untrusted hop.
2. **It re-keys four production limiters at once**, on admin paths unrelated to any current
   feature. A bucket sized for all traffic becomes a per-IP bucket that may be far too generous;
   `memoryIntensiveLimiter` may start throttling users who previously shared headroom.
3. **Customer-facing auth has no dedicated limiter.** `userActionLimiter` is mounted only on
   `/api/auth`, `/api/customers`, `/api/sales-orders`, `/api/dashboard` (`app.js:237-240`) — all
   **admin**. Website login/signup at `/api/v1/auth` (`:324`) is covered only by the global
   limiter + `burstLimiter`. Confirm its brute-force posture post-flip.
**Unverified:** App Runner's hop count may make `1` the wrong value, and with no staging this
cannot be rehearsed.
**Effort:** M (~1 day) · **Priority:** P1 · **Own PR, own rollback plan**

---

## P2 — Phase 2 architecture (spec is complete; preconditions are not met)

### `website_user_intents` table
```
id, websiteUserId FK, productId FK, productVariationId FK NULL,
variationKey INT AS (COALESCE(productVariationId,0)) STORED,
kind ENUM('saved','abandoned'), snapshotPrice DECIMAL(10,2), createdAt, updatedAt
UNIQUE (websiteUserId, productId, variationKey, kind)
INDEX (websiteUserId, kind)   -- page read
INDEX (kind, updatedAt)       -- cron scan
```
**PRECONDITION — do not build before this is true:** `productVariationId` must actually be
populated. Today the frontend cannot send one (see the P0 pricing bug), so `variationKey` would
always be `0` and the unique index collapses to `(websiteUserId, productId)` — a no-op enforced
at the cost of a full table rebuild.
**MySQL notes:** NULLs are *distinct* in unique indexes, which is the entire reason `variationKey`
exists. There is **no generated-column precedent** in 67 migrations and Sequelize has no
first-class support — the migration needs raw
`ALTER TABLE ... ADD COLUMN variationKey INT AS (COALESCE(productVariationId,0)) STORED`, and the
model must exclude the attribute from writes or MySQL raises error 3105.
Use a `DECIMAL(10,2) snapshotPrice` column, **not** `meta JSON` — one field is all it ever held.
**Effort:** M → CC ~30min · **Priority:** P2

### Wishlist server endpoints
`GET /`, `POST /toggle`, `DELETE /items/:id`, `POST /merge` — all ownership-scoped.
**Copy the existing safe pattern** from `RemoveCartItem.usecase.js:5-8`:
`findByPk` → `if (item.websiteUserId !== websiteUserId) throw new AppError('Forbidden', 403)`.
The existing cart is **not** IDOR-vulnerable; that is the pattern to reuse.
`POST /toggle` returns `{ saved: boolean, id }` — the heart needs it for fill state, and
add-vs-remove events cannot be distinguished without it.
Cap `/merge` payloads (~200 items); map FK violations to 404, not 500.
**Effort:** M → CC ~40min · **Priority:** P2

### `PUT /api/v1/cart` diff upsert
Replaces the add-then-reconcile stopgap with the correct long-term shape.
- Split `computeCartDiff` (**pure**, unit-testable without a DB) from `applyCartDiff` (thin,
  transactional). The combined function would exceed 5 branches on a money path.
- **Fetch prices OUTSIDE the transaction.** Holding it open across price lookups is what causes
  the pool exhaustion and deadlocks.
- Retry twice on deadlock 1213, then `CartSyncUnavailable` 503 with a user-facing retry.
- **Preserve `snapshotPrice` on update** — it is NOT NULL. Only new rows get fresh snapshots.
- **Required test:** a quantity change during a PENDING payment must still trigger
  `expireStalePayment`. `cartMatchesPayload` (`CreateCheckout.usecase.js:16-24`) compares on
  `(productId, productVariationId, quantity)` and length — **not** row id, so row identity is
  irrelevant. No payment/cart fixture factory exists yet.
- **Route note:** `PUT /api/cart` is a **bare path**, so the frontend export goes in
  `app/api/cart/route.ts`, **not** `app/api/cart/[...proxy]/route.ts` (a catch-all needs at least
  one segment). Getting this wrong 405s at the proxy layer.
- Ship behind a `CART_SYNC_MODE` env flag; **define its removal trigger** (e.g. 2 weeks with zero
  `CartSyncUnavailable` alarms) or it becomes permanent config surface.
**Effort:** L → CC ~1h · **Priority:** P2

### `cart_items` dedupe + `variationKey` + UNIQUE index
Strict intra-migration order — a wrong order halts the deploy:
```
1. dedupe existing duplicate rows (keep max quantity)
2. ADD COLUMN variationKey ... STORED   (raw SQL)
3. ADD UNIQUE INDEX (websiteUserId, productId, variationKey)
```
**Why needed:** `cart_items_dedupe_idx` (migration `20260319000005`, line 21) is **non-unique**,
and `AddToCart.usecase.js:31-39` is an unlocked find-then-update, so concurrent writes can
duplicate rows.
**PRECONDITION:** same as the intent table — meaningless until `productVariationId` flows. Also
gated on the row-count check above (maintenance window above ~10k rows).
**Effort:** M · **Priority:** P2

### Store v2 + merge-on-login
Migrate `wishlistStore` to versioned key `litmeup-wishlist-v2` holding
`{ apiProductId: number | null, slug: string }`.
**The cart's resolver is NOT directly reusable.** It works
(`i.apiProductId ?? (parseInt(i.productId) || undefined)`) because cart items carry `apiProductId`
from the moment of add. Wishlist v1 is a bare `ids: string[]` of `product.id`, which is a **mixed**
set: numeric strings from API products (`lib/api/server.ts` sets `id: String(p.id)`), `'p1'`/`'p2'`
literals from the static catalog, and possible `'0'` from coercion. Migration rule:
```
numeric string, parses > 0  → { apiProductId: Number(v), slug: null }
'pN' literal                → DROP, count as staticOnly (no products row exists)
'0' / NaN / empty           → DROP, count as unresolvable
```
Both drop-counts must surface to the user (banner) and in the `wishlist.merge_on_login` event.
Clear localStorage **only after a confirmed 2xx**; guard against concurrent invocation (two tabs,
React StrictMode double-fire). Idempotency comes from the unique index.
**Effort:** M → CC ~30min · **Priority:** P2

### Proxy factory + shared cart-sync hook
There are **6** proxy files with **inconsistent query-string forwarding**: `auth` and `website`
forward `req.nextUrl.search`; `cart`, `payments`, `orders`, `customer` drop it. That drift already
caused a real defect during planning.
Extract `createBackendProxy({ basePath, forwardSearch })` so the behavior is a named option rather
than an accident, and a `useCartSync` hook shared by `CartPageClient` and `CheckoutClient` (the
sync block is currently duplicated).
**Effort:** M → CC ~30min · **Priority:** P2

---

## P2 — Phase 2 features

### Abandoned-cart cron
Register via the existing `guard()` wrapper (`src/jobs/index.js:19-49` — overlap lock, correlation
ids, full stack logging). Scan `cart_items` for `updatedAt` older than 1 hour, write
`kind:abandoned` intents.
**Two known false-positive sources — handle before sending anything:**
1. `VerifyPayment.usecase.js:78` destroys cart rows on successful payment, so paid carts are
   *gone* rather than joinable. The "no matching PAID payment" join is a safety net, not the
   mechanism.
2. If `CheckoutClient.tsx:206`'s local `clearCart()` does not fire (user closes the Razorpay modal
   after capture, or reloads mid-flow), the local cart survives and the next cart-page visit
   recreates server rows with fresh timestamps — producing a nudge email for an order the customer
   already placed.
**Effort:** M · **Priority:** P2 · **Blocked on:** T12 (channel), consent columns

### Shared notification dispatcher
`dispatch({ userId, kind, template, channel })` → consent check → SES or MSG91 → structured send
log. Built once, it makes abandoned-cart, price-drop, and back-in-stock configuration rather than
three separate senders.
**Blocked on T12** — the channel decision determines its shape.
**Effort:** L → CC ~45min · **Priority:** P2

### Marketing consent + unsubscribe
`website_users.marketingConsent BOOLEAN DEFAULT false` + `unsubscribeToken CHAR(32) UNIQUE NULL`.
Verified: **zero** matches for `unsubscribe|marketingConsent|suppression|optIn` across all models
and migrations. Transactional OTP email does **not** imply marketing consent.
**Blocked on T12** — if the channel is SMS, this schema is the wrong shape (DLT regime, not a
boolean).
**Effort:** S · **Priority:** P2

### E3 · Shareable wishlist link
**The obvious precedent does NOT transfer.** `app/api/visualizer/share/route.ts` writes JSON files
to `/tmp/viz-shares` on the Next.js container — ephemeral per-instance disk, no backend
persistence. Needs real persistence:
```
wishlist_shares
  token CHAR(36) NOT NULL UNIQUE   -- randomUUID(); NEVER the user id
  websiteUserId FK, revokedAt NULL, viewedAt NULL, createdAt, updatedAt

POST   /api/v1/wishlist/share          (authed) → { token }, idempotent per user
DELETE /api/v1/wishlist/share          (authed) → sets revokedAt
GET    /api/v1/wishlist/shared/:token  (PUBLIC) → product fields only, 404 if revoked
```
This is the first unauthenticated read surface exposing user data. **Must** be token-keyed and
never id-keyed (an id-keyed route is an enumerable IDOR); needs its own stricter rate limiter;
returns product name/image/price only — never the owner's name, email, or phone.
**Include `viewedAt`** — the feature's whole justification is acquisition, and without it there is
no way to know whether a share was ever opened.
**Effort:** L → CC ~45min · **Priority:** P3

### E5 · Back-in-stock / notify-me
Re-add `notify_stock` to the `kind` enum; "Notify me" on out-of-stock PDPs.
**Do not ship the button before the dispatcher exists.** A "notify me" that never notifies is a
worse broken promise than the dead wishlist heart this work is fixing — and it would be a new one,
shipped deliberately.
**Effort:** M · **Priority:** P3 · **Blocked on:** the dispatcher

---

## P2 — Observability

### CloudWatch alarms
1. `CartSyncUnavailable` rate > 5 in 15 min.
2. `payment.stale_expired` rate vs pre-deploy baseline — **requires first emitting that log line**
   from `CreateCheckout.usecase.js:30`. `expireStalePayment` is a **local function** called
   synchronously at `:106`, not a cron, and emits nothing countable today. An alarm without the
   log line matches nothing and silently never fires.
**Effort:** S → CC ~20min · **Priority:** P2

### Staging environment
No staging exists. Migrations and checkout changes go straight to production, and per-IP limiter
behavior cannot be rehearsed. Flagged as separate scope, not folded into feature work.
**Effort:** XL (~3-5 days) → CC ~4h · **Priority:** P2

---

## P3 — Catalogue data hygiene for variations (code side is DONE)

Selectors are now derived from the real `ProductVariation` rows rather than the
denormalised summary fields. Verified across all 60 products with variations (125 active
rows) on 2026-08-04:

| | before | after |
|---|---|---|
| phantom combinations offered (resolve to no row) | 120 | **0** |
| offered combinations that resolve to a real row | — | **117/117 (100%)** |
| products whose default selection falls back to the parent price | 32 | **0** |
| variation rows reachable by some selection | 117/125 | 118/125 |

What remains is **data entry, not code**:

### Inconsistent size strings
The same physical size is entered several ways, so it appears as multiple options:
- product 1466: `"300"` on one row, `"300mm"` on three others
- product 1337: `"D480"` / `"d480"`, `"D600"` / `"600"`, `"d-350"` / `"350"`

`resolveVariation()` normalises case, whitespace and a trailing `mm`, so these still
resolve correctly — but the selector shows near-duplicate buttons. Cleaning the admin data
removes the duplicates; no code change needed.

### One genuinely ambiguous pair
Product **1353** has `D280 H220 / Beige` on **two** rows at different prices:
`1015-1 Beige` at 12,600 and `1015-2 Beige` at 26,400. A shopper cannot express which one
they mean. The resolver prefers in-stock then **cheapest**, so it can never charge more
than the shopper could have paid — but the second row is effectively unsellable until the
rows are given distinguishing size or colour values.

(5 other duplicate pairs exist and are harmless: they are same-price A/B variants, e.g.
product 444's `LM712-32A BLACK` and `LM712-32B BLACK` both at 15,600.)

### Rows with no distinguishing axis
Product 1494 (`D39073-S`) has `D39073-M` at 15,500 and `D39073-L` at 17,800, both with a
blank `size`, and `availableSizes` is `[]`. These are now offered as name-labelled
options, so they are purchasable — but populating `size` would let them use the normal
size selector.

**Effort:** S (admin data entry) · **Priority:** P3 · **Blocks:** nothing

## Also

- `components/layout/Footer.tsx:6` — add facebook / pinterest / youtube links once those profiles
  exist.
- Catalog tagging: 3 of 1,012 products have `where_used` set, so `/rooms/[slug]` pages mostly show
  the empty state. This is a data-entry task in the admin panel, not a code bug — and it blocks any
  "you might also like" recommendation work.
- Wishlist pagination UI — the query is bounded (LIMIT 100, newest first); add controls only when
  someone actually hits the cap.
- Horizontal scroll at 375px, found by `/design-review` on 2026-09-30 during the Newsreader + Jost
  swap (both existed before the swap). `/collections`: the 3 stat chips ("5yr Warranty" etc.) push
  the page 46px wide (37px under Cormorant; the wider serif adds 9px). `/collections/[slug]`: the
  tab row ("Reviews") overflows by 24px. Fix is layout (wrap or scroll the row), not type.
- 9px uppercase labels (room-grid tags like "Chandelier Lights", filter "Min"/"Max") are below the
  brand guide's 11–12px floor for caps labels, and Jost's smaller x-height makes 9px read smaller
  than it did in Outfit.
