import { create } from 'zustand'

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
  priceRange: [2000, 50000],
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
      priceRange: [2000, 50000],
      sortBy: 'featured',
      viewMode: 'grid',
    }),
}))
