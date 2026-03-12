'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const moveCursor = (e: MouseEvent) => {
      gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'none' })
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.15, ease: 'power2.out' })
    }

    const onEnter = () => {
      gsap.to(dot, { width: 20, height: 20, duration: 0.3 })
      gsap.to(ring, { width: 60, height: 60, opacity: 0.3, duration: 0.3 })
    }

    const onLeave = () => {
      gsap.to(dot, { width: 10, height: 10, duration: 0.3 })
      gsap.to(ring, { width: 36, height: 36, opacity: 0.6, duration: 0.3 })
    }

    window.addEventListener('mousemove', moveCursor)

    const interactables = document.querySelectorAll('a, button, [data-cursor-hover]')
    interactables.forEach((el) => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })

    return () => {
      window.removeEventListener('mousemove', moveCursor)
      interactables.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter)
        el.removeEventListener('mouseleave', onLeave)
      })
    }
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-[10px] h-[10px] bg-gold rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-[36px] h-[36px] border border-gold rounded-full pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 opacity-60"
        aria-hidden="true"
      />
    </>
  )
}
