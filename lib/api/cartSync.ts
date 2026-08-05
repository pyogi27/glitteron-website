import {
  getServerCart,
  addToServerCart,
  updateServerCartItem,
  removeServerCartItem,
  type ServerCartItem,
} from '@/lib/auth/api'
import type { CartItem } from '@/lib/stores/cartStore'

/**
 * Reconcile the local cart onto the server without destroying it first.
 *
 * The previous approach was `clearServerCart()` then a loop of `addToServerCart()`. Two
 * problems, both of which cost real money:
 *
 *   1. DATA LOSS. If any add failed mid-loop the cart was left partly destroyed, and the
 *      caller's `catch {}` silently fell back to locally computed totals — so the shopper
 *      saw a plausible number for a cart that no longer existed server-side.
 *   2. TIMESTAMP CHURN. Every cart-page visit deleted and recreated all rows, resetting
 *      `createdAt`, which is what any future abandoned-cart job would read.
 *
 * The subtlety that makes a naive "just stop clearing" fix wrong: `AddToCart.usecase.js`
 * INCREMENTS quantity on an existing row (`existing.quantity + quantity`). The upfront
 * clear was hiding that. Remove the clear and re-syncing a line of quantity 2 leaves 4.
 * So the reconcile has to SET quantities absolutely via `UpdateCartItem`, which does
 * `item.update({ quantity })`, and only POST genuinely new lines.
 *
 *   local cart                server cart              action
 *   ----------                -----------              ------
 *   present, qty 3     <->    present, qty 1           PATCH  -> qty 3   (absolute)
 *   present, qty 2     <->    absent                   POST   -> qty 2
 *   absent             <->    present                  DELETE
 *   present, qty 2     <->    present, qty 2           none (no write at all)
 *
 * Nothing is removed before its replacement exists, and an unchanged cart issues zero
 * writes — so merely opening the cart page no longer rewrites every row.
 *
 * THROWS on any failure. Callers decide what that means: the cart page shows a retry
 * banner, checkout blocks before taking payment. Deliberately no try/catch in here —
 * swallowing the error is the bug this replaces.
 */

/** A local cart line that resolved to a backend product id. */
export interface SyncableItem {
  resolvedId: number
  productVariationId?: number
  quantity: number
}

export interface CartDiff {
  toUpdate: { cartItemId: number; quantity: number }[]
  toCreate: { productId: number; productVariationId: number | null; quantity: number }[]
  toDelete: number[]
  /** True when the server already matches, so no requests are needed. */
  noop: boolean
}

/** Identity key. Mirrors the backend's dedupe: (productId, productVariationId ?? null). */
function keyOf(productId: number, variationId: number | null | undefined): string {
  return `${productId}:${variationId ?? 'null'}`
}

/**
 * Pure. Given the local lines and what the server currently holds, work out the minimum
 * set of writes. No I/O, so this is unit-testable without a running backend.
 */
export function computeCartDiff(
  local: SyncableItem[],
  server: ServerCartItem[],
): CartDiff {
  const serverByKey = new Map<string, ServerCartItem>()
  for (const row of server) {
    serverByKey.set(keyOf(row.productId, row.productVariationId), row)
  }

  const toUpdate: CartDiff['toUpdate'] = []
  const toCreate: CartDiff['toCreate'] = []
  const seen = new Set<string>()

  for (const item of local) {
    const key = keyOf(item.resolvedId, item.productVariationId)
    // Two local lines mapping to one server row would fight each other; the first wins
    // and the second is folded in, matching how the backend dedupes.
    if (seen.has(key)) {
      const already = toUpdate.find(u => u.cartItemId === serverByKey.get(key)?.id)
      if (already) already.quantity += item.quantity
      const pending = toCreate.find(
        c => keyOf(c.productId, c.productVariationId) === key,
      )
      if (pending) pending.quantity += item.quantity
      continue
    }
    seen.add(key)

    const existing = serverByKey.get(key)
    if (!existing) {
      toCreate.push({
        productId: item.resolvedId,
        productVariationId: item.productVariationId ?? null,
        quantity: item.quantity,
      })
    } else if (existing.quantity !== item.quantity) {
      toUpdate.push({ cartItemId: existing.id, quantity: item.quantity })
    }
    // Equal quantities: no write.
  }

  const toDelete = server
    .filter(row => !seen.has(keyOf(row.productId, row.productVariationId)))
    .map(row => row.id)

  return {
    toUpdate,
    toCreate,
    toDelete,
    noop: toUpdate.length === 0 && toCreate.length === 0 && toDelete.length === 0,
  }
}

/**
 * Apply a diff. Order matters: updates and creates run before deletes, so the cart is
 * never transiently emptier than the shopper's actual selection — a concurrent
 * `CreateCheckout` reading mid-sync must never see a short cart.
 */
export async function applyCartDiff(diff: CartDiff): Promise<void> {
  for (const u of diff.toUpdate) {
    await updateServerCartItem(u.cartItemId, u.quantity)
  }
  for (const c of diff.toCreate) {
    await addToServerCart(c.productId, c.productVariationId, c.quantity)
  }
  for (const id of diff.toDelete) {
    await removeServerCartItem(id)
  }
}

/**
 * Resolve local cart lines to backend product ids.
 *
 * `apiProductId` is set on API-sourced products; `productId` is a stringified numeric id
 * for those and a synthetic literal (`"p1"`) for the static catalogue, which has no
 * backend row and is therefore unsyncable.
 */
export function toSyncable(items: CartItem[]): SyncableItem[] {
  return items.flatMap<SyncableItem>(i => {
    const resolvedId = i.apiProductId ?? (parseInt(i.productId) || undefined)
    if (resolvedId == null) return []
    return [{ resolvedId, productVariationId: i.productVariationId, quantity: i.quantity }]
  })
}

/**
 * Reconcile local cart state onto the server. Throws on failure.
 *
 * Returns the diff that was applied so callers can tell "nothing needed doing" from
 * "wrote successfully" without another round trip.
 */
export async function syncCartToServer(items: CartItem[]): Promise<CartDiff> {
  const local = toSyncable(items)
  const { items: server } = await getServerCart()
  const diff = computeCartDiff(local, server)
  if (!diff.noop) await applyCartDiff(diff)
  return diff
}
