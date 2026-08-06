// components/visualizer/RoomVisualizerClient.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useVisualizerStore } from '@/lib/stores/visualizerStore'
import { useAuthStore } from '@/lib/stores/authStore'
import StepBar from './StepBar'
import RoomTypeStep from './RoomTypeStep'
import UploadStep from './UploadStep'
import ProductPanel from './ProductPanel'
import CanvasArea from './CanvasArea'
import RightPanel from './RightPanel'

export default function RoomVisualizerClient() {
  const step = useVisualizerStore((s) => s.step)
  const router = useRouter()
  const pathname = usePathname()
  const [authChecked, setAuthChecked] = useState(false)

  // Sign-in required — wait up to 600ms for SessionRestorer to hydrate the store.
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!useAuthStore.getState().accessToken) {
        router.replace(`/login?return=${pathname}`)
      } else {
        setAuthChecked(true)
      }
    }, 600)
    return () => clearTimeout(timeout)
  }, [router, pathname])

  // Reset store when leaving the page
  useEffect(() => {
    return () => useVisualizerStore.getState().resetAll()
  }, [])

  if (!authChecked) return null

  // Steps 1 & 2: full-screen centered steps (no 3-panel layout)
  const isSetupStep = step <= 2

  return (
    <div
      className="flex flex-col overflow-hidden pt-header"
      // ponytail: box-border keeps pt-header inside 100dvh instead of overflowing it
      style={{ height: '100dvh', boxSizing: 'border-box' }}
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
