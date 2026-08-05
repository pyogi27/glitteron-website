import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size: string;
  finish: string;
  apiProductId?: number;
  /**
   * The resolved ProductVariation id, when the shopper's size/finish pick matched a
   * real variation row. This is what makes the backend price from `variation.price`
   * instead of falling back to the parent `product.price`.
   *
   * Optional on purpose: carts already persisted in localStorage predate this field,
   * and products without variations legitimately have none.
   */
  productVariationId?: number;
}

interface CartItemIdentity {
  productId: string;
  size?: string;
  finish?: string;
  productVariationId?: number;
}

/**
 * Cart line identity.
 *
 *   both sides have a variation id  ──▶ compare ids (authoritative)
 *   either side lacks one           ──▶ compare productId + size + finish strings
 *
 * The string path is the legacy fallback: it keeps carts that were persisted before
 * variation ids existed working, and it is the only option for products with no
 * variations. Ids win when available because a display string can be relabelled in the
 * admin panel, which would otherwise split one cart line into two.
 */
function matchesItem(item: CartItem, identity: CartItemIdentity) {
  if (item.productVariationId != null && identity.productVariationId != null) {
    return item.productVariationId === identity.productVariationId;
  }
  const sameProduct = item.productId === identity.productId;
  const sameSize = identity.size === undefined || item.size === identity.size;
  const sameFinish =
    identity.finish === undefined || item.finish === identity.finish;
  return sameProduct && sameSize && sameFinish;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (identity: CartItemIdentity) => void;
  updateQty: (identity: CartItemIdentity, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((s) => {
          // Reuse matchesItem so add/remove/update agree on what "the same line" is.
          // This used to be an inlined copy of the same comparison, which meant the
          // variation-id rule had to be taught in two places.
          const identity: CartItemIdentity = {
            productId: item.productId,
            size: item.size,
            finish: item.finish,
            productVariationId: item.productVariationId,
          };
          const existing = s.items.find((i) => matchesItem(i, identity));
          if (existing) {
            return {
              items: s.items.map((i) =>
                matchesItem(i, identity)
                  ? {
                      ...i,
                      quantity: i.quantity + item.quantity,
                      // Backfill the id on a legacy line the first time it is re-added,
                      // so it stops relying on the string fallback.
                      productVariationId:
                        i.productVariationId ?? item.productVariationId,
                    }
                  : i,
              ),
            };
          }
          return { items: [...s.items, item] };
        }),
      removeItem: (identity) =>
        set((s) => ({
          items: s.items.filter((i) => !matchesItem(i, identity)),
        })),
      updateQty: (identity, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            matchesItem(i, identity) ? { ...i, quantity: qty } : i,
          ),
        })),
      clearCart: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "litmeup-cart" },
  ),
);
