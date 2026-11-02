'use client'
import { useEffect, useRef } from 'react'

// Warm metallics that sit on the #1A1210 ground: gold, champagne, the site's copper.
const COLORS = ['#F5D78E', '#FFF1C9', '#E8B04B', '#C4714A', '#FFFFFF']
/** One speck per this many CSS px² of section, so density holds at any size. */
const AREA_PER_SPECK = 1500
const MAX_SPECKS = 1200

interface Speck { x: number; y: number; r: number; color: string; phase: number; speed: number; drift: number }

/**
 * Twinkling glitter behind the Deal of the Day. Fills its positioned parent, ignores
 * the pointer, stops drawing while off screen, and holds one still frame under
 * prefers-reduced-motion.
 */
export default function GlitterBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let specks: Speck[] = []
    let w = 0
    let h = 0
    let frame = 0
    let visible = false

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(MAX_SPECKS, Math.round((w * h) / AREA_PER_SPECK))
      specks = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() < 0.12 ? 1.6 + Math.random() * 1.4 : 0.5 + Math.random() * 1.1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 2.2,
        drift: 4 + Math.random() * 10,
      }))
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      const s = t / 1000
      for (const p of specks) {
        // Squared sine: most specks rest dim and flash briefly, which reads as glitter
        // catching light rather than a uniform pulse.
        const tw = Math.sin(s * p.speed + p.phase) ** 2
        const alpha = 0.18 + tw ** 3 * 0.82
        // Slow upward float, wrapped so the field never empties.
        const y = (((p.y - s * p.drift) % h) + h) % h
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, y, p.r, 0, Math.PI * 2)
        ctx.fill()
        // The bigger flakes throw a four-point glint at their peak.
        if (p.r > 1.5 && tw > 0.85) {
          const len = p.r * 5 * tw
          ctx.globalAlpha = alpha * 0.7
          ctx.fillRect(p.x - len, y - 0.4, len * 2, 0.8)
          ctx.fillRect(p.x - 0.4, y - len, 0.8, len * 2)
        }
      }
      ctx.globalAlpha = 1
    }

    const loop = (t: number) => {
      draw(t)
      frame = requestAnimationFrame(loop)
    }
    const start = () => {
      if (still) draw(0)
      else if (!frame) frame = requestAnimationFrame(loop)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }

    resize()
    const ro = new ResizeObserver(() => {
      resize()
      if (still || !visible) draw(0)
    })
    ro.observe(canvas)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    })
    io.observe(canvas)

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" />
}
