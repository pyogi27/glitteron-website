'use client'
import { useCallback, useSyncExternalStore } from 'react'

/**
 * Live matchMedia result. The server snapshot is `false`, so prerendered HTML
 * and the first client render agree, and the real value arrives after hydration.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

type NetworkInformation = { saveData?: boolean }

const noSubscribe = () => () => {}

/** The browser's Save-Data flag. Chromium only; false everywhere else. */
export function useSaveData(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => (navigator as Navigator & { connection?: NetworkInformation }).connection?.saveData === true,
    () => false,
  )
}
