'use client'
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

export type CameraState = 'idle' | 'starting' | 'ready' | 'denied' | 'unavailable' | 'error' | 'paused'
export type CameraOutcome = 'granted' | 'denied' | 'unavailable' | 'error'

// `ideal`, never `exact`: exact throws on laptops and some iPhones. Without a size hint
// Chrome on Android opens at 640x480.
const CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
}

function outcomeOf(err: unknown): CameraOutcome {
  const name = err instanceof DOMException ? err.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'unavailable'
  // NotReadableError (camera busy in another app), AbortError and anything else: retryable.
  return 'error'
}

/**
 * Rear camera into `videoRef`. Frames stay in the <video> element; nothing is sent
 * anywhere. Every track is stopped on unmount, page hide, a restart, or when a start is
 * abandoned while the permission prompt is still open.
 */
export function useCameraStream(videoRef: RefObject<HTMLVideoElement | null>) {
  const [state, setState] = useState<CameraState>('idle')
  const streamRef = useRef<MediaStream | null>(null)
  // Bumped by stop(), so a stream that arrives after it is stopped on arrival.
  const runRef = useRef(0)

  const stop = useCallback(() => {
    runRef.current++
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [videoRef])

  /** Must be called from a tap: browsers show the permission prompt from user actions. */
  const start = useCallback(async (): Promise<CameraOutcome | undefined> => {
    stop()
    const run = runRef.current
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unavailable')
      return 'unavailable'
    }
    setState('starting')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS)
    } catch (err) {
      if (run !== runRef.current) return undefined
      const outcome = outcomeOf(err)
      setState(outcome as CameraState)
      return outcome
    }
    if (run !== runRef.current) {
      stream.getTracks().forEach(t => t.stop())
      return undefined
    }
    streamRef.current = stream
    // Another app took the camera, or the OS revoked it.
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      if (streamRef.current !== stream) return
      stop()
      setState('paused')
    })

    const video = videoRef.current
    if (!video) {
      stop()
      setState('error')
      return 'error'
    }
    video.srcObject = stream
    try {
      await video.play()
    } catch {
      if (run !== runRef.current) return undefined
      stop()
      setState('error')
      return 'error'
    }
    if (run !== runRef.current) return undefined
    setState('ready')
    return 'granted'
  }, [stop, videoRef])

  useEffect(() => {
    const pause = () => {
      stop()
      setState(s => (s === 'ready' || s === 'starting' ? 'paused' : s))
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pause()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', pause)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', pause)
      stop()
    }
  }, [stop])

  return { state, start, stop }
}
