'use client'
import { useEffect } from 'react'

export function useScrollRestoration(key: string): void {
  // Restore on mount
  useEffect(() => {
    const raw = sessionStorage.getItem(`scroll:${key}`)
    if (raw === null) return

    const y = Number(raw)
    if (!Number.isFinite(y) || y < 0) return

    const id = requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: 'instant' })
    })
    return () => cancelAnimationFrame(id)
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
