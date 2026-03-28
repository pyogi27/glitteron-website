// lib/stores/visualizerStore.ts
import { create } from 'zustand'
import type { VisualizerProduct, RoomAnalysis, RoomType } from '@/lib/data/visualizer'

export type VisualizerStep = 1 | 2 | 3 | 4 | 5
// Step meaning: 1=RoomType, 2=Upload, 3=Analyse, 4=Select, 5=Visualise

export interface PerspData {
  dScale: number
  dr: number
  conv: number
}

interface VisualizerState {
  // Flow
  step: VisualizerStep
  roomType: RoomType | null

  // Image
  imageUrl: string | null
  isDemo: boolean

  // Analysis (populated after scan)
  analysisData: RoomAnalysis | null
  products: VisualizerProduct[]

  // Fixture selection & placement
  selectedProduct: VisualizerProduct | null
  placedProductIds: number[] // products currently on canvas

  // Fine-tune controls (read by CanvasArea to re-render fixture)
  litVal: number    // 0-100
  opVal: number     // 30-100
  cordVal: number   // 0-100
  manVal: number    // -50 to 50
  nudgeVal: number  // -0.45 to 0.65 (zoom nudge)
  showCone: boolean

  // Perspective data (written by CanvasArea, read by RightPanel)
  perspData: PerspData | null

  // Actions
  setStep: (step: VisualizerStep) => void
  setRoomType: (roomType: RoomType) => void
  setImage: (url: string, isDemo: boolean) => void
  setAnalysis: (data: RoomAnalysis, products: VisualizerProduct[]) => void
  setSelectedProduct: (product: VisualizerProduct | null) => void
  addPlacedProduct: (id: number) => void
  removePlacedProduct: (id: number) => void
  setLitVal: (v: number) => void
  setOpVal: (v: number) => void
  setCordVal: (v: number) => void
  setManVal: (v: number) => void
  setNudgeVal: (v: number) => void
  toggleCone: () => void
  setPerspData: (data: PerspData) => void
  resetControls: () => void
  resetAll: () => void
}

const initialState = {
  step: 1 as VisualizerStep,
  roomType: null,
  imageUrl: null,
  isDemo: false,
  analysisData: null,
  products: [],
  selectedProduct: null,
  placedProductIds: [],
  litVal: 60,
  opVal: 95,
  cordVal: 50,
  manVal: 0,
  nudgeVal: 0,
  showCone: true,
  perspData: null,
}

export const useVisualizerStore = create<VisualizerState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setRoomType: (roomType) => set({ roomType, step: 2 }),
  setImage: (url, isDemo) => set({ imageUrl: url, isDemo, step: 3 }),
  setAnalysis: (analysisData, products) => set({ analysisData, products, step: 4 }),
  setSelectedProduct: (selectedProduct) => set({ selectedProduct }),
  addPlacedProduct: (id) => set((s) => ({
    placedProductIds: s.placedProductIds.includes(id) ? s.placedProductIds : [...s.placedProductIds, id],
  })),
  removePlacedProduct: (id) => set((s) => ({
    placedProductIds: s.placedProductIds.filter((pid) => pid !== id),
  })),
  setLitVal: (litVal) => set({ litVal }),
  setOpVal: (opVal) => set({ opVal }),
  setCordVal: (cordVal) => set({ cordVal }),
  setManVal: (manVal) => set({ manVal }),
  setNudgeVal: (nudgeVal) => set({ nudgeVal }),
  toggleCone: () => set((s) => ({ showCone: !s.showCone })),
  setPerspData: (perspData) => set({ perspData }),

  resetControls: () => set({
    litVal: 60,
    opVal: 95,
    cordVal: 50,
    manVal: 0,
    nudgeVal: 0,
    showCone: true,
  }),

  resetAll: () => set(initialState),
}))
