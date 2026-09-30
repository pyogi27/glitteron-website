'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { VideoItem } from '@/lib/api/videos'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { playMuted, safePlay } from './videoPlayback'

interface Props {
  items: VideoItem[]
  startIndex: number
  /** Runs on the dialog's close event: Esc, the close button, Android back. */
  onClose: () => void
}

/** The slide that covers at least this much of the player is the active one. */
const ACTIVE_RATIO = 0.6

const STEP_KEYS: Record<string, number> = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }

// ponytail: native <dialog> — showModal() gives focus containment, Esc,
// background inertness and top-layer stacking for free; no portal or trap.
export default function VideoPlayerModal({ items, startIndex, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const slides = useRef<(HTMLDivElement | null)[]>([])
  const videos = useRef<(HTMLVideoElement | null)[]>([])
  const toggles = useRef<(HTMLButtonElement | null)[]>([])
  const bar = useRef<HTMLDivElement>(null)

  const [active, setActive] = useState(startIndex)
  const activeRef = useRef(startIndex)
  const [activePlaying, setActivePlaying] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const soundRef = useRef(false)
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(() => new Set())
  const [broken, setBroken] = useState<ReadonlySet<number>>(() => new Set())
  const brokenRef = useRef<ReadonlySet<number>>(broken)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const setSound = useCallback((on: boolean) => {
    soundRef.current = on
    setSoundOn(on)
  }, [])

  const markBroken = useCallback((i: number) => {
    if (brokenRef.current.has(i)) return
    brokenRef.current = new Set(brokenRef.current).add(i)
    setBroken(brokenRef.current)
  }, [])

  // Play the active video with the viewer's sound choice. WebKit unlocks sound
  // per element; if this one refuses, keep playing muted and say so.
  const playActive = useCallback(async (video: HTMLVideoElement) => {
    video.muted = !soundRef.current
    const result = await safePlay(video)
    // A swipe may have moved on while play() was pending; never restart a
    // video that is no longer the active one.
    if (videos.current[activeRef.current] !== video) return
    if (result === 'blocked' && !video.muted) {
      setSound(false)
      await playMuted(video)
    }
  }, [setSound])

  const go = useCallback((i: number) => {
    const s = scroller.current
    if (!s || i < 0 || i >= items.length) return
    s.scrollTo({ top: i * s.clientHeight, behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [items.length, reducedMotion])

  // Open once on mount. No close() in the cleanup: StrictMode runs this twice
  // in dev, and a close() there would queue a close event that shuts the
  // player right after it opens. Unmounting an open dialog is safe.
  useEffect(() => {
    const d = dialog.current
    const s = scroller.current
    if (!d || !s) return
    if (!d.open) d.showModal()
    // Lock <html>, not body: NewsletterPopup resets body.style.overflow.
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    s.scrollTop = startIndex * s.clientHeight
    // showModal() focused the first control in DOM order; put focus on the
    // video that was picked instead.
    toggles.current[startIndex]?.focus({ preventScroll: true })
    return () => { root.style.overflow = previous }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startIndex is the opening slide only
  }, [])

  useEffect(() => {
    const s = scroller.current
    if (!s) return
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= ACTIVE_RATIO) {
            setActive(Number((entry.target as HTMLElement).dataset.index))
          }
        }
      },
      { root: s, threshold: ACTIVE_RATIO },
    )
    slides.current.forEach(slide => slide && io.observe(slide))
    return () => io.disconnect()
  }, [])

  // Keys on the document, not the dialog: when the slide holding focus turns
  // inert, focus drops to <body> and the dialog would stop hearing them.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const step = STEP_KEYS[e.key]
      if (!step) return
      e.preventDefault()
      go(activeRef.current + step)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [go])

  useEffect(() => {
    activeRef.current = active
    const incoming = videos.current[active]
    if (bar.current) bar.current.style.transform = 'scaleX(0)'
    if (incoming) onTimeUpdate(incoming) // back on a slide: resume the bar where it was
    videos.current.forEach((video, i) => {
      if (video && i !== active && !video.paused) video.pause()
    })
    // The slide that held focus is now inert, which drops focus to <body>
    // (possibly after this runs); move it to the new slide instead.
    const focused = document.activeElement
    const stranded = !focused || focused === document.body
      || slides.current.some((slide, i) => i !== active && slide?.contains(focused))
    if (stranded) toggles.current[active]?.focus({ preventScroll: true })

    const video = videos.current[active]
    setActivePlaying(Boolean(video && !video.paused))
    if (!video || brokenRef.current.has(active)) return
    if (!video.canPlayType(items[active].type)) {
      markBroken(active)
      return
    }
    void playActive(video)
  }, [active, items, markBroken, playActive])

  function togglePlay() {
    const video = videos.current[activeRef.current]
    if (!video) return
    if (!video.paused) {
      video.pause()
      return
    }
    // Inside the tap, so this also clears iOS Low Power Mode's block.
    void playActive(video)
  }

  function toggleSound() {
    const on = !soundRef.current
    setSound(on)
    // WebKit unlocks sound per element and only during a gesture: touch every
    // video now, so the ones reached later by swiping can play with sound too.
    videos.current.forEach(video => { if (video) video.muted = !on })
  }

  function onTimeUpdate(video: HTMLVideoElement) {
    const { currentTime, duration } = video
    if (bar.current && duration > 0 && Number.isFinite(duration)) {
      bar.current.style.transform = `scaleX(${currentTime / duration})`
    }
  }

  const current = items[active]

  return (
    <dialog
      ref={dialog}
      data-video-player
      aria-label="Watch & Shop videos"
      onClose={onClose}
      // The site hides the native cursor on every element with an unlayered
      // !important rule and draws its own under z-9999, which the top layer
      // covers. Layered !important beats unlayered, so these bring it back.
      className="fixed inset-0 m-0 p-0 border-0 w-full h-dvh max-w-none max-h-none overflow-hidden bg-black text-white backdrop:bg-black
        cursor-auto! [&_*]:[cursor:inherit]! [&_button]:cursor-pointer! [&_a]:cursor-pointer! [&_button:disabled]:cursor-default!"
    >
      <div
        ref={scroller}
        className="h-full overflow-y-auto overscroll-contain snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => {
          const isActive = i === active
          return (
            <div
              key={item.productId}
              ref={el => { slides.current[i] = el }}
              data-slide
              data-index={i}
              data-active={isActive}
              inert={!isActive}
              role="group"
              aria-roledescription="video"
              aria-label={`${i + 1} of ${items.length}: ${item.name}`}
              className="relative h-full snap-start snap-always flex items-center justify-center"
            >
              <div className="relative h-full w-full md:w-auto md:aspect-[9/16] md:max-w-full overflow-hidden bg-[#1A1210]">
                {item.poster && (
                  <Image
                    src={item.poster}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 57vh, 100vw"
                    loading={i === startIndex ? 'eager' : 'lazy'}
                    className="object-contain p-10"
                  />
                )}
                <video
                  ref={el => { videos.current[i] = el }}
                  data-player-video
                  src={item.src}
                  muted
                  loop
                  playsInline
                  preload="none"
                  disablePictureInPicture
                  disableRemotePlayback
                  aria-hidden="true"
                  onPlaying={() => setRevealed(prev => (prev.has(i) ? prev : new Set(prev).add(i)))}
                  onPlay={() => { if (i === activeRef.current) setActivePlaying(true) }}
                  onPause={() => { if (i === activeRef.current) setActivePlaying(false) }}
                  onTimeUpdate={e => { if (i === activeRef.current) onTimeUpdate(e.currentTarget) }}
                  onError={() => markBroken(i)}
                  // Opaque: a letterboxed frame would otherwise show the product still
                  // above and below it.
                  className={`absolute inset-0 w-full h-full object-contain bg-[#1A1210] transition-opacity duration-300 ${revealed.has(i) ? 'opacity-100' : 'opacity-0'}`}
                />
                <button
                  ref={el => { toggles.current[i] = el }}
                  type="button"
                  onClick={togglePlay}
                  // Not disabled: a disabled button cannot hold the focus this
                  // slide hands it. The label carries the failure instead.
                  aria-label={broken.has(i) ? 'This video can’t play on this device' : isActive && activePlaying ? 'Pause video' : 'Play video'}
                  className="absolute inset-0 w-full h-full flex items-center justify-center focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
                >
                  {broken.has(i) ? (
                    <span aria-hidden="true" className="rounded-full bg-black/60 px-4 py-2 text-[12px] tracking-[0.08em]">This video can’t play on this device</span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`w-16 h-16 rounded-full bg-black/45 flex items-center justify-center transition-opacity duration-200 ${isActive && activePlaying ? 'opacity-0' : 'opacity-100'}`}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z" /></svg>
                    </span>
                  )}
                </button>
                <div className="absolute inset-x-0 bottom-0 p-4 pb-[max(16px,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/85 via-black/50 to-transparent pt-16">
                  <div className="flex items-center gap-3 rounded-[16px] bg-[#EDE8E0] text-[#2C2825] p-2.5 pr-3 shadow-lg">
                    <div className="relative w-14 h-14 flex-none rounded-[10px] overflow-hidden bg-[#E2DAD0]">
                      {item.poster && <Image src={item.poster} alt="" fill sizes="56px" className="object-contain p-1" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-serif text-[16px] leading-[1.25] truncate">{item.name}</div>
                      <div className="text-[14px] font-medium mt-0.5">₹{item.price.toLocaleString('en-IN')}</div>
                    </div>
                    <Link
                      href={`/collections/${item.slug}`}
                      data-view-product
                      className="flex-none rounded-full bg-[#A8552C] text-white px-4 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase no-underline hover:bg-[#8B4423] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C2825]"
                    >
                      View product
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Shared controls, outside the slides so they are never inert. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-white/25 pointer-events-none">
        <div ref={bar} className="h-full bg-white origin-left [transform:scaleX(0)] transition-transform duration-300 ease-linear" />
      </div>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[max(16px,env(safe-area-inset-top))] pointer-events-none">
        <button
          type="button"
          data-sound-toggle
          onClick={toggleSound}
          aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
          className="pointer-events-auto w-11 h-11 rounded-full bg-black/45 flex items-center justify-center hover:bg-black/70 transition-colors focus-visible:outline-2 focus-visible:outline-white"
        >
          {soundOn ? (
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>
          ) : (
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" /><path d="M23 9l-6 6M17 9l6 6" /></svg>
          )}
        </button>
        <button
          type="button"
          data-close
          onClick={() => dialog.current?.close()}
          aria-label="Close videos"
          className="pointer-events-auto w-11 h-11 rounded-full bg-black/45 flex items-center justify-center hover:bg-black/70 transition-colors focus-visible:outline-2 focus-visible:outline-white"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-3">
        <button
          type="button"
          data-prev
          onClick={() => go(active - 1)}
          disabled={active === 0}
          aria-label="Previous video"
          className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/30 disabled:opacity-30 transition-colors focus-visible:outline-2 focus-visible:outline-white"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>
        </button>
        <button
          type="button"
          data-next
          onClick={() => go(active + 1)}
          disabled={active === items.length - 1}
          aria-label="Next video"
          className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/30 disabled:opacity-30 transition-colors focus-visible:outline-2 focus-visible:outline-white"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </div>
      <p className="sr-only" aria-live="polite">{`Video ${active + 1} of ${items.length}: ${current.name}`}</p>
    </dialog>
  )
}
