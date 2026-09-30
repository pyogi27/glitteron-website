'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { VideoItem } from '@/lib/api/videos'
import { useMediaQuery, useSaveData } from '@/hooks/useMediaQuery'
import { playMuted, type PlayResult } from './videoPlayback'
import VideoPlayerModal from './VideoPlayerModal'

interface Props { items: VideoItem[] }

/** A card plays only while at least this much of it is on screen. */
const PLAY_RATIO = 0.6
/** Most cards playing at once: each holds one of S3's ~6 HTTP/1.1 connections. */
const MAX_PLAYING = { mobile: 1, desktop: 3 }
/** Card width + the track's gap-6, so one arrow press moves one card. */
const STEP = { mobile: 220 + 24, desktop: 260 + 24 }

export default function VideoCarousel({ items }: Props) {
  const track = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLButtonElement | null)[]>([])
  const videos = useRef<(HTMLVideoElement | null)[]>([])
  const ratios = useRef(new Map<number, number>())
  const opener = useRef<HTMLButtonElement | null>(null)

  const [playing, setPlaying] = useState<ReadonlySet<number>>(() => new Set())
  // Cards the scheduler leaves alone: autoplay refused (iOS Low Power Mode) or
  // a codec this browser cannot play (webm before iOS 17.4, HEVC on Chrome).
  const [skipped, setSkipped] = useState<ReadonlySet<number>>(() => new Set())
  // null follows the viewer's preference; the toggle records an explicit choice.
  const [pausedChoice, setPausedChoice] = useState<boolean | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const desktop = useMediaQuery('(min-width: 768px)')
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const saveData = useSaveData()
  // WCAG 2.2.2: autoplay may start by itself, but the toggle always stops it,
  // and reduced-motion / Save-Data viewers start paused until they opt in.
  const railPaused = pausedChoice ?? (reducedMotion || saveData)

  const skip = useCallback((i: number) => {
    setSkipped(prev => (prev.has(i) ? prev : new Set(prev).add(i)))
  }, [])

  const setCardPlaying = useCallback((i: number, on: boolean) => {
    setPlaying(prev => {
      if (prev.has(i) === on) return prev
      const next = new Set(prev)
      if (on) next.add(i)
      else next.delete(i)
      return next
    })
  }, [])

  // The observer callback outlives renders, so the scheduler reads live state
  // from here rather than from a stale closure.
  const live = useRef({ enabled: false, limit: 1, skipped: skipped as ReadonlySet<number> })

  const schedule = useCallback(() => {
    const { enabled, limit, skipped: skippedNow } = live.current
    let budget = enabled && document.visibilityState === 'visible' ? limit : 0
    videos.current.forEach((video, i) => {
      if (!video) return
      // intersectionRatio, not isIntersecting: a card scrolled out of the rail
      // sideways is clipped to ratio 0 but still reports isIntersecting.
      const inView = (ratios.current.get(i) ?? 0) >= PLAY_RATIO - 0.001
      if (budget > 0 && inView && !skippedNow.has(i)) {
        budget -= 1
        if (video.paused) {
          void playMuted(video).then((result: PlayResult) => {
            if (result === 'blocked' || result === 'unsupported') skip(i)
          })
        }
      } else if (!video.paused) {
        // Browsers do not pause script-started video that leaves the viewport.
        video.pause()
      }
    })
  }, [skip])

  useEffect(() => {
    live.current = {
      enabled: !railPaused && openIndex === null,
      limit: desktop ? MAX_PLAYING.desktop : MAX_PLAYING.mobile,
      skipped,
    }
    schedule()
  }, [railPaused, openIndex, desktop, skipped, schedule])

  useEffect(() => {
    videos.current.forEach((video, i) => {
      if (video && !video.canPlayType(items[i].type)) skip(i)
    })
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          ratios.current.set(Number((entry.target as HTMLElement).dataset.index), entry.intersectionRatio)
        }
        schedule()
      },
      { threshold: [0, PLAY_RATIO] },
    )
    cards.current.forEach(card => card && io.observe(card))
    // Pause while the tab is hidden; re-plan (not blindly resume) on return.
    document.addEventListener('visibilitychange', schedule)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', schedule)
    }
  }, [items, schedule, skip])

  const scrollBy = (dir: number) =>
    track.current?.scrollBy({ left: dir * (desktop ? STEP.desktop : STEP.mobile), behavior: 'smooth' })

  function openPlayer(i: number, card: HTMLButtonElement) {
    opener.current = card
    setOpenIndex(i)
  }

  function closePlayer() {
    setOpenIndex(null)
    // close() already restores focus, but not after a Safari mouse click
    // (buttons do not take focus there), so return it to the card explicitly.
    opener.current?.focus({ preventScroll: true })
  }

  return (
    <section aria-labelledby="watch-shop-heading" data-watch-shop className="py-[100px] px-4 md:px-12">
      <div className="flex items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] uppercase text-[#C4714A] mb-4">
            <span className="w-8 h-px bg-[#C4714A] inline-block" />
            Watch &amp; Shop
          </div>
          <h2 id="watch-shop-heading" className="font-serif text-[clamp(32px,4vw,52px)] font-light leading-[1.15]">
            See it <em className="italic">Lit</em>
          </h2>
        </div>
        <button
          type="button"
          data-rail-toggle
          onClick={() => setPausedChoice(!railPaused)}
          className="shrink-0 text-[12px] font-medium tracking-[0.1em] uppercase text-[#5A5249] hover:text-[#2C2825] active:text-[#2C2825] flex items-center gap-2 border-b border-[#BCAF9C] pb-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A8552C]"
        >
          {railPaused ? (
            <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l15 8-15 8z" /></svg>
          ) : (
            <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4h5v16H5zM14 4h5v16h-5z" /></svg>
          )}
          {railPaused ? 'Play videos' : 'Pause videos'}
        </button>
      </div>
      <div className="relative -mx-4 md:-mx-12">
        <button aria-label="Scroll left" onClick={() => scrollBy(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white border border-[#D8D0C4] rounded-full flex items-center justify-center z-10 shadow-md hover:bg-[#C4714A] hover:border-[#C4714A] transition-all hover:scale-[1.08] active:bg-[#C4714A] active:border-[#C4714A] active:scale-95">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        {/* Same outer/inner split and scroll-pl as ProductCarousel — see the
            comments there for why each is needed. */}
        <div
          ref={track}
          className="overflow-x-auto pb-6 scroll-pl-4 md:scroll-pl-12 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul role="list" className="flex gap-6 px-4 md:px-12 pt-4 pb-6">
            {items.map((item, i) => (
              <li key={item.productId} className="flex-none w-[220px] md:w-[260px] [scroll-snap-align:start]">
                <button
                  ref={el => { cards.current[i] = el }}
                  type="button"
                  data-video-card
                  data-index={i}
                  aria-label={`Watch video: ${item.name}`}
                  onClick={e => openPlayer(i, e.currentTarget)}
                  className="group relative block w-full aspect-[9/16] rounded-[20px] overflow-hidden bg-[#E2DAD0] transition-shadow duration-300 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A8552C]"
                >
                  {/* The poster. Not the video's poster attribute: that is
                      fetched eagerly for every card at page load, full size. */}
                  {item.poster && (
                    <Image src={item.poster} alt="" fill sizes="(min-width: 768px) 260px, 220px" className="object-contain p-6" />
                  )}
                  <video
                    ref={el => { videos.current[i] = el }}
                    data-rail-video
                    src={item.src}
                    muted
                    loop
                    playsInline
                    preload="none"
                    disablePictureInPicture
                    disableRemotePlayback
                    aria-hidden="true"
                    onPlaying={() => setCardPlaying(i, true)}
                    onPause={() => setCardPlaying(i, false)}
                    onError={() => skip(i)}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${playing.has(i) ? 'opacity-100' : 'opacity-0'}`}
                  />
                  <span
                    aria-hidden="true"
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/90 text-[#2C2825] flex items-center justify-center shadow-md transition-[opacity,transform] duration-300 group-hover:scale-110 ${playing.has(i) ? 'opacity-0' : 'opacity-100'}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z" /></svg>
                  </span>
                </button>
                <div className="pt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-serif text-[17px] font-normal leading-[1.3] text-[#2C2825] truncate">{item.name}</div>
                    <div className="text-[15px] font-medium text-[#2C2825] mt-1">₹{item.price.toLocaleString('en-IN')}</div>
                  </div>
                  <Link
                    href={`/collections/${item.slug}`}
                    data-shop-link
                    aria-label={`Shop ${item.name}`}
                    className="shrink-0 mt-1 text-[11px] font-medium tracking-[0.14em] uppercase text-[#5A5249] hover:text-[#2C2825] no-underline border-b border-[#BCAF9C] pb-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A8552C]"
                  >
                    Shop →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <button aria-label="Scroll right" onClick={() => scrollBy(1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white border border-[#D8D0C4] rounded-full flex items-center justify-center z-10 shadow-md hover:bg-[#C4714A] hover:border-[#C4714A] transition-all hover:scale-[1.08] active:bg-[#C4714A] active:border-[#C4714A] active:scale-95">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      {openIndex !== null && <VideoPlayerModal items={items} startIndex={openIndex} onClose={closePlayer} />}
    </section>
  )
}
