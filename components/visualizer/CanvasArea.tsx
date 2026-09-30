'use client'
import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { useVisualizerStore } from '@/lib/stores/visualizerStore'
import type { VisualizerProduct } from '@/lib/data/visualizer'
import { getAnalysisForRoom, getProductsForRoom, fetchProductsForRoom } from '@/lib/data/visualizer'
import ScanOverlay from './ScanOverlay'

// ─── Perspective calculation ─────────────────────────────────────────────────
const VP_YR = 0.18
const VP_XR = 0.5

interface PerspResult { dScale: number; px: number; dr: number }

function calcPerspective(x: number, y: number, W: number, H: number): PerspResult {
  const vpY = H * VP_YR
  const vpX = W * VP_XR
  const dy = Math.max(0, y - vpY)
  const dr = Math.max(0, Math.min(1, dy / (H - vpY)))
  const dScale = 0.45 + dr * 0.55
  const px = vpX + (x - vpX) * (0.65 + dr * 0.35)
  return { dScale, px, dr }
}

// ─── Light cone drawing ──────────────────────────────────────────────────────
function drawLightCone(canvas: HTMLCanvasElement, litVal: number, showCone: boolean) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (!showCone) return
  const a = (litVal / 100) * 0.26
  const g = ctx.createRadialGradient(100, 0, 4, 100, 0, 160)
  g.addColorStop(0, `rgba(255,238,190,${a})`)
  g.addColorStop(0.45, `rgba(255,218,155,${a * 0.45})`)
  g.addColorStop(1, 'rgba(255,200,120,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(100, 0)
  ctx.lineTo(8, 150)
  ctx.lineTo(192, 150)
  ctx.closePath()
  ctx.fill()
}

// ─── Per-fixture overlay (own refs, drag, position) ──────────────────────────
function FixtureOverlay({
  product,
  wrapRef,
  onRemove,
}: {
  product: VisualizerProduct
  wrapRef: React.RefObject<HTMLDivElement | null>
  onRemove: () => void
}) {
  const fxRef = useRef<HTMLDivElement>(null)
  const coneRef = useRef<HTMLCanvasElement>(null)
  const posRef = useRef({ x: 0, y: 0, manAdj: 0 })

  const opVal    = useVisualizerStore((s) => s.opVal)
  const manVal   = useVisualizerStore((s) => s.manVal)
  const nudgeVal = useVisualizerStore((s) => s.nudgeVal)
  const litVal   = useVisualizerStore((s) => s.litVal)
  const showCone = useVisualizerStore((s) => s.showCone)
  const setPerspData = useVisualizerStore((s) => s.setPerspData)

  const applyPos = useCallback(
    (x: number, y: number) => {
      const wrap = wrapRef.current
      const fx = fxRef.current
      if (!wrap || !fx) return
      const p2 = calcPerspective(x, y, wrap.offsetWidth, wrap.offsetHeight)
      const { manAdj } = posRef.current
      const tot = Math.max(0.28, Math.min(1.9, p2.dScale + manAdj * 0.005 + nudgeVal))
      fx.style.left = `${p2.px - (product.iw * tot) / 2}px`
      fx.style.top  = `${y - 16}px`
      fx.style.transform = `scale(${tot})`
      fx.style.opacity   = String(opVal / 100)
      const cone = coneRef.current
      if (cone) drawLightCone(cone, litVal, showCone)
      const db = fx.querySelector<HTMLElement>('.viz-depth-badge')
      if (db) db.textContent = `scale ${(p2.dScale + manAdj * 0.005).toFixed(2)}×`
      setPerspData({ dScale: p2.dScale, dr: p2.dr, conv: 0.65 + p2.dr * 0.35 })
    },
    [wrapRef, product.iw, nudgeVal, opVal, litVal, showCone, setPerspData],
  )

  // Initial placement
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const x = wrap.offsetWidth * 0.5
    const y = wrap.offsetHeight * 0.22
    posRef.current = { x, y, manAdj: 0 }
    applyPos(x, y)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount

  // Re-apply when controls change
  useEffect(() => {
    const { x, y } = posRef.current
    if (x === 0 && y === 0) return
    posRef.current.manAdj = manVal
    applyPos(x, y)
  }, [opVal, manVal, nudgeVal, showCone, litVal, applyPos])

  // Attach drag
  useEffect(() => {
    const fx = fxRef.current
    const wrap = wrapRef.current
    if (!fx || !wrap) return

    const startDrag = (startX: number, startY: number) => {
      const wr = wrap.getBoundingClientRect()
      const er = fx.getBoundingClientRect()
      const ox = er.left - wr.left + er.width / 2
      const oy = er.top - wr.top
      fx.classList.add('dragging')

      const move = (cx: number, cy: number) => {
        const nx = Math.max(40, Math.min(wrap.offsetWidth - 40, ox + cx - startX))
        const ny = Math.max(5, Math.min(wrap.offsetHeight * 0.72, oy + cy - startY))
        posRef.current.x = nx
        posRef.current.y = ny
        applyPos(nx, ny)
      }
      const end = () => {
        fx.classList.remove('dragging')
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.removeEventListener('touchmove', onTouchMove)
        document.removeEventListener('touchend', onTouchEnd)
      }
      const onMouseMove = (e: MouseEvent) => move(e.clientX, e.clientY)
      const onMouseUp   = end
      const onTouchMove = (e: TouchEvent) => { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY) }
      const onTouchEnd  = end

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      document.addEventListener('touchmove', onTouchMove, { passive: false })
      document.addEventListener('touchend', onTouchEnd)
    }

    const onMouseDown  = (e: MouseEvent) => { if ((e.target as Element).closest('.viz-fx-ctrl')) return; e.preventDefault(); startDrag(e.clientX, e.clientY) }
    const onTouchStart = (e: TouchEvent) => { if ((e.target as Element).closest('.viz-fx-ctrl')) return; startDrag(e.touches[0].clientX, e.touches[0].clientY) }

    fx.addEventListener('mousedown', onMouseDown)
    fx.addEventListener('touchstart', onTouchStart, { passive: true })
    return () => {
      fx.removeEventListener('mousedown', onMouseDown)
      fx.removeEventListener('touchstart', onTouchStart)
    }
  }, [wrapRef, applyPos])

  return (
    <div ref={fxRef} className="viz-fx" style={{ position: 'absolute' }}>
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.full}
          alt={product.name}
          width={product.iw}
          style={{ display: 'block', filter: 'drop-shadow(0 6px 18px rgba(28,27,25,0.2))', pointerEvents: 'none' }}
          onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0.3')}
        />
        <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
          <canvas ref={coneRef} width={200} height={150} />
        </div>
        <div className="viz-fx-ctrl">
          <button
            type="button"
            onClick={onRemove}
            className="w-[21px] h-[21px] bg-white border border-warm-gray rounded-full flex items-center justify-center text-[9px] text-mid-gray hover:border-red-400 hover:text-red-400 transition-colors shadow-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="viz-depth-badge">scale —</div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CanvasArea() {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const vpMarkRef = useRef<HTMLDivElement>(null)

  const step       = useVisualizerStore((s) => s.step)
  const roomType   = useVisualizerStore((s) => s.roomType)
  const imageUrl   = useVisualizerStore((s) => s.imageUrl)
  const isDemo     = useVisualizerStore((s) => s.isDemo)
  const products   = useVisualizerStore((s) => s.products)
  const placedProductIds = useVisualizerStore((s) => s.placedProductIds)
  const analysisData     = useVisualizerStore((s) => s.analysisData)
  const removePlacedProduct = useVisualizerStore((s) => s.removePlacedProduct)

  const placedProducts = placedProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is VisualizerProduct => p !== undefined)

  // ── Load products when entering step 4 ─────────────────────────────────────
  const setAnalysis = useVisualizerStore((s) => s.setAnalysis)

  useEffect(() => {
    if (step !== 4 || !roomType || products.length > 0) return
    let cancelled = false

    async function loadProducts() {
      let prods
      try {
        prods = await fetchProductsForRoom(roomType!)
      } catch {
        prods = getProductsForRoom(roomType!)
      }
      if (!cancelled) setAnalysis(getAnalysisForRoom(roomType!), prods)
    }

    loadProducts()
    return () => { cancelled = true }
  }, [step, roomType, products.length, setAnalysis])

  // ── Position VP crosshair ───────────────────────────────────────────────────
  const posVP = useCallback(() => {
    const wrap = wrapRef.current
    const mark = vpMarkRef.current
    if (!wrap || !mark) return
    mark.style.left = wrap.offsetWidth * VP_XR + 'px'
    mark.style.top  = wrap.offsetHeight * VP_YR + 'px'
  }, [])

  useEffect(() => {
    posVP()
    window.addEventListener('resize', posVP)
    return () => window.removeEventListener('resize', posVP)
  }, [posVP])

  // ── Toolbar ─────────────────────────────────────────────────────────────────
  function nudgeZoom(delta: number) {
    const s = useVisualizerStore.getState()
    s.setNudgeVal(Math.max(-0.45, Math.min(0.65, s.nudgeVal + delta)))
  }
  const [vpVisible, setVpVisible] = useState(false)

  const generatedImageUrl  = useVisualizerStore((s) => s.generatedImageUrl)
  const isGenerating       = useVisualizerStore((s) => s.isGenerating)
  const generationProgress = useVisualizerStore((s) => s.generationProgress)

  // Hold-to-compare: temporarily show the original photo instead of the render
  const [comparing, setComparing] = useState(false)
  const canCompare = generatedImageUrl !== null && imageUrl !== null && !isDemo && !isGenerating

  const showCanvas = step >= 4
  const showScan   = false

  // Cycle through status messages while generating so the user knows it's working
  const [msgIdx, setMsgIdx] = useState(0)
  const GEN_MESSAGES = useMemo(() => [
    'Analysing your room…',
    'Placing the fixture…',
    'Adjusting lighting…',
    'Compositing layers…',
    'Finalising result…',
  ], [])

  useEffect(() => {
    if (!isGenerating) { setMsgIdx(0); return }
    const id = setInterval(() => setMsgIdx((i) => (i + 1) % GEN_MESSAGES.length), 3500)
    return () => clearInterval(id)
  }, [isGenerating, GEN_MESSAGES.length])

  return (
    <div ref={wrapRef} className="relative isolate flex-1 overflow-hidden bg-[#ebebe8]">

      {/* AI generation loading overlay */}
      {isGenerating && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Generating AI preview"
          style={{
            position: 'absolute', inset: 0, zIndex: 50,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(44,40,37,0.82)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 260, textAlign: 'center' }}>

            {/* Concentric spinner rings */}
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />
              <div
                className="animate-spin"
                style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#C4714A' }}
              />
              <div
                className="animate-spin"
                style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1.5px solid transparent', borderTopColor: 'rgba(255,255,255,0.35)', animationDuration: '1.6s', animationDirection: 'reverse' }}
              />
              {/* Centre dot */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C4714A' }} />
              </div>
            </div>

            {/* Heading + per-fixture progress + rotating sub-message */}
            <div>
              <p className="font-serif" style={{ color: '#fff', fontSize: 20, lineHeight: 1.2, margin: 0 }}>
                Generating AI Preview
              </p>
              {generationProgress && (
                <p className="font-sans" style={{
                  color: '#C4714A', fontSize: 11, letterSpacing: '1px', marginTop: 8,
                }}>
                  {generationProgress.productName}
                  {generationProgress.total > 1 &&
                    ` · ${generationProgress.current} of ${generationProgress.total}`}
                </p>
              )}
              <p
                key={msgIdx}
                className="font-sans"
                style={{
                  color: 'rgba(255,255,255,0.55)', fontSize: 10, letterSpacing: '1.5px',
                  textTransform: 'uppercase', marginTop: 8,
                  transition: 'opacity 0.4s',
                }}
              >
                {GEN_MESSAGES[msgIdx]}
              </p>
            </div>

            {/* Indeterminate progress bar */}
            <div style={{ width: 180, height: 2, background: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden' }}>
              <div className="viz-progress-bar" />
            </div>

            <p className="font-sans" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', marginTop: -8 }}>
              This may take up to 60 seconds
            </p>
          </div>
        </div>
      )}

      {/* Demo CSS room */}
      {showCanvas && isDemo && (
        <div className="absolute inset-0">
          <div className="w-full h-full relative overflow-hidden"
            style={{ background: 'linear-gradient(175deg, #d8d0c4, #c8bfaf)' }}>
            <div className="absolute top-0 left-0 right-0 h-[36%]"
              style={{ background: 'linear-gradient(180deg, #c4baa8, #b8ae9c)' }} />
            <div className="absolute left-0 right-0"
              style={{ top: '36%', bottom: '28%', background: 'linear-gradient(180deg, #d4cab8, #ccc2b0)' }} />
            <div className="absolute bottom-0 left-0 right-0 h-[28%]"
              style={{ background: 'linear-gradient(180deg, #a8a090, #9a9282)' }} />
            <div className="absolute"
              style={{ top: '9%', left: '11%', width: 86, height: 108,
                border: '1.5px solid rgba(255,255,255,0.45)',
                background: 'linear-gradient(135deg, rgba(200,220,255,0.2), rgba(180,210,240,0.3))' }} />
            <div className="absolute"
              style={{ bottom: '26%', left: '50%', transform: 'translateX(-50%)',
                width: 240, height: 62, background: '#8c7e6e', borderRadius: '8px 8px 3px 3px' }} />
          </div>
        </div>
      )}

      {/* Base image: latest AI render when one exists (so newly placed fixtures
          stack on top of it), otherwise the uploaded room photo. While the
          compare button is held, the original photo is shown instead. */}
      {showCanvas && !isDemo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={comparing && imageUrl ? imageUrl : (generatedImageUrl ?? imageUrl ?? '')}
          alt={comparing ? 'Original room photo' : 'Room'}
          className={`absolute inset-0 w-full h-full ${generatedImageUrl ? 'object-contain bg-[#2C2825]' : 'object-cover'}`}
        />
      )}

      {/* Before / after compare */}
      {canCompare && (
        <button
          type="button"
          aria-pressed={comparing}
          onPointerDown={() => setComparing(true)}
          onPointerUp={() => setComparing(false)}
          onPointerLeave={() => setComparing(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setComparing((v) => !v) } }}
          className={`absolute top-2.5 right-2.5 z-40 select-none px-3 py-1.5 rounded-full text-[10px] tracking-[1.5px] uppercase border backdrop-blur-sm transition-colors cursor-pointer font-sans ${
            comparing
              ? 'bg-gold text-white border-gold'
              : 'bg-white/90 text-mid-gray border-warm-gray hover:border-gold hover:text-gold'
          }`}
        >
          {comparing ? 'Original Photo' : 'Hold to Compare'}
        </button>
      )}

      {/* Scan overlay */}
      {showScan && <ScanOverlay />}

      {/* Room type tag */}
      {step >= 4 && step < 6 && (
        <div className="absolute top-2.5 left-2.5 z-30 bg-white/90 border border-warm-gray px-3 py-1 rounded-full text-[10px] tracking-[1.5px] uppercase text-mid-gray backdrop-blur-sm">
          {analysisData?.roomType} · {analysisData?.style}
        </div>
      )}

      {/* VP crosshair */}
      {step >= 4 && (
        <div ref={vpMarkRef} className="viz-vp-mark" style={{ display: vpVisible ? 'block' : 'none' }} />
      )}

      {/* Draggable fixtures — hidden at step 6 where AI composite is shown */}
      {step < 6 && placedProducts.map((product) => (
        <FixtureOverlay
          key={product.id}
          product={product}
          wrapRef={wrapRef}
          onRemove={() => removePlacedProduct(product.id)}
        />
      ))}

      {/* Canvas toolbar */}
      {step >= 4 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white border border-warm-gray rounded-full flex items-center gap-0.5 px-2 py-1 shadow-sm z-40">
          {[
            { title: 'Zoom in',     onClick: () => nudgeZoom(0.12),
              icon: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35M11 8v6M8 11h6" /></> },
            { title: 'Zoom out',    onClick: () => nudgeZoom(-0.12),
              icon: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35M8 11h6" /></> },
            { title: 'Toggle VP',   onClick: () => setVpVisible((v) => !v),
              icon: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></> },
            { title: 'Toggle cone', onClick: () => useVisualizerStore.getState().toggleCone(),
              icon: <><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></> },
            null,
            { title: 'Reset view',  onClick: () => useVisualizerStore.getState().resetControls(),
              icon: <><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" /><path d="M3 3v5h5" /></> },
          ].map((btn, i) =>
            btn === null ? (
              <div key={`d-${i}`} className="w-px h-[18px] bg-warm-gray mx-0.5" />
            ) : (
              <button key={btn.title} type="button" title={btn.title} onClick={btn.onClick}
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-mid-gray hover:bg-offwhite hover:text-dark transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth={1.7}>
                  {btn.icon}
                </svg>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
