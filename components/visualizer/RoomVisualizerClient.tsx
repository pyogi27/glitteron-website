// components/visualizer/RoomVisualizerClient.tsx
'use client'
import { useEffect } from 'react'
import { useVisualizerStore } from '@/lib/stores/visualizerStore'
import StepBar from './StepBar'
import RoomTypeStep from './RoomTypeStep'
import UploadStep from './UploadStep'
import ProductPanel from './ProductPanel'
import CanvasArea from './CanvasArea'
import RightPanel from './RightPanel'

export default function RoomVisualizerClient() {
  const step = useVisualizerStore((s) => s.step)

  // Reset store when leaving the page
  useEffect(() => {
    return () => useVisualizerStore.getState().resetAll()
  }, [])

  // Steps 1 & 2: full-screen centered steps (no 3-panel layout)
  const isSetupStep = step <= 2

  return (
    <div
      className="flex flex-col overflow-hidden pt-[72px]"
      style={{ height: '100dvh' }}
    >
      <StepBar />

      {/* Setup steps (Room Type + Upload) */}
      {isSetupStep && (
        <div className="flex-1 overflow-hidden flex">
          {step === 1 && <RoomTypeStep />}
          {step === 2 && <UploadStep />}
        </div>
      )}

      {/* 3-panel layout (Analyse → Select → Visualise) */}
      {!isSetupStep && (
        <div
          className="flex-1 overflow-hidden"
          style={{ display: 'grid', gridTemplateColumns: '272px 1fr 224px' }}
        >
          <ProductPanel />
          <CanvasArea />
          <RightPanel />
        </div>
      )}
    </div>
  )
}
