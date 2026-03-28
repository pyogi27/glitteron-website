// components/product/RoomVisualizerModal.tsx
'use client'
import { useEffect, useRef, useCallback, useState } from 'react'
import type { RoomType, VisualizerProduct } from '@/lib/data/visualizer'
import { ROOM_IMAGE_MAP } from '@/lib/data/visualizer'

// ─── Perspective calculation (same constants as CanvasArea) ──────────────────
const VP_YR = 0.18
const VP_XR = 0.5

function calcPerspective(x: number, y: number, W: number, H: number) {
  const vpY = H * VP_YR
  const vpX = W * VP_XR
  const dy = Math.max(0, y - vpY)
  const dr = Math.max(0, Math.min(1, dy / (H - vpY)))
  const dScale = 0.45 + dr * 0.55
  const px = vpX + (x - vpX) * (0.65 + dr * 0.35)
  return { dScale, px }
}

// ─── Fixture overlay (simplified: drag only, no light cone controls) ─────────
function FixtureOverlay({
  product,
  wrapRef,
  nudgeVal,
}: {
  product: VisualizerProduct
  wrapRef: React.RefObject<HTMLDivElement>
  nudgeVal: number
}) {
  const fxRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: 0, y: 0 })

  const applyPos = useCallback(
    (x: number, y: number) => {
      const wrap = wrapRef.current
      const fx = fxRef.current
      if (!wrap || !fx) return
      const { dScale, px } = calcPerspective(x, y, wrap.offsetWidth, wrap.offsetHeight)
      const tot = Math.max(0.28, Math.min(1.9, dScale + nudgeVal))
      fx.style.left = `${px - (product.iw * tot) / 2}px`
      fx.style.top = `${y - 16}px`
      fx.style.transform = `scale(${tot})`
    },
    [wrapRef, product.iw, nudgeVal],
  )

  // Initial placement — top center
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const x = wrap.offsetWidth * 0.5
    const y = wrap.offsetHeight * 0.22
    posRef.current = { x, y }
    applyPos(x, y)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-apply when nudge changes
  useEffect(() => {
    const { x, y } = posRef.current
    if (x === 0 && y === 0) return
    applyPos(x, y)
  }, [nudgeVal, applyPos])

  // Drag
  useEffect(() => {
    const fx = fxRef.current
    const wrap = wrapRef.current
    if (!fx || !wrap) return

    const startDrag = (startX: number, startY: number) => {
      const wr = wrap.getBoundingClientRect()
      const er = fx.getBoundingClientRect()
      const ox = er.left - wr.left + er.width / 2
      const oy = er.top - wr.top

      const move = (cx: number, cy: number) => {
        const nx = Math.max(40, Math.min(wrap.offsetWidth - 40, ox + cx - startX))
        const ny = Math.max(5, Math.min(wrap.offsetHeight * 0.72, oy + cy - startY))
        posRef.current = { x: nx, y: ny }
        applyPos(nx, ny)
      }
      const end = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.removeEventListener('touchmove', onTouchMove)
        document.removeEventListener('touchend', onTouchEnd)
      }
      const onMouseMove = (e: MouseEvent) => move(e.clientX, e.clientY)
      const onMouseUp = end
      const onTouchMove = (e: TouchEvent) => { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY) }
      const onTouchEnd = end

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      document.addEventListener('touchmove', onTouchMove, { passive: false })
      document.addEventListener('touchend', onTouchEnd)
    }

    const onMouseDown = (e: MouseEvent) => { e.preventDefault(); startDrag(e.clientX, e.clientY) }
    const onTouchStart = (e: TouchEvent) => startDrag(e.touches[0].clientX, e.touches[0].clientY)

    fx.addEventListener('mousedown', onMouseDown)
    fx.addEventListener('touchstart', onTouchStart, { passive: true })
    return () => {
      fx.removeEventListener('mousedown', onMouseDown)
      fx.removeEventListener('touchstart', onTouchStart)
    }
  }, [wrapRef, applyPos])

  return (
    <div
      ref={fxRef}
      style={{ position: 'absolute', cursor: 'grab', userSelect: 'none' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.full}
        alt={product.name}
        width={product.iw}
        draggable={false}
        style={{
          display: 'block',
          filter: 'drop-shadow(0 6px 18px rgba(28,27,25,0.25))',
          pointerEvents: 'none',
        }}
        onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0.3')}
      />
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────
interface RoomVisualizerModalProps {
  product: VisualizerProduct
  roomTypes: RoomType[]
  onClose: () => void
}

export default function RoomVisualizerModal({ product, roomTypes, onClose }: RoomVisualizerModalProps) {
  const [activeRoom, setActiveRoom] = useState<RoomType>(roomTypes[0])
  const [nudgeVal, setNudgeVal] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Reset fixture position when room tab changes
  const [fixtureKey, setFixtureKey] = useState(0)
  const handleRoomChange = (room: RoomType) => {
    setActiveRoom(room)
    setNudgeVal(0)
    setFixtureKey((k) => k + 1)
  }

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function nudgeZoom(delta: number) {
    setNudgeVal((v) => Math.max(-0.45, Math.min(0.65, v + delta)))
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(28,27,25,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative bg-white rounded-2xl overflow-hidden flex flex-col"
        style={{ width: '100%', maxWidth: 860, maxHeight: '90dvh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D8D0C4] shrink-0">
          <div>
            <p className="text-[10px] tracking-[1.8px] uppercase text-[#A09488] font-sans">View in Room</p>
            <h2 className="font-serif text-[17px] text-[#2C2825] leading-tight">{product.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#A09488] hover:bg-[#F5F0EA] hover:text-[#2C2825] transition-colors"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Room tabs (only if multiple) */}
        {roomTypes.length > 1 && (
          <div className="flex gap-1 px-5 pt-3 pb-0 shrink-0">
            {roomTypes.map((room) => (
              <button
                key={room}
                type="button"
                onClick={() => handleRoomChange(room)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] tracking-[0.08em] font-sans transition-all ${
                  activeRoom === room
                    ? 'bg-[#2C2825] text-white'
                    : 'border border-[#D8D0C4] text-[#A09488] hover:border-[#C4714A] hover:text-[#2C2825]'
                }`}
              >
                {room}
              </button>
            ))}
          </div>
        )}

        {/* Canvas */}
        <div
          ref={wrapRef}
          className="relative flex-1 overflow-hidden"
          style={{ minHeight: 340 }}
        >
          {/* Room image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activeRoom}
            src={ROOM_IMAGE_MAP[activeRoom]}
            alt={activeRoom}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />

          {/* Fixture */}
          <FixtureOverlay
            key={fixtureKey}
            product={product}
            wrapRef={wrapRef as React.RefObject<HTMLDivElement>}
            nudgeVal={nudgeVal}
          />

          {/* Drag hint — fades after 3s */}
          <DragHint />

          {/* Toolbar */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white border border-[#D8D0C4] rounded-full flex items-center gap-0.5 px-2 py-1 shadow-sm z-40">
            {[
              {
                title: 'Zoom in',
                onClick: () => nudgeZoom(0.12),
                icon: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35M11 8v6M8 11h6" /></>,
              },
              {
                title: 'Zoom out',
                onClick: () => nudgeZoom(-0.12),
                icon: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35M8 11h6" /></>,
              },
              null,
              {
                title: 'Reset',
                onClick: () => { setNudgeVal(0); setFixtureKey((k) => k + 1) },
                icon: <><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>,
              },
            ].map((btn, i) =>
              btn === null ? (
                <div key={`d-${i}`} className="w-px h-[18px] bg-[#D8D0C4] mx-0.5" />
              ) : (
                <button
                  key={btn.title}
                  type="button"
                  title={btn.title}
                  onClick={btn.onClick}
                  className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[#A09488] hover:bg-[#F5F0EA] hover:text-[#2C2825] transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth={1.7}>
                    {btn.icon}
                  </svg>
                </button>
              ),
            )}
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-5 py-2.5 border-t border-[#D8D0C4] shrink-0 text-center text-[10.5px] text-[#A09488] font-sans">
          Drag the fixture to reposition · Use zoom to adjust scale
        </div>
      </div>
    </div>
  )
}

// Drag hint that auto-fades after 2.5s
function DragHint() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2500)
    return () => clearTimeout(t)
  }, [])
  if (!visible) return null
  return (
    <div
      className="absolute inset-x-0 top-3 flex justify-center pointer-events-none z-30 transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="bg-black/50 text-white text-[10.5px] px-3 py-1.5 rounded-full backdrop-blur-sm font-sans tracking-wide">
        Drag to reposition
      </div>
    </div>
  )
}
