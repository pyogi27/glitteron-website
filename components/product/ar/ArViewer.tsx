'use client'
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import {
  alphaBounds, arImageSrc, chromeIntentUrl, coverCrop, inAppBrowser, isAndroid, type Box,
} from '@/lib/ar/helpers'
import { heightFraction, placementFor, startPose, withMove, withZoom, type Placement } from '@/lib/ar/gestures'
import { track } from '@/lib/analytics'
import { useCameraStream, type CameraState } from './useCameraStream'
import { useGestures } from './useGestures'

export type FallbackReason = 'declined' | 'denied' | 'unavailable' | 'error' | 'image'

interface Props {
  /** The raw arImage URL (variation's, else product's). */
  src: string
  productId: string
  name: string
  slug: string
  category: string
  heightMm?: number
  onClose: () => void
  /** Close the viewer and open the room visualizer with the same image. */
  onFallback: (reason: FallbackReason) => void
}

interface Art {
  img: HTMLImageElement
  box: Box
}

interface Shot {
  url: string
  file: File
}

const COACH: Record<Placement, string> = {
  ceiling: 'Point your phone at the ceiling',
  wall: 'Face the wall',
  floor: 'Point at the floor',
}
/** Arrow keys move the light by this fraction of the stage. */
const KEY_STEP = 0.02
const ZOOM_IN = 1.15
const ZOOM_OUT = 0.87
const KEY_MOVES: Record<string, [number, number]> = {
  ArrowLeft: [-KEY_STEP, 0],
  ArrowRight: [KEY_STEP, 0],
  ArrowUp: [0, -KEY_STEP],
  ArrowDown: [0, KEY_STEP],
}

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light'
const PRIMARY = `min-h-11 px-6 rounded-3xl bg-gold-light text-black font-sans text-[13px] font-semibold tracking-[0.08em] uppercase transition-colors hover:bg-[#E8A87C] ${FOCUS}`
const SECONDARY = `min-h-11 px-6 rounded-3xl border border-white/40 text-white font-sans text-[13px] font-medium tracking-[0.06em] transition-colors hover:border-gold-light hover:text-gold-light inline-flex items-center justify-center ${FOCUS}`
const ROUND = `pointer-events-auto w-12 h-12 rounded-full bg-black/45 backdrop-blur flex items-center justify-center text-white transition-colors hover:bg-black/70 ${FOCUS}`

type Failure = Extract<CameraState, 'denied' | 'unavailable' | 'error' | 'paused'> | 'image'

const isIos = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)

/** What went wrong and what the shopper can do about it (docs/AR-VIEW-IN-ROOM.md §6). */
function failureCopy(failure: Failure): { message: string; retry?: string; chrome?: string } {
  const ua = navigator.userAgent
  if (failure !== 'image' && failure !== 'paused' && inAppBrowser(ua) !== 'none') {
    return isAndroid(ua)
      ? { message: "This app's browser can't open the camera.", chrome: chromeIntentUrl(location.href) }
      : { message: 'Tap ⋯ and choose Open in browser, then try again.', retry: 'Try again' }
  }
  switch (failure) {
    case 'denied':
      return {
        message: isIos()
          ? 'Camera access is blocked. Tap aA in the address bar → Website Settings → Camera → Allow, then try again.'
          : isAndroid(ua)
            ? 'Camera access is blocked. Tap the icon left of the address bar → Permissions → Camera → Allow, then try again.'
            : "Camera access is blocked. Allow it in your browser's site settings, then try again.",
        retry: 'Try again',
      }
    case 'unavailable':
      return { message: "We couldn't find a camera on this device." }
    case 'error':
      return { message: "Couldn't start the camera. Close any other app using it and try again.", retry: 'Try again' }
    case 'paused':
      return { message: 'Camera paused.', retry: 'Resume camera' }
    case 'image':
      return { message: "We couldn't load this light's image." }
  }
}

const FALLBACK_REASON: Record<Failure, FallbackReason> = {
  denied: 'denied',
  unavailable: 'unavailable',
  error: 'error',
  paused: 'error',
  image: 'image',
}

/**
 * Full-screen camera view with the light's cutout on top. Loaded with next/dynamic only
 * when opened. Privacy: camera frames go to a <video> and, on capture, a local canvas;
 * the photo stays on the device unless the shopper shares or saves it themselves.
 */
export default function ArViewer({
  src, productId, name, slug, category, heightMm, onClose, onFallback,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const gesturedRef = useRef(false)

  const placement = placementFor(category)
  const height = heightFraction(heightMm)
  const initial = startPose(placement, height)

  const [intro, setIntro] = useState(true)
  const [coach, setCoach] = useState(true)
  const [art, setArt] = useState<Art | null>(null)
  const [artFailed, setArtFailed] = useState(false)
  const [shot, setShot] = useState<Shot | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const camera = useCameraStream(videoRef)
  const ready = camera.state === 'ready'
  const failure: Failure | null = artFailed
    ? 'image'
    : camera.state === 'denied' || camera.state === 'unavailable' || camera.state === 'error' || camera.state === 'paused'
      ? camera.state
      : null
  const screen = shot ? 'preview' : failure ?? (intro ? 'intro' : camera.state)
  // The stage takes gestures and focus only while the live view is what is showing.
  const live = screen === 'ready'

  const { pose, setPose, handlers } = useGestures(initial, live, () => {
    setCoach(false)
    if (gesturedRef.current) return
    gesturedRef.current = true
    track('ar_first_gesture', { product_id: productId })
  })


  // Open as a modal: the page behind becomes inert, focus stays inside, Esc fires `cancel`.
  useEffect(() => {
    const dialog = dialogRef.current
    // Unmounting (not .close()) does not return focus, so do it by hand.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (dialog && !dialog.open) dialog.showModal()
    document.body.style.overflow = 'hidden'
    const openedAt = Date.now()
    return () => {
      document.body.style.overflow = ''
      opener?.focus()
      track('ar_close', { product_id: productId, seconds: Math.round((Date.now() - openedAt) / 1000) })
    }
  }, [productId])

  // Each screen puts focus on its main control; the old one may have just unmounted.
  useEffect(() => {
    const dialog = dialogRef.current
    const target = dialog?.querySelector<HTMLElement>('[data-autofocus]') ?? dialog?.querySelector('button')
    target?.focus()
  }, [screen])

  // Load the cutout same-origin, then trim its transparent padding.
  useEffect(() => {
    let live = true
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (!live) return
      const full = { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight }
      const scratch = document.createElement('canvas')
      scratch.width = full.w
      scratch.height = full.h
      const ctx = scratch.getContext('2d', { willReadFrequently: true })
      let box: Box | null = null
      try {
        ctx?.drawImage(img, 0, 0)
        const data = ctx?.getImageData(0, 0, full.w, full.h).data
        box = data ? alphaBounds(data, full.w, full.h) : null
      } catch {
        // A tainted canvas (never expected, the URL is same-origin): show it untrimmed.
      }
      setArt({ img, box: box ?? full })
    }
    img.onerror = () => {
      if (live) setArtFailed(true)
    }
    img.src = arImageSrc(src)
    return () => {
      live = false
      img.onload = null
      img.onerror = null
    }
  }, [src])

  // Paint the trimmed cutout once; CSS positions it from then on.
  useEffect(() => {
    const canvas = overlayRef.current
    if (!canvas || !art) return
    const { box } = art
    canvas.width = box.w
    canvas.height = box.h
    canvas.getContext('2d')?.drawImage(art.img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h)
  }, [art])

  // Release the photo's blob URL on retake and on close.
  useEffect(() => () => {
    if (shot) URL.revokeObjectURL(shot.url)
  }, [shot])

  const close = () => {
    camera.stop()
    onClose()
  }

  const fallback = (reason: FallbackReason) => {
    camera.stop()
    onFallback(reason)
  }

  const openCamera = async () => {
    setIntro(false)
    setNotice(null)
    const outcome = await camera.start()
    if (outcome) {
      track('ar_permission', { product_id: productId, result: outcome, in_app: inAppBrowser(navigator.userAgent) })
    }
  }

  // A tap, so the camera may restart; permission is already granted.
  const retake = () => {
    setShot(null)
    setNotice(null)
    void camera.start()
  }

  const zoom = (factor: number) => setPose(withZoom(pose, factor))

  const reset = () => {
    setPose(initial)
    setCoach(true)
  }

  const onStageKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const move = KEY_MOVES[e.key]
    if (move) {
      e.preventDefault()
      setPose(withMove(pose, move[0], move[1]))
      setCoach(false)
    } else if (e.key === '+' || e.key === '=') {
      zoom(ZOOM_IN)
    } else if (e.key === '-') {
      zoom(ZOOM_OUT)
    }
  }

  const capture = async () => {
    const video = videoRef.current
    const stage = stageRef.current
    if (!video || !stage || !art || !video.videoWidth || capturing) return
    setCapturing(true)
    setNotice(null)
    track('ar_capture', { product_id: productId })

    // Redraw exactly what is on screen: the visible part of the frame, then the light
    // with the same centre, rotation and scale as its CSS transform.
    const { width: W, height: H } = stage.getBoundingClientRect()
    const { sx, sy, sw, sh, k } = coverCrop(video.videoWidth, video.videoHeight, W, H)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(sw)
    canvas.height = Math.round(sh)
    const ctx = canvas.getContext('2d')
    let blob: Blob | null = null
    if (ctx) {
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
      const dh = height * H * pose.s * k
      const dw = (dh * art.box.w) / art.box.h
      ctx.translate(pose.x * W * k, pose.y * H * k)
      ctx.rotate(pose.rot)
      ctx.drawImage(art.img, art.box.x, art.box.y, art.box.w, art.box.h, -dw / 2, -dh / 2, dw, dh)
      blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    }
    setCapturing(false)
    if (!dialogRef.current) return // closed while encoding; no URL to leak
    // The camera indicator should not stay on while the shopper looks at the photo.
    if (blob) camera.stop()
    if (!blob) {
      setNotice("Couldn't take the photo. Please try again.")
      return
    }
    setShot({
      url: URL.createObjectURL(blob),
      file: new File([blob], `${slug}-in-my-room.jpg`, { type: 'image/jpeg' }),
    })
  }

  // A second tap, never chained onto the shutter: iOS rejects share() once async work
  // has used up the tap's user activation.
  const share = async () => {
    if (!shot) return
    try {
      // Path only: no utm/gclid/fbclid from the sharer's visit rides along.
      const page = location.origin + location.pathname
      await navigator.share({ files: [shot.file], title: name, text: `${name} — ${page}` })
      track('ar_share', { product_id: productId, result: 'shared' })
    } catch (err) {
      const cancelled = err instanceof DOMException && err.name === 'AbortError'
      track('ar_share', { product_id: productId, result: cancelled ? 'cancelled' : 'failed' })
      if (!cancelled) setNotice("Couldn't open sharing. Use Save instead.")
    }
  }
  const canShare = !!shot && typeof navigator.canShare === 'function' && navigator.canShare({ files: [shot.file] })

  return (
    <dialog
      ref={dialogRef}
      aria-label={`${name} in your room`}
      onCancel={e => {
        e.preventDefault()
        close()
      }}
      // Chrome may still close it on a repeated Esc; keep React in step.
      onClose={close}
      className="fixed inset-0 m-0 p-0 w-full h-full max-w-none max-h-none bg-black text-white font-sans overflow-hidden touch-none backdrop:bg-black"
    >
      <div
        ref={stageRef}
        {...handlers}
        onKeyDown={live ? onStageKey : undefined}
        tabIndex={live ? 0 : -1}
        role="group"
        aria-roledescription="light preview"
        aria-label="Drag to move the light, pinch to resize, twist to rotate. Arrow keys move it, plus and minus resize it."
        data-autofocus={live || undefined}
        className="absolute inset-0 overflow-hidden touch-none select-none [-webkit-touch-callout:none] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-light"
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          aria-hidden="true"
          // Never hidden: WebKit may pause a <video> that is not visible. Panels cover it.
          className="absolute inset-0 w-full h-full object-cover"
        />
        {art && (
          <canvas
            ref={overlayRef}
            aria-hidden="true"
            className={`absolute pointer-events-none ${ready ? '' : 'invisible'}`}
            style={{
              left: `${pose.x * 100}%`,
              top: `${pose.y * 100}%`,
              height: `${height * 100}%`,
              aspectRatio: `${art.box.w} / ${art.box.h}`,
              transform: `translate(-50%, -50%) rotate(${pose.rot}rad) scale(${pose.s})`,
            }}
          />
        )}
      </div>

      {/* z-10: the full-screen panels below come later in the DOM and would cover Close. */}
      <header className="absolute z-10 inset-x-0 top-0 flex items-start justify-between gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-8 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="min-w-0 pt-1">
          <p className="text-[10px] tracking-[0.18em] uppercase text-gold-light">View in your room</p>
          <h2 className="font-serif text-[18px] leading-tight truncate">{name}</h2>
        </div>
        <button type="button" onClick={close} aria-label="Close" className={`${ROUND} shrink-0`}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 stroke-current fill-none" strokeWidth={2}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </header>

      {screen === 'intro' && (
        <Panel>
          {art ? (
            // Same optimizer URL as the overlay, so this is served from cache.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={arImageSrc(src)} alt="" className="h-40 w-auto max-w-full object-contain mb-6" />
          ) : (
            <div className="h-40 mb-6" aria-hidden="true" />
          )}
          <h3 className="font-serif text-[28px] leading-tight mb-3">See it in your room</h3>
          <p className="text-[14px] leading-relaxed text-white/80 mb-7 max-w-[30ch]">
            {COACH[placement]} and the light appears where it would hang.
            <span className="block mt-2 text-gold-light">Nothing is recorded or uploaded.</span>
          </p>
          <button type="button" data-autofocus onClick={openCamera} className={`${PRIMARY} w-full max-w-72`}>
            Open camera
          </button>
          <button type="button" onClick={() => fallback('declined')} className={`${SECONDARY} w-full max-w-72 mt-3`}>
            Use a sample room instead
          </button>
        </Panel>
      )}

      {screen === 'starting' && (
        <Panel>
          <p role="status" className="font-serif text-[22px]">Opening camera…</p>
          <p className="text-[13px] text-white/70 mt-2">Allow camera access if your browser asks.</p>
        </Panel>
      )}

      {failure && !shot && <FailurePanel failure={failure} onRetry={openCamera} onFallback={fallback} />}

      {live && (
        <>
          {!art && (
            <p role="status" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-black/55 px-4 py-3 text-[13px]">
              Loading the light…
            </p>
          )}
          {art && coach && (
            <p role="status" className="absolute left-1/2 bottom-[calc(max(16px,env(safe-area-inset-bottom))+150px)] -translate-x-1/2 w-max max-w-[calc(100%-32px)] rounded-2xl bg-black/55 backdrop-blur px-5 py-3 text-center text-[13px] pointer-events-none">
              <span className="block font-serif text-[17px] mb-0.5">{COACH[placement]}</span>
              Pinch to resize, drag to move, twist to rotate
            </p>
          )}
          <footer className="absolute inset-x-0 bottom-0 pointer-events-none px-4 pt-10 pb-[max(16px,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/60 to-transparent">
            <p role="status" className="text-center text-[12px] text-gold-light mb-2 empty:hidden">{notice}</p>
            {heightMm ? (
              <p className="text-center text-[11px] text-white/75 mb-3">
                Height ≈ {Math.round(heightMm / 10)} cm · size on screen is approximate
              </p>
            ) : null}
            <div className="flex items-center justify-center gap-4">
              <button type="button" onClick={() => zoom(ZOOM_OUT)} aria-label="Make smaller" className={ROUND}>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 stroke-current" strokeWidth={2}><path d="M5 12h14" /></svg>
              </button>
              <button type="button" onClick={() => zoom(ZOOM_IN)} aria-label="Make larger" className={ROUND}>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 stroke-current" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
              </button>
              <button
                type="button"
                onClick={capture}
                disabled={!art || capturing}
                aria-label="Take photo"
                className={`pointer-events-auto w-[68px] h-[68px] mx-2 rounded-full border-4 border-white bg-white/25 transition-transform active:scale-95 disabled:opacity-40 ${FOCUS}`}
              />
              <button type="button" onClick={reset} aria-label="Reset position and size" className={ROUND}>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 stroke-current fill-none" strokeWidth={2}>
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
                </svg>
              </button>
              <button type="button" onClick={() => fallback('declined')} aria-label="Use a sample room instead" className={ROUND}>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 stroke-current fill-none" strokeWidth={1.6}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </button>
            </div>
          </footer>
        </>
      )}

      {shot && (
        <div className="absolute inset-0 flex flex-col bg-black pt-[max(72px,calc(env(safe-area-inset-top)+60px))] pb-[max(16px,env(safe-area-inset-bottom))]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot.url} alt={`${name} in your room`} className="flex-1 min-h-0 w-full object-contain" />
          <p role="status" className="text-center text-[12px] text-gold-light mt-2 empty:hidden">{notice}</p>
          <div className="flex items-center justify-center gap-3 px-4 pt-4">
            <button type="button" onClick={retake} className={SECONDARY}>
              Retake
            </button>
            <a
              href={shot.url}
              download={shot.file.name}
              onClick={() => track('ar_share', { product_id: productId, result: 'downloaded' })}
              data-autofocus={canShare ? undefined : true}
              className={SECONDARY}
            >
              Save
            </a>
            {canShare && (
              <button type="button" data-autofocus onClick={share} className={PRIMARY}>
                Share
              </button>
            )}
          </div>
        </div>
      )}
    </dialog>
  )
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pt-20 pb-[max(24px,env(safe-area-inset-bottom))] bg-gradient-to-b from-[#1A1210] to-black">
      {children}
    </div>
  )
}

interface FailurePanelProps {
  failure: Failure
  onRetry: () => void
  onFallback: (reason: FallbackReason) => void
}

function FailurePanel({ failure, onRetry, onFallback }: FailurePanelProps) {
  const { message, retry, chrome } = failureCopy(failure)
  return (
    <Panel>
      <p role="alert" className="font-serif text-[20px] leading-snug max-w-[32ch] mb-7">{message}</p>
      {chrome && (
        <a href={chrome} data-autofocus className={`${PRIMARY} w-full max-w-72 inline-flex items-center justify-center`}>
          Open in Chrome
        </a>
      )}
      {retry && (
        <button type="button" data-autofocus onClick={onRetry} className={`${PRIMARY} w-full max-w-72`}>
          {retry}
        </button>
      )}
      <button
        type="button"
        data-autofocus={!retry && !chrome ? true : undefined}
        onClick={() => onFallback(FALLBACK_REASON[failure])}
        className={`${SECONDARY} w-full max-w-72 mt-3`}
      >
        Use a sample room instead
      </button>
    </Panel>
  )
}
