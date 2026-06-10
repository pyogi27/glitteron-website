// lib/stores/visualizerStore.ts
import { create } from 'zustand'
import type { VisualizerProduct, RoomAnalysis, RoomType } from '@/lib/data/visualizer'

// Step 3 (Analyse) removed — flow is: 1=RoomType 2=Upload 4=Select 5=Visualise 6=Generate
export type VisualizerStep = 1 | 2 | 4 | 5 | 6

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
  imageUrl: string | null       // object URL for <img> display
  imageDataUrl: string | null   // base64 data URL sent to API
  isDemo: boolean

  // Analysis (kept for ProductPanel display; populated with mock data)
  analysisData: RoomAnalysis | null
  products: VisualizerProduct[]

  // Fixture selection & placement
  selectedProduct: VisualizerProduct | null
  placedProductIds: number[]

  // AI Generation (step 6)
  generatedImageUrl: string | null
  generationError: string | null
  isGenerating: boolean

  // Share
  shareId: string | null
  shareUrl: string | null
  isSharing: boolean
  shareError: string | null

  // Fine-tune controls
  litVal: number
  opVal: number
  cordVal: number
  manVal: number
  nudgeVal: number
  showCone: boolean

  // Perspective data
  perspData: PerspData | null

  // Actions
  setStep: (step: VisualizerStep) => void
  setRoomType: (roomType: RoomType) => void
  setImage: (url: string, dataUrl: string | null, isDemo: boolean) => void
  setAnalysis: (data: RoomAnalysis, products: VisualizerProduct[]) => void
  setSelectedProduct: (product: VisualizerProduct | null) => void
  addPlacedProduct: (id: number) => void
  removePlacedProduct: (id: number) => void
  setGeneratedImage: (url: string) => void
  setGenerationError: (error: string | null) => void
  setIsGenerating: (v: boolean) => void
  setShareResult: (id: string, url: string) => void
  setShareError: (error: string | null) => void
  setIsSharing: (v: boolean) => void
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
  imageDataUrl: null,
  isDemo: false,
  analysisData: null,
  products: [],
  selectedProduct: null,
  placedProductIds: [],
  generatedImageUrl: null,
  generationError: null,
  isGenerating: false,
  shareId: null,
  shareUrl: null,
  isSharing: false,
  shareError: null,
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

  // Upload → go directly to step 4 (Select), skip step 3
  setImage: (url, dataUrl, isDemo) =>
    set({ imageUrl: url, imageDataUrl: dataUrl, isDemo, step: 4 }),

  setAnalysis: (analysisData, products) => set({ analysisData, products }),
  setSelectedProduct: (selectedProduct) => set({ selectedProduct }),
  addPlacedProduct: (id) =>
    set((s) => ({
      placedProductIds: s.placedProductIds.includes(id)
        ? s.placedProductIds
        : [...s.placedProductIds, id],
    })),
  removePlacedProduct: (id) =>
    set((s) => ({ placedProductIds: s.placedProductIds.filter((pid) => pid !== id) })),

  setGeneratedImage: (generatedImageUrl) =>
    set({ generatedImageUrl, step: 6, isGenerating: false, generationError: null }),
  // Clearing the error (null) must not touch isGenerating — it is called
  // right after setIsGenerating(true) when a new generation starts.
  setGenerationError: (generationError) =>
    set(generationError === null
      ? { generationError }
      : { generationError, isGenerating: false }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  setShareResult: (shareId, shareUrl) =>
    set({ shareId, shareUrl, isSharing: false, shareError: null }),
  // Same rule as setGenerationError: clearing (null) must not reset isSharing.
  setShareError: (shareError) =>
    set(shareError === null
      ? { shareError }
      : { shareError, isSharing: false }),
  setIsSharing: (isSharing) => set({ isSharing }),

  setLitVal: (litVal) => set({ litVal }),
  setOpVal: (opVal) => set({ opVal }),
  setCordVal: (cordVal) => set({ cordVal }),
  setManVal: (manVal) => set({ manVal }),
  setNudgeVal: (nudgeVal) => set({ nudgeVal }),
  toggleCone: () => set((s) => ({ showCone: !s.showCone })),
  setPerspData: (perspData) => set({ perspData }),

  resetControls: () =>
    set({ litVal: 60, opVal: 95, cordVal: 50, manVal: 0, nudgeVal: 0, showCone: true }),

  resetAll: () => set(initialState),
}))
