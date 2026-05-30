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
}

interface CartItemIdentity {
  productId: string;
  size?: string;
  finish?: string;
}

function matchesItem(item: CartItem, identity: CartItemIdentity) {
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
          const existing = s.items.find(
            (i) =>
              i.productId === item.productId &&
              i.size === item.size &&
              i.finish === item.finish,
          );
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === item.productId &&
                i.size === item.size &&
                i.finish === item.finish
                  ? { ...i, quantity: i.quantity + item.quantity }
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
