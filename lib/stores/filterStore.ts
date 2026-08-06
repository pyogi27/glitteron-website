import { create } from 'zustand'

/**
 * Slider bounds. The live catalogue spans ₹185–₹379,500 (median ₹10,600, p90
 * ₹46,800 as of 2026-08-05), so a track that reached the true maximum would
 * cram 90% of products into its first eighth. The ceiling instead means "no
 * upper limit": at PRICE_CEILING the maxPrice param is dropped, so the handful
 * of items above it still show.
 */
export const PRICE_FLOOR = 0
export const PRICE_CEILING = 100000
export const PRICE_STEP = 1000

interface FilterStore {
  activeTab: string
  materials: string[]
  rooms: string[]
  priceRange: [number, number]
  sortBy: string
  viewMode: 'grid' | 'list'
  lightOn: boolean
  setLightOn: (on: boolean) => void
  setActiveTab: (tab: string) => void
  toggleMaterial: (material: string) => void
  toggleRoom: (room: string) => void
  setPriceRange: (range: [number, number]) => void
  setSortBy: (sort: string) => void
  setViewMode: (mode: 'grid' | 'list') => void
  clearAll: () => void
}

export const useFilterStore = create<FilterStore>()((set) => ({
  activeTab: 'All',
  materials: [],
  rooms: [],
  priceRange: [PRICE_FLOOR, PRICE_CEILING],
  sortBy: 'featured',
  viewMode: 'grid',
  lightOn: false,
  setLightOn: (on) => set({ lightOn: on }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleMaterial: (material) =>
    set((s) => ({
      materials: s.materials.includes(material)
        ? s.materials.filter((m) => m !== material)
        : [...s.materials, material],
    })),
  toggleRoom: (room) =>
    set((s) => ({
      rooms: s.rooms.includes(room)
        ? s.rooms.filter((r) => r !== room)
        : [...s.rooms, room],
    })),
  setPriceRange: (range) => set({ priceRange: range }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setViewMode: (mode) => set({ viewMode: mode }),
  clearAll: () =>
    set({
      activeTab: 'All',
      materials: [],
      rooms: [],
      priceRange: [PRICE_FLOOR, PRICE_CEILING],
      sortBy: 'featured',
      viewMode: 'grid',
    }),
}))
