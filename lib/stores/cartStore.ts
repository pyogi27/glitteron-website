import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  size: string
  finish: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((s) => {
          const existing = s.items.find(
            (i) => i.productId === item.productId && i.size === item.size && i.finish === item.finish
          )
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === item.productId && i.size === item.size && i.finish === item.finish
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...s.items, item] }
        }),
      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== id) })),
      updateQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.productId === id ? { ...i, quantity: qty } : i
          ),
        })),
      clearCart: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'glitteron-cart' }
  )
)
