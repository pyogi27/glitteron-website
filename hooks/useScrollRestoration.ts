'use client'
import { useEffect } from 'react'

export function useScrollRestoration(key: string): void {
  // Restore on mount
  useEffect(() => {
    const raw = sessionStorage.getItem(`scroll:${key}`)
    if (raw === null) return

    const y = Number(raw)
    if (!Number.isFinite(y) || y < 0) return

    let rafId: number
    let attempts = 0
    const MAX_ATTEMPTS = 60 // ~1 second at 60fps

    function tryScroll() {
      attempts++
      const maxScrollY = document.documentElement.scrollHeight - window.innerHeight
      if (maxScrollY >= y || attempts >= MAX_ATTEMPTS) {
        window.scrollTo({ top: y, behavior: 'instant' })
        return
      }
      rafId = requestAnimationFrame(tryScroll)
    }

    rafId = requestAnimationFrame(tryScroll)
    return () => cancelAnimationFrame(rafId)
  }, [key])

  // Save on unload / route change
  useEffect(() => {
    function save() {
      sessionStorage.setItem(`scroll:${key}`, String(window.scrollY))
    }
    window.addEventListener('beforeunload', save)
    window.addEventListener('pagehide', save)
    return () => {
      save()
      window.removeEventListener('beforeunload', save)
      window.removeEventListener('pagehide', save)
    }
  }, [key])
}
