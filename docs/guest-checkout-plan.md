# Guest checkout: plan

Status: **approved 2026-11-04** (decisions in §10). Phases 0, 1 and 3 implemented in the backend working tree and Phases 2 and 4 in the storefront, all uncommitted. No migrations run. §11 lists where the build differs from this plan.
Date: 2026-11-02. Repos: storefront `glitteron/` (Next.js 16, Clerk) and backend + admin `~/Downloads/glitteron-prod/` (`server/` Express + Sequelize + MySQL, `client/` admin panel).

Goal: a shopper can pay without signing in, and can later view their orders without creating an account. The signed-in Clerk checkout keeps working exactly as it does today; guest checkout is an extra path.

---

## 1. What the code actually does today

I checked every claim in the brief against the code. Corrections are in **bold**.

| Area | Finding |
|---|---|
| Cart | The Zustand/localStorage cart (`lib/stores/cartStore.ts`) is only the browser copy. **There is also a server cart** (`cart_items`, `websiteUserId NOT NULL`). `lib/api/cartSync.ts` reconciles the local cart onto it before pricing and paying, and `CreateCheckout` charges the **server** cart. All `/api/v1/cart` routes use `requireWebsiteAuth` (`cart.routes.js:7`). |
| Payments routes | As described: `/checkout`, `/verify`, `/:id` and `/:id/refund` need Clerk; `/webhook` is public and HMAC-checked (`payments.routes.js`). |
| Refund | **Any signed-in shopper can refund their own PAID payment** (`POST /payments/:id/refund` → `ProcessRefund.usecase.js`). It does not cancel the order or restock, so a shopper can refund and still get the goods. No UI calls it. |
| Pricing | The server reprices from the DB: `reserveItem` reads the live `price` under `FOR UPDATE`, and `computeWebsitePricing` adds discounts, GST and courier. Client prices are never used. Good as is. |
| Orders (website-auth) | `GET /auth/orders` and `/auth/orders/:id` filter by `websiteUserId` (`GetMyOrders`, `GetOrderById`). |
| Account linking | `findOrLinkWebsiteUser` (`middleware/websiteAuth.js`) claims a `website_users` row with `clerkUserId IS NULL` by Clerk-verified email, **only on a user's first sign-in** (it returns early once linked). `website_users.email` is not kept in sync with Clerk afterwards. |
| Coupon limiter | `couponLimiter.js` allows 10 tries/min **per `websiteUserId`**, only counting requests that carry a code. `perCustomerLimit` is counted by `websiteUserId` (`loadPricingContext.countUsage`). |
| Models | `website_payments.websiteUserId`, `cart_items.websiteUserId` and `discount_redemptions.websiteUserId` are **NOT NULL**. **`salesOrders.customerId` is NOT NULL.** The table is `salesOrders`, not `sales_orders`. `website_users.email` and `website_users.phone` are UNIQUE, and so is `customers.email`. |
| Webhook bug | **`HandleWebhook` and `reconcileFailedOrders` create the order but never deduct stock, release `reservedQuantity` or clear the cart.** Only `VerifyPayment` does. The expiry job skips payments that already have a `salesOrderId`, so that stock stays reserved forever. Guest shoppers who close the tab will hit this path far more often. |
| Signatures | `RazorpayGateway.js` compares HMACs with `===`. The installed SDK's `validateWebhookSignature` does the same. The webhook does not check that the captured amount equals `payment.amount`. |
| CORS | **`app.js:262` copies any request `Origin` into `Access-Control-Allow-Origin` with `Allow-Credentials: true`**, which overrides the allowlist in `corsOptions`. Today's Bearer-token auth limits the damage. Cookie auth would not. |
| Client IP | `app.js` sets no `trust proxy`, and the Next `/api/*` proxies call the backend server-to-server without forwarding the client IP. **Every IP-keyed rate limit therefore sees one IP (the Next server) for all shoppers.** |
| Email | `sendOrderConfirmationEmail(websiteUserId)` returns early if `user.email` is empty. It puts `${user.firstName}` into HTML **without escaping**. |
| Next proxies | `app/api/{cart,payments,auth,...}/[...proxy]/route.ts` forward `authorization` and `cookie`, and pass `set-cookie` back. |
| `proxy.ts` | Only `clerkMiddleware`, with no route gating. Account pages redirect on the client via `useRequireAuth`. The single login wall in checkout is `useRequireAuth()` in `components/checkout/CheckoutClient.tsx:56`. |
| Tests | Jest with mocked models (`tests/websiteAuth.test.js` pattern), no live DB, and no supertest. |

---

## 2. Research answers

### Q1. Razorpay guest flow

- **Orders API + Checkout.js need no customer account.** Standard Checkout only needs `key`, `amount`, `order_id` and a handler. `prefill.name`, `prefill.email` and `prefill.contact` are optional. `customer_id` is only needed for saved cards ([Checkout options](https://razorpay.com/docs/payment-gateway/web-integration/standard/checkout-options), [Saved cards](https://razorpay.com/docs/payments/payment-methods/cards/features/integrate-saved-cards), [Node integration](https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration)). Our `CreateCheckout` already creates the order on the server with a fixed amount, so a guest is just prefill data.
- **Webhook vs `/verify`:** keep both, and make the webhook the authority.
  - `/verify` stays as the fast path that gives the browser its confirmation page.
  - `payment.captured` is the safety net for guests who close the tab. It already creates the order, after Phase 0 makes it finish the job: deduct stock, release the reservation, clear the cart and send the email.
  - Razorpay delivers at least once, can deliver out of order, retries non-2xx for 24 h, and times out after 5 s ([Webhook best practices](https://razorpay.com/docs/webhooks/best-practices.md)).
  - `order.paid` and `payment.captured` both fire on capture. `order.paid` also carries the order entity ([Order webhooks](https://razorpay.com/docs/webhooks/orders.md), [Payment payloads](https://razorpay.com/docs/webhooks/payloads/payments/)). Subscribing to both buys nothing, so keep `payment.captured`.
  - Our dedup is business-state based: a `FOR UPDATE` lock on the payment row plus checks on `salesOrderId` and `status`. That is what Razorpay's guidance asks for alongside `x-razorpay-event-id`, so a separate event table is not needed.
  - Add a check that the captured amount equals `payment.amount`, and switch to a constant-time signature compare.
- **Magic Checkout: not worth it now.**
  - Razorpay has to enable it on the account.
  - Orders must be created with `line_items_total`.
  - You must host **public, unauthenticated** shipping-info and promotions (get/apply coupon) APIs that Razorpay calls ([Magic Checkout web](https://razorpay.com/docs/payments/magic-checkout/web), [Integration guide](https://razorpay.com/docs/developer-tools/integrations/magic-checkout/)). That would duplicate our discount engine and courier calculator behind a second, public interface.
  - Its wins (saved addresses from Razorpay's network, COD/RTO tools) can be revisited once guest checkout has data.

### Q2. Guest identity: what to collect and where it lives

- **Collect:** full name, email (required, because it carries the order link and the receipt), phone (already required, a 10-digit Indian mobile), address line, city, state and pincode. This is the existing `AddressForm` plus one email field.
- **Where:** a **guest row in `website_users`** (`isGuest = 1`). The name goes in `firstName`/`lastName` and the email in a new non-unique `guestEmail` column. `email` stays NULL so the existing claim-by-email can never match a guest row, and `phone` stays NULL because it is UNIQUE. The shipping address and phone go in `orderPayload.shippingAddress` as today.
- At order time the guest gets a **new `Customer`** row (`notes: 'source:website-guest'`, `email` NULL), because `salesOrders.customerId` is NOT NULL.
  - It never reuses an existing customer by the typed email. That email is unverified, and `createOrderFromPayment` overwrites `Customer.phone`, so a stranger could otherwise rewrite a real customer's phone on the B2B ledger.
- **Why not nullable FKs plus `guestEmail` columns on `salesOrders`, `website_payments` and `discount_redemptions`?** That means about 10 `websiteUserId NOT NULL` assumptions to relax, weaker ownership checks (`VerifyPayment` matches `{razorpayOrderId, websiteUserId}`), and a second copy of the checkout and verify use-cases that would drift apart. With a guest row, cart, checkout, verify, the one-open-payment rule, reservations, `countUsage` and `findPurchase` all run **unchanged**.

### Q3. Looking up guest orders

| Option | Verdict |
|---|---|
| (a) Signed, tokenized link in the confirmation email/WhatsApp | **Yes, primary.** No extra step for the shopper. |
| (b) Order number + email/phone, then a one-time code | **Skip.** It is (c) with more steps and an OTP pipeline to build. |
| (c) Magic link sent to the email on the order | **Yes, recovery only:** "Find my orders" mails fresh links for every guest order on that email. |

How it works:
- **Token:** 32 random bytes (`crypto.randomBytes`, base64url). Only its SHA-256 is stored, in `guest_order_tokens`. Each token is scoped to **one order and read-only**: it cannot change the cart, pay or refund.
- **TTL:** confirmation links last 365 days and recovery links 7 days (see open questions).
- **How the token travels:** `https://<site>/orders/guest#t=<token>`. A fragment is never sent to servers, CDNs or logs, and never in `Referer`.
  - The page reads it, strips it with `history.replaceState`, and POSTs it **in the request body** (`requestLogger` already redacts body keys named `token`).
  - The page is `noindex` with `referrer: no-referrer`, and the response is `Cache-Control: no-store`.
- **Never by order ID alone:** `GET /auth/orders/:id` stays Clerk-only. The guest endpoint takes only a token, and every failure (unknown, expired, malformed) returns the same 404.
- **What the page shows:** order number, date, status, payment status, items, totals, coupon, ship-to city and state, and the email masked (`a***@gmail.com`). It does **not** show the street address, full phone, Razorpay IDs or internal IDs. The invoice PDF is already attached to the email.

### Q4. Linking guest orders to an account

- **Not in `findOrLinkWebsiteUser`:** it runs only on first sign-in, so guest orders placed after the account exists would never link. It also reads `website_users.email`, which goes stale.
- **New endpoint `POST /api/v1/auth/orders/claim-guest` (Clerk).** The storefront calls it when the account Orders page loads.
  - It reads the user's **current primary verified email live from Clerk** (`clerk.users.getUser`), in the same way as `primaryVerifiedEmail()`.
  - In one transaction, for guest rows with `isGuest = 1 AND guestEmail = :email AND linkedWebsiteUserId IS NULL`, it re-points `salesOrders.websiteUserId`, `website_payments.websiteUserId` and `discount_redemptions.websiteUserId` to the account. That opens the review gate (`findPurchase`) and makes per-customer coupon counts include those orders.
  - It deletes those guest rows' `cart_items`, sets `isActive = 0` and `linkedWebsiteUserId`, and clears `guestTokenHash`.
  - It never copies name, address or phone into the account. Guest `Customer` rows are left alone (admin can merge manually), and existing order links keep working.
- **Planted-order risk (raised by the security review):** someone checks out as a guest typing your email, and the order later shows up in your account.
  - Impact is low. The claimer has proven they own the mailbox, and that mailbox already received the confirmation email for that order. Nothing about the victim leaks to the attacker.
  - The only real lever it would add is the self-refund endpoint, which Phase 0 removes.
  - Stricter option: link only after the guest has opened an emailed link. See the open questions.

### Q5. Abuse and security: see §7 (checklist).

### Q6. What breaks for a guest: see §8.

---

## 3. Recommended flow

```
Cart page (local Zustand cart, unchanged)
  │  "Checkout"
  ▼
/checkout ── Clerk signed in? ── yes ──▶ existing flow, untouched
  │ no
  ▼
Signed out: guest checkout starts automatically (no choice screen)
  ▼
POST /api/guest/session ─▶ backend creates website_users{isGuest:1} + sets
                           __Host-glt_guest cookie (httpOnly, Secure, SameSite=Strict)
  ▼
syncCartToServer(items)  ─▶ /api/cart/*  (guest cookie auth; server cart under guest row)
GET /api/cart?pincode=   ─▶ server prices: live DB prices, discounts, GST, courier
  ▼
Guest fills name, email, phone, address ─▶ Pay
  ▼
POST /api/payments/checkout {shippingAddress, contact:{fullName,email}, couponCode?}
  ─▶ CreateCheckout (unchanged): lock + reserve stock 15 min, reprice, create Razorpay order
  ▼
Razorpay Checkout.js modal (prefill name/email/contact; timeout = reservedUntil)
  ├─ handler ─▶ POST /api/payments/verify ─▶ HMAC (constant-time) ─▶ finalizePaidPayment
  │              ─▶ {salesOrderId, orderAccessToken}; guest cookie cleared
  │              ─▶ router.push('/orders/guest#t=<token>')
  └─ tab closed ─▶ webhook payment.captured ─▶ HMAC + amount check ─▶ finalizePaidPayment
  ▼
After commit (either path, once per order): confirmation email to guestEmail
  (escaped HTML, PDF, 365-day order link); WhatsApp as today
  ▼
Later: open emailed link ─▶ /orders/guest#t=… ─▶ POST /api/guest/orders/lookup {token}
Lost link: /orders/guest (no token) ─▶ "Find my orders" ─▶ POST /api/guest/orders/recover {email}
           ─▶ always 200; mails fresh 7-day links if orders exist
Signs up later with same verified email ─▶ /orders page calls claim-guest ─▶ orders attached
```

`finalizePaidPayment` (Phase 0) is the one shared step that verify, the webhook and `reconcileFailedOrders` all call:
1. Create the order.
2. Deduct stock and release the reservation.
3. Clear the cart.
4. Mark the payment PAID.

---

## 4. API changes

Base path `/api/v1`. "Guest" means the `__Host-glt_guest` cookie, read by the new `requireWebsiteAuthOrGuest`:
- A `Bearer` header always means Clerk. A bad Bearer token gets a 401 and **never** falls back to the guest path.
- Otherwise the middleware reads the cookie and looks up `sha256(token)` in rows where `isGuest = 1`, `isActive = 1` and `guestExpiresAt > NOW()`.

All guest routes return 404 unless `GUEST_CHECKOUT_ENABLED=true`.

| Endpoint | Auth | Request | Response |
|---|---|---|---|
| `POST /guest/session` **new** | public; 10/h per client IP | `{}` | `200 {success, expiresAt}` and `Set-Cookie: __Host-glt_guest=<token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`. Reuses the row if a valid cookie is already present. |
| `DELETE /guest/session` **new** | guest | — | `204`, clears the cookie, sets `guestExpiresAt = NOW()` |
| `GET/POST/PATCH/DELETE /cart/**` *changed* | Clerk **or** guest | unchanged | unchanged |
| `POST /payments/checkout` *changed* | Clerk **or** guest; guests limited to 10/15 min per IP and per guest row | Adds `contact: {fullName: 2–100 chars, email: valid, ≤254}`, **required for guests** and ignored for Clerk. `shippingAddress` gets validated with express-validator, which is already installed: `addressLine1` ≤200, `city`/`state` ≤100, `zipCode` `^\d{6}$`, phone as today. Guests: max quantity per line (see open questions). | Unchanged. New errors: `409 "Sign in to use this code"` (coupon with `perCustomerLimit`), `429`, `503 "Checkout is busy, please try again shortly"` (too many open guest checkouts) |
| `POST /payments/verify` *changed* | Clerk **or** guest | unchanged | `{success, salesOrderId}`. Guests also get `orderAccessToken`, and the response clears the guest cookie (one session = one order). |
| `GET /payments/:id` | Clerk only (unchanged) | — | — |
| `POST /payments/:id/refund` **removed** | — | — | Removed from the storefront router (Phase 0; see open questions) |
| `POST /payments/webhook` *changed internally* | Razorpay HMAC | unchanged | Unchanged. Now uses a constant-time compare, checks the amount, and calls `finalizePaidPayment`. |
| `POST /guest/orders/lookup` **new** | order token | `{token}` | `200 {success, order: GuestOrderView}` with `Cache-Control: no-store`. Every failure returns `404 {success:false, message:"This link is invalid or has expired"}`. 30/15 min per IP. |
| `POST /guest/orders/recover` **new** | public; 3/h per email, 10/h per IP | `{email}` | Always `200 {success, message:"If we have orders for that email, we've sent you a link."}`. The email is sent after the response, so timing reveals nothing. It goes only to the stored `guestEmail`, links at most the 10 newest orders, and issues fresh 7-day tokens. |
| `POST /auth/orders/claim-guest` **new** | Clerk only | `{}` | `{success, claimed: <n>}` |

`GuestOrderView`:

```json
{ "id": 1234, "createdAt": "…", "status": "approved",
  "payment": { "status": "PAID" },
  "items": [{ "name": "…", "variationName": "…", "image": "…", "quantity": 2, "price": "…", "total": "…", "mrp": "…" }],
  "listSubtotal": "…", "discountTotal": "…", "couponCode": null,
  "subtotal": "…", "gstAmount": "…", "courierCharges": "…", "finalTotal": "…",
  "shipTo": { "city": "Surat", "state": "Gujarat" },
  "emailMasked": "a***@gmail.com" }
```

**Client IP:**
- The Next proxies add `x-client-ip` (taken from the request's own `x-forwarded-for` as set by the hosting platform) and `x-proxy-secret: $PROXY_SHARED_SECRET`.
- The backend uses `x-client-ip` as the rate-limit key **only when the secret matches**; otherwise it keys on `req.ip`.
- Limiters stay in-memory per instance, the same pattern as `app.js` today. Ceiling: limits multiply by the number of App Runner instances. Move to a shared store if it scales out.

---

## 5. Database changes (raw MySQL, for you to run)

`salesOrders.id` is `INT` in the model. Confirm with `SHOW CREATE TABLE salesOrders;` before adding the FK. No changes are needed to `salesOrders`, `website_payments`, `discount_redemptions` or `cart_items`.

```sql
-- 1. Guest rows in website_users
ALTER TABLE website_users
  ADD COLUMN isGuest TINYINT(1) NOT NULL DEFAULT 0 AFTER isActive,
  ADD COLUMN guestEmail VARCHAR(255) NULL AFTER isGuest,
  ADD COLUMN guestTokenHash CHAR(64) NULL AFTER guestEmail,
  ADD COLUMN guestExpiresAt DATETIME NULL AFTER guestTokenHash,
  ADD COLUMN linkedWebsiteUserId INT NULL AFTER guestExpiresAt,
  ADD UNIQUE KEY uq_website_users_guest_token (guestTokenHash),
  ADD KEY idx_website_users_guest_email (isGuest, guestEmail);

INSERT INTO SequelizeMeta (name) VALUES ('20261103000001-add-guest-columns-to-website-users.js');

-- 2. Per-order view tokens (SHA-256 only, never the raw token)
CREATE TABLE guest_order_tokens (
  id INT NOT NULL AUTO_INCREMENT,
  salesOrderId INT NOT NULL,
  tokenHash CHAR(64) NOT NULL,
  expiresAt DATETIME NOT NULL,
  lastUsedAt DATETIME NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_guest_order_tokens_hash (tokenHash),
  KEY idx_guest_order_tokens_order (salesOrderId),
  CONSTRAINT fk_guest_order_tokens_order FOREIGN KEY (salesOrderId)
    REFERENCES salesOrders (id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO SequelizeMeta (name) VALUES ('20261103000002-create-guest-order-tokens.js');
```

- **Rollback:**

  ```sql
  DROP TABLE guest_order_tokens;
  ALTER TABLE website_users
    DROP INDEX uq_website_users_guest_token,
    DROP INDEX idx_website_users_guest_email,
    DROP COLUMN linkedWebsiteUserId, DROP COLUMN guestExpiresAt, DROP COLUMN guestTokenHash,
    DROP COLUMN guestEmail, DROP COLUMN isGuest;
  DELETE FROM SequelizeMeta WHERE name IN (
    '20261103000001-add-guest-columns-to-website-users.js',
    '20261103000002-create-guest-order-tokens.js');
  ```

- **Migration files:** Phase 1 adds matching files under `server/src/migrations/` with exactly these names, so `npm run migrate` treats them as already applied. Nothing will run them for you.
- **Charset:** the `CREATE TABLE` sets no charset, so it inherits the database default. That keeps it consistent with existing tables.

---

## 6. Frontend changes (storefront `glitteron/`)

| File | Change |
|---|---|
| `proxy.ts` | **No change.** It gates no routes (account pages redirect on the client), `/checkout` and `/orders/guest` must stay public, and the matcher already runs Clerk on `/api/*`. A guest request carries no `Authorization` header, so Clerk treats it as signed-out and passes it through. |
| `components/checkout/CheckoutClient.tsx` | Replace the hard `useRequireAuth()` wall with a split:<br>• **Signed in:** today's code path, unchanged.<br>• **Signed out:** show a gate with *Sign in* (`/login?redirect_url=/checkout`) and *Continue as guest* (`startGuestSession()`, then the same pricing and sync effects).<br>For guests, also send `contact` to `createCheckout`, prefill Razorpay with the typed email, and after verify go to `/orders/guest#t=${orderAccessToken}` instead of `/orders/{id}`. On `401` from cart or checkout (guest session expired), recreate the session once and retry. |
| `components/checkout/AddressForm.tsx` | Optional `email` field, shown for guests and required client-side. |
| `lib/auth/api.ts` | `createCheckout(address, coupon, contact?)`; `verifyPayment` response gains `orderAccessToken?`. New functions: `startGuestSession`, `endGuestSession`, `lookupGuestOrder(token)`, `recoverGuestOrders(email)`, `claimGuestOrders()`. `authedFetch` is unchanged: same-origin `fetch` already sends the cookie. |
| `app/api/guest/[...proxy]/route.ts` **new** | Copy of the payments proxy, targeting `/api/v1/guest/*`; forwards `cookie` and `set-cookie`. |
| `app/api/cart/route.ts`, `app/api/cart/[...proxy]/route.ts`, `app/api/payments/[...proxy]/route.ts`, guest proxy | Add the `x-client-ip` and `x-proxy-secret` headers. |
| `app/orders/guest/page.tsx` **new** | Server page with metadata `robots: noindex`, `referrer: 'no-referrer'`. A static `guest` segment takes precedence over `orders/[id]`. |
| `components/orders/GuestOrderClient.tsx` **new** | Reads `#t=`, calls `history.replaceState` to strip it, calls `lookupGuestOrder`, and renders the order (reusing the presentational parts of `OrderDetailClient`). Shows a "Find my orders" email form when there is no token or the token is invalid. Shows a "Create an account to keep all orders in one place" link. |
| `components/orders/OrderListClient.tsx` | Once signed in, call `claimGuestOrders()` once before `getWebsiteOrders()`. |
| `components/auth/SessionRestorer.tsx` | On Clerk sign-in, call `endGuestSession()` (fire-and-forget) so a leftover guest cookie doesn't linger. |
| Footer / header (optional) | "Track an order" link to `/orders/guest`. |

**Backend and admin (`glitteron-prod/`)**, for reference:
- **New:** `middleware/websiteAuth.js` gets `requireWebsiteAuthOrGuest` next to the existing middleware, and `src/modules/guest/` holds the routes, session, lookup and recover.
- **Changed:**
  - `cart.routes.js` and `payments.routes.js` mount the new middleware.
  - `PaymentController.checkout`/`verify` handle `contact` and the guest token.
  - `createOrderFromPayment.js` creates the guest `Customer`.
  - `loadPricingContext.js` adds the `isGuest` rule for `perCustomerLimit`.
  - `emailService.js` and `whatsappOrderService.js` take the guest fallbacks.
  - `website-auth.routes.js` gets `claim-guest`.
  - `salesOrderController.js` adds `isGuest` and `guestEmail` to the `websiteUser` include.
  - The admin `client/src/pages/SalesOrderListPage.jsx` shows a "Guest" badge and falls back to `Customer.phone`.

---

## 7. Security checklist

| # | Threat | Mitigation | Phase |
|---|---|---|---|
| S1 | Client tampers with prices | Already handled: the cart is repriced from the DB under row locks, and the amount is fixed on the server Razorpay order. The client sends only ids and quantities. Add a test that a guest checkout ignores client prices. | 1 |
| S2 | Forged payment confirmation | Constant-time HMAC (`crypto.timingSafeEqual` on equal-length buffers; reject a missing or non-string signature). `VerifyPayment` stays scoped to `{razorpayOrderId, websiteUserId}`. | 0 |
| S3 | Forged or replayed webhook | Constant-time HMAC over `req.rawBody`. Check at boot that `RAZORPAY_WEBHOOK_SECRET` is set. Captured amount must equal `payment.amount`, otherwise log CRITICAL and don't fulfil. Idempotency comes from the existing row lock and state checks. | 0 |
| S4 | Stock-reservation DoS (scripted guest checkouts hold all stock) | • Guest session creation: 10/h per IP.<br>• Guest checkout: 10 per 15 min per IP and per guest row.<br>• Per-line quantity cap for guests.<br>• Global cap on open guest checkouts (`COUNT` of PENDING/FAILED guest payments within `reservedUntil`, returning 503 above N).<br>• A guest row holds at most one open payment (existing rule). | 1 |
| S5 | Every rate limit keyed on the Next server's IP | The proxy forwards `x-client-ip` with `x-proxy-secret`; the backend trusts it only when the secret matches. | 1 (backend), 2 (proxies) |
| S6 | Coupon `perCustomerLimit` bypass by starting new guest sessions | Coupons with `perCustomerLimit` require sign-in (`409 "Sign in to use this code"`). Coupons with only `usageLimit` or no limit work for guests. Coupon guessing is capped by the session-creation limit plus the per-IP limit on `/cart/coupon/validate` for guests. | 1 |
| S7 | Guest session token theft | httpOnly, Secure, SameSite=Strict `__Host-` cookie, so JS can't read it and no Domain can be set. Only SHA-256 is stored. 7-day expiry. Cleared after a successful order. It grants only cart and checkout for that guest row: no orders, no refunds, no profile. | 1 |
| S8 | CSRF on cookie-authenticated routes | `SameSite=Strict`, JSON-only bodies (`express.json` ignores `text/plain`), and an `Origin` check against the allowlist on guest-capable POST/PATCH/DELETE. **Remove the reflected-origin CORS block at `app.js:262`**, keeping `cors(corsOptions)`. | 0 (CORS), 1 (Origin check) |
| S9 | Order lookup by guessing an ID | No ID-based guest route exists. Tokens carry 256 bits of entropy, only the hash is stored, and the lookup is by unique hash. Every failure returns the same 404. 30/15 min per IP. | 2 |
| S10 | Order-token leakage (logs, Referer, history, forwarding) | • Token in the URL fragment, stripped on load.<br>• Sent in the body, which `requestLogger` already redacts.<br>• `no-referrer` and `no-store`.<br>• Read-only scope; masked PII on the page; expiry.<br>• Recovery issues fresh tokens. | 2 |
| S11 | "Find my orders" used to bomb inboxes or enumerate emails | Always 200, sent after the response, 3/h per email and 10/h per IP. Sends only to the stored `guestEmail`. | 3 |
| S12 | HTML injection into GlitterOn-branded emails (guest name or address to any inbox) | Escape every interpolated value in `emailService.js`, including the existing `firstName` bug. Length caps via validation. No user text in subjects. Neutral footer: "Didn't place this order? Contact support". | 0 (escape), 1 (caps) |
| S13 | Typed email used to touch a real customer's records | Guest rows keep `email` NULL, so the Clerk claim-by-email can't take them. Guests always get a **new** `Customer`, so the phone overwrite in `createOrderFromPayment` can't touch the B2B ledger. | 1 |
| S14 | Linking takeover | Claim only by the email Clerk **currently** reports as primary and verified (fetched live), only guest rows, one transaction, and no profile fields copied. Planted-order residual risk is in Q4 and the open questions. | 3 |
| S15 | Customer self-refund (existing) | Remove `POST /payments/:id/refund` from the storefront router. Refunds go through admin or the Razorpay dashboard. Never exposed to guests or order tokens. | 0 |
| S16 | Webhook-path orders leave stock reserved or oversold | Shared `finalizePaidPayment` deducts stock and releases the reservation on every path. If stock is gone after capture, the order is still created and logged as CRITICAL for the team (see open questions). | 0 |
| S17 | Large-body DoS on public guest routes | Guest routes reject bodies over 10 KB. The global 50 MB `express.json` is pre-existing; tighten it separately. | 1 |
| S18 | Abandoned guest rows pile up | A daily job deletes guest rows with expired sessions and no payments. Guest rows with orders are kept. | 3 |

---

## 8. What breaks or changes when `req.websiteUser` is a guest

| Place | Today | Change |
|---|---|---|
| `requireWebsiteAuth` users (cart, payments) | Clerk only | Swap to `requireWebsiteAuthOrGuest` on cart, `/payments/checkout` and `/payments/verify` **only**. |
| `/auth/me`, `/auth/orders*`, reviews, visualizer, `GET /payments/:id` | Clerk only | **Stay Clerk-only.** A guest is never `req.websiteUser` there. |
| `CreateCheckout` | `websiteUser.zipCode` fallback, receipt `wu<id>_…` | Works unchanged (a guest has no `zipCode`, so it uses the shipping pincode). The controller stores `contact` on the guest row and in `orderPayload.contact`. |
| `couponLimiter` | keyed per `websiteUserId` | Also keyed per client IP for guests. |
| `loadPricingContext` | counts `perCustomerLimit` per user | `isGuest` makes a `perCustomerLimit` coupon return a new `SIGN_IN_REQUIRED` error. |
| `createOrderFromPayment` | needs `user.customerId`; overwrites `Customer.phone` | For a guest without `customerId`, create a guest `Customer` in the same transaction and set it on the row. |
| `VerifyPayment` / `HandleWebhook` / `reconcileFailedOrders` | only verify finishes the order | All call `finalizePaidPayment`. Verify also issues a guest order token. |
| `emailService.sendOrderConfirmationEmail` | returns early when `user.email` is NULL, which **every guest hits** | Use `user.email \|\| user.guestEmail`. For guests, mint a 365-day order token and add the link. Escape all HTML. Mint the token after commit, so webhook-created orders get a link too. |
| `whatsappOrderService` | uses `Customer.phone`, else `user.phone` | Works (guest `Customer.phone` = shipping phone). Adding a link needs a new Meta template with a URL button (Phase 5). |
| `pdfService` | name from `Customer`, else `websiteUser` | Works. |
| `findPurchase` (reviews) | by `websiteUserId` | Guests can't review, since review routes are Clerk-only. After `claim-guest` the orders count. |
| `GetMyOrders` / `GetOrderById` | by `websiteUserId` | Unchanged. Guest orders show up there after the claim. |
| Admin `salesOrderController` + `client/src/pages/SalesOrderListPage.jsx` | shows `websiteUser.phone` | Include `isGuest` and `guestEmail`; show a "Guest" badge and `Customer.phone` / `guestEmail`. |
| Legacy admin storefront pages (`client/src/pages/website/*`) | own Clerk-era checkout | Untouched. They keep working for signed-in users. |
| `requestLogger` | logs `req.websiteUser?.id` | Works (the guest row id). |
| Storefront `useRequireAuth` in `CheckoutClient` | redirects signed-out shoppers to login | Replaced by the guest/sign-in gate (§6). |

---

## 9. Phases (one PR each, smallest first)

Every backend test lives in `server/tests/`, follows the `websiteAuth.test.js` pattern (mocked models, no DB, no network) and runs with `npm test`. Storefront logic tests use `node --test` and join `npm run check`.

### Phase 0: backend bug fixes (no guest code). PR in `glitteron-prod`
- Add `finalizePaidPayment(payment, razorpayPaymentId, t)`: create the order, deduct stock with a `quantity >= n` guard, decrement `reservedQuantity`, clear the cart, and set PAID. Use it in `VerifyPayment`, `HandleWebhook.handleCaptured` and `reconcileFailedOrders`. In the webhook path, a stock shortfall is logged CRITICAL and does not throw, because the money is already captured.
- Constant-time HMAC compare; startup check for `RAZORPAY_WEBHOOK_SECRET`; captured amount must equal `payment.amount`.
- Remove `POST /payments/:id/refund` from `payments.routes.js` (pending your answer in the open questions).
- Delete the reflected-origin CORS headers at `app.js:262`, keeping the timeout and error handling in that middleware.
- Escape HTML in `emailService.js`.
- **Tests:**
  - `finalizePaidPayment.test.js`: the webhook path deducts stock, releases the reservation and clears the cart; verify then webhook (and webhook then verify) finalises exactly once; a shortfall in the webhook path logs instead of throwing.
  - `razorpaySignature.test.js`: valid, invalid, wrong length, missing and non-string signatures.
  - `webhookAmount.test.js`: an amount mismatch is not fulfilled.
  - `paymentsRoutes.test.js`: the refund route is not mounted.
  - `emailEscape.test.js`: `<script>` in `firstName` is escaped.
- **Manual:** Razorpay test mode. Pay and close the tab before the handler runs. Confirm the order exists, `reservedQuantity` is back to its old value, `quantity` dropped, and the email arrived.

### Phase 1: backend guest checkout, behind `GUEST_CHECKOUT_ENABLED` (default off). PR in `glitteron-prod`
- Migration files (named as in §5) and model fields on `WebsiteUser`; new `GuestOrderToken` model.
- `requireWebsiteAuthOrGuest`; `POST/DELETE /guest/session`; mount the new middleware on cart, checkout and verify.
- `contact` validation; express-validator caps on `shippingAddress`; guest `Customer` creation; `perCustomerLimit` sign-in rule.
- Guest rate limits plus the trusted `x-client-ip`; global open-guest-checkout cap; per-line quantity cap; 10 KB body limit on `/guest`; `Origin` check.
- Order tokens: mint them in verify (in the response) and in the email after commit. `POST /guest/orders/lookup` returns `GuestOrderView`.
- Email: `guestEmail` fallback and order link.
- **Tests:**
  - `guestAuth.test.js`:
    - a Bearer token still goes through the Clerk path;
    - a bad Bearer token returns 401 even when a guest cookie is present;
    - a valid cookie resolves the guest row;
    - expired, inactive and non-guest hashes are rejected;
    - the flag off returns 404.
  - `guestSession.test.js`: token is stored hashed only; cookie flags; an existing valid cookie is reused.
  - `guestCheckout.test.js`:
    - `contact` is required for guests and ignored for Clerk;
    - client prices are ignored;
    - quantity cap, capacity 503, and a `perCustomerLimit` coupon returning 409 "Sign in";
    - a `usageLimit` coupon works for a guest.
  - `createOrderFromPayment.test.js`: a guest gets a new `Customer` even when `customers.email` matches; the existing `Customer` phone is never touched.
  - `guestOrderLookup.test.js`:
    - a valid token returns the masked DTO without the street address, phone or Razorpay ids;
    - expired, unknown and malformed tokens all return the identical 404;
    - the raw token is never stored.
  - `orderEmail.test.js`: a guest gets mail at `guestEmail` with a link; a Clerk user is unchanged.

### Phase 2: storefront guest checkout. PR in `glitteron`
- §6 rows for `CheckoutClient`, `AddressForm`, `lib/auth/api.ts`, the guest proxy, the client-IP headers, `app/orders/guest/page.tsx` and `GuestOrderClient` (lookup only).
- **Tests:** `lib/guestToken.test.mjs` covers the pure fragment parser and strip helper.
- **Manual checks:** at 375 px and 1440 px, with Razorpay test mode, flag on:
  1. Signed-out guest checkout end to end.
  2. Signed-in checkout unchanged.
  3. Expired guest cookie mid-checkout recovers.
  4. The `/orders/guest` link works in a fresh browser.
  5. A tampered token shows the "Find my orders" form.
  6. No token appears in server logs or in the network `Referer` header.
- Then turn the flag on in production.

### Phase 3: recovery, linking, admin, cleanup. PR in `glitteron-prod`
- `POST /guest/orders/recover`, `POST /auth/orders/claim-guest`, the admin badge and `Customer.phone` fallback, and the guest-row cleanup job.
- **Tests:**
  - `guestRecover.test.js`: always 200; sends only to the stored `guestEmail`; rate limits hold; fresh 7-day tokens.
  - `claimGuest.test.js`:
    - uses Clerk's live primary verified email, not `website_users.email`;
    - moves orders, payments and redemptions in one transaction;
    - leaves non-guest rows and other emails alone;
    - is idempotent;
    - an unverified Clerk email claims nothing.
  - `guestCleanup.test.js`: deletes only expired guest rows with no payments.

### Phase 4: storefront recovery + claim. PR in `glitteron`
- The "Find my orders" form in `GuestOrderClient`, `claimGuestOrders()` in `OrderListClient`, `endGuestSession()` in `SessionRestorer`, and an optional footer link.
- **Manual checks:**
  1. Guest order, then sign up with the same email (verified): the order appears in `/orders`.
  2. Sign up with a different email: it does not appear.
  3. Recovery email arrives once and its link works.

### Phase 5 (optional): WhatsApp order link
- A new Meta template with a dynamic URL button whose suffix is `#t=` plus the token. Swap it in `whatsappOrderService` once approved.

---

## 10. Decisions (2026-11-04)

| # | Question | Decision |
|---|---|---|
| 1 | Shopper self-refund endpoint | **Removed** (Phase 0). Refunds go through admin or the Razorpay dashboard. |
| 2 | Hosting | **App Runner.** AWS doesn't document which header carries the shopper's IP there. Phase 2 logs the header names (not values) reaching the Next proxy on first deploy, then picks the header. `PROXY_SHARED_SECRET` is set on both services. |
| 3 | Link lifetimes | 365 days for confirmation links, 7 days for recovery links. |
| 4 | Guest limits | 20 per line; 30 open guest checkouts at once. |
| 5 | Linking | Attach as soon as Clerk reports the same verified email. |
| 6 | Coupons | Coupons with a per-customer limit require sign-in; all others work for guests. |
| 7 | Oversell after capture | **Create the order and alert the team** (`logger.error`, which reaches Telegram). It applies on verify too: verify no longer returns 409. |
| 8 | Email required for guests | Yes. |
| 9 | Razorpay webhook (`payment.captured`, `payment.failed`) + auto-capture | Confirmed configured. |
| 10 | Magic Checkout | Skipped. |
| 11 | Choice screen at checkout (2026-11-04) | **None.** Signed-out shoppers go straight into guest checkout. Signed-in shoppers keep today's checkout. Sign-in stays available from the header. While the backend has guest checkout off (`/guest/session` returns 404), `/checkout` sends signed-out shoppers to `/login` as before, so the storefront can ship ahead of the backend flag. |

## Sources

- Razorpay: [Standard Checkout options](https://razorpay.com/docs/payment-gateway/web-integration/standard/checkout-options) · [Node.js integration steps](https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration) · [Saved cards / customer_id](https://razorpay.com/docs/payments/payment-methods/cards/features/integrate-saved-cards) · [Webhook best practices](https://razorpay.com/docs/webhooks/best-practices.md) · [Order webhooks (order.paid)](https://razorpay.com/docs/webhooks/orders.md) · [Payment webhook payloads](https://razorpay.com/docs/webhooks/payloads/payments/) · [Magic Checkout web](https://razorpay.com/docs/payments/magic-checkout/web) · [Magic Checkout integration guide](https://razorpay.com/docs/developer-tools/integrations/magic-checkout/)
- Design input: an architect agent review (design choice, endpoints, DDL) and a security-reviewer agent threat model (S1–S18, the CORS and refund findings), both checked against the code above.

---

## 11. Build notes (where the code differs from the plan)

**Phase 1 (2026-11-04).**

- **Deploy order:** run the §5 SQL **before** deploying Phase 1. The `WebsiteUser` model now names the new columns, so without them every query on `website_users`, including Clerk sign-in, fails with "Unknown column".
- **Switching it on:** guest checkout turns on only when `GUEST_CHECKOUT_ENABLED=true`, `PROXY_SHARED_SECRET` and `WEBSITE_URL` (`https://www.litmeup.in`) are all set. With the flag on but a variable missing, it stays off and logs an error. Without the secret, every shopper would share one rate-limit bucket.
- **Origin check moves to Phase 2.** The Next proxies call the backend server-to-server and don't forward the browser's `Origin`, so the backend can't check it. The guest proxy route (`app/api/guest/[...proxy]`) and the cart/payments proxies will reject state-changing requests whose `Origin` isn't the storefront. Meanwhile the `SameSite=Strict` cookie already stops cross-site requests from carrying the session.
- **Address rules:**
  - Strict for guests only: name, full address, 6-digit pincode.
  - Signed-in shoppers only get a 255-character cap per field.
  - The admin repo's legacy `client/src/pages/website/CheckoutPage.jsx` sends `addressLine`, not `addressLine1`, so its orders already lose the street line (`createOrderFromPayment.buildAddress`). Requiring `addressLine1` for everyone would have broken that page. That bug predates this work and is not fixed here.
- **Not built:**
  - `orderPayload.contact`: the guest row holds the name and email, and one session is one order.
  - A per-guest-row checkout limit: the per-IP limit plus the existing one-open-payment rule cover it.
- **Body limit:** `/api/v1/guest` is parsed with its own 10 KB `express.json` ahead of the global 50 MB parser.
- **Coupon message:** "Sign in to use this code" shows only for a coupon that would otherwise apply, so it reveals nothing about which codes exist.
- **Guest checkout limit:** lowered to **5 per 15 minutes per IP** (planned 10) after the security review. That is also the most stock holds one IP can keep. Filling the 30-checkout guest cap now takes 6+ IPs, and only guests would see the 503. If that is ever seen, store the IP on the guest row and cap open checkouts per IP.
- **IP keys:** IPv6 counts per /64 and IPv4-mapped addresses count as plain IPv4. A guest request with a missing or wrong `x-proxy-secret` logs an error, which reaches Telegram.

**Phase 2 (2026-11-04).**

- **Origin check:** `lib/api/proxyGuard.ts` refuses POST/PATCH/DELETE whose `Origin` host differs from `Host` (403). It runs in the cart, payments and guest proxies. Requests with no `Origin` pass, because only browsers carry a shopper's cookie.
- **Shopper IP:** the IP sent to the backend is the **last** `x-forwarded-for` hop; earlier hops can be typed by the client. Each proxy logs request header names (never values) and the hop count once per process. Check the App Runner log line `[api-proxy] request header names` before switching the flag on: if the last hop is an internal App Runner address, `clientIpFrom` must change, or every guest shares one rate-limit bucket. Delete `logEdgeHeadersOnce` once confirmed.
- **Refreshing the order page:** the token is stripped from the address bar and kept in `sessionStorage` for that tab, so a refresh still works.
- **Not built in Phase 2:**
  - The "Find my orders" form; the invalid-link page points to Contact until Phase 4.
  - `endGuestSession` on sign-in and the claim call; both are Phase 4.
  - The page doesn't promise account linking yet.
- **Verified locally:**
  - Production build passes; type check is clean; 85 storefront checks pass.
  - Against a throwaway mock backend: the gate, the guest form with email, the session cookie (`__Host-`, HttpOnly, Secure, Strict) relayed and stored, IP and secret headers forwarded, the order page rendered, the fragment stripped, a refresh kept working, and an invalid link showed the expired page. Checked at 375 px and 1440 px.
- **Not verified yet:** a real Razorpay test-mode payment as a guest. It needs the §5 SQL and the backend flag on.

**Phase 3 (2026-11-04).**

- **Recovery (`POST /api/v1/guest/orders/recover {email}`):** replies `200` before any lookup, so nothing about which emails have orders shows in the reply or its timing. A malformed email gets `400`.
  - Limits: 10 per hour per IP and 3 per hour per address, normalised the same way as the stored email.
  - Sends fresh 7-day links for the 10 newest orders, only to the stored `guestEmail`.
  - Older links are not revoked, so the 365-day confirmation link keeps working.
  - It returns 404 while the flag is off, like every guest route.
- **Claiming (`POST /api/v1/auth/orders/claim-guest`, Clerk):** uses the email Clerk reports as primary and verified at that moment. In one transaction it:
  - moves `salesOrders` and `website_payments`. Coupon redemptions stay on the guest row: guests can't use per-customer-limited coupons, so moving them could only count someone else's order against the account (security review);
  - deletes the guest carts;
  - deactivates the guest rows and links them to the account.
  - It skips any guest row with a payment still inside its reservation window (that shopper is in Razorpay Checkout right now); the next claim picks it up.
  - It works with the flag off, so existing guest orders can still join an account.
- **Cleanup job (`purgeExpiredGuests`, daily 03:30):** deletes up to 1,000 expired, unclaimed guest rows, oldest first, that no payment, order, redemption, review, visualizer-usage or refresh-token row points at. Their `cart_items` go by cascade. Claimed rows are kept as the record of the claim.
- **Accepted from the security review:**
  - Claiming during your own still-open guest checkout ends that guest session.
  - The 3-per-hour limit per email can be spent by someone else, delaying recovery by an hour; this is the cost of stopping mail floods.
  - An unverified guest email can put an order into the account that later verifies that email (§2 Q4).
- **Admin:** the orders list shows a "Guest" badge and the guest email. The phone falls back to `Customer.phone`, which is where website orders store the checkout phone.
- **Verified:** 366 tests pass. The cleanup SQL was printed from Sequelize with a stubbed query function (no DB), and the `WebsiteUser` alias in the raw `NOT EXISTS` matches.

**Phase 4 (2026-11-04).**

- **`/orders/guest` without a valid link:** now titled "Find your orders", with an email form that calls `recover`. It shows the backend's same-either-way reply. A 429 shows its message, and a 404 (flag off) says to contact us. The order view now says that an account with the same email keeps every order in one place.
- **Claiming:** `OrderListClient` calls `claim-guest` once per visit before the first page of orders loads. A failed claim doesn't block the list and is retried on the next visit. Claiming happens only there, so it is not a Clerk API call on every page load.
- **Ending the guest session:** checkout leaves a `localStorage` mark when it starts a guest session, and `SessionRestorer` ends that session on sign-in only when the mark is there. This is best effort; the backend expires the session within 7 days anyway.
- **Verified:**
  - Build passes; type check is clean; 86 storefront checks pass.
  - Against the mock backend: bad email shows an error, good email shows the generic reply, exactly one recover call. Checked at 375 px and 1440 px.
- **Not verified in a browser:** the claim and the sign-in cleanup. Both need a Clerk sign-in, which the headless browser can't do. The backend side of the claim is covered by `tests/guestRecovery.test.js`.
