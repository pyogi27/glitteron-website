'use client'
import { useEffect, useRef, useState } from 'react'
import StarRating from '@/components/ui/StarRating'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { GoogleReview } from '@/lib/googleReviews'

const ROTATE_MS = 4000

/**
 * One review at a time: every ROTATE_MS the current card slides up and out while the
 * next rises in from below. Pure CSS transitions on transform/opacity, keyed off
 * each card's offset from `index`:
 *   0  in place          -1  above, faded (the one that just left)
 *   +1 below, faded      else below, faded, transition off so it snaps back unseen
 * Only -1/0/+1 animate, which is what lets the loop wrap without a visible jump.
 */
export default function GoogleReviewsTicker({ reviews }: { reviews: GoogleReview[] }) {
  // Fewer than 3 slots would send a card from "above" straight back to "in place",
  // sliding down instead of up; repeating the list keeps the cycle one-directional.
  const slots = reviews.length === 2 ? [...reviews, ...reviews] : reviews
  const n = slots.length

  const [index, setIndex] = useState(0)
  // null follows the viewer's preference; the button records an explicit choice (WCAG 2.2.2).
  const [pausedChoice, setPausedChoice] = useState<boolean | null>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const rootRef = useRef<HTMLDivElement>(null)

  const paused = pausedChoice ?? reducedMotion
  const running = n > 1 && !paused && !hovered && !focused && onScreen && tabVisible

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    io.observe(el)
    const onVisibility = () => setTabVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setIndex(i => (i + 1) % n), ROTATE_MS)
    return () => clearInterval(id)
  }, [running, n])

  const step = (delta: number) => setIndex(i => (i + delta + n) % n)

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
    >
      <div
        className="relative h-[300px] overflow-hidden"
        role="region"
        aria-live="off"
        aria-roledescription="carousel"
        aria-label="Google reviews"
      >
        {slots.map((r, i) => {
          const offset = (i - index + n) % n
          const position =
            offset === 0 ? 'translate-y-0 opacity-100'
            : offset === n - 1 ? '-translate-y-full opacity-0'
            : 'translate-y-full opacity-0'
          const animates = offset === 0 || offset === 1 || offset === n - 1
          return (
            <article
              key={`${r.id}-${i}`}
              aria-hidden={offset !== 0}
              inert={offset !== 0}
              className={`absolute inset-0 bg-[#E6DFD5] border border-[#CFC5B6] rounded-2xl p-7 flex flex-col ${position} ${
                animates ? 'transition-[transform,opacity] duration-[600ms] ease-out motion-reduce:transition-none' : ''
              }`}
            >
              <StarRating rating={r.rating} size={14} />
              <p className="font-serif text-[18px] italic leading-[1.6] text-[#2C2825] mt-4 line-clamp-4">
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="mt-auto pt-5 flex items-center gap-3">
                {r.authorPhoto ? (
                  // Loaded straight from Google rather than through next/image, which would
                  // store a copy in .next/cache/images.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.authorPhoto}
                    alt=""
                    width={36}
                    height={36}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full border border-[#BCAF9C] object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#D3C8B8] border border-[#BCAF9C] flex items-center justify-center font-serif text-[15px] text-[#6B3F22]">
                    {r.author[0]}
                  </div>
                )}
                <div className="min-w-0">
                  {r.authorUrl ? (
                    <a href={r.authorUrl} target="_blank" rel="noopener noreferrer" className="block truncate text-[14px] font-medium text-[#2C2825] hover:text-[#C4714A] transition-colors">
                      {r.author}
                    </a>
                  ) : (
                    <div className="truncate text-[14px] font-medium text-[#2C2825]">{r.author}</div>
                  )}
                  <div className="text-[12px] text-[#5A5249]">{r.relativeTime}</div>
                </div>
                {r.reviewUrl && (
                  <a href={r.reviewUrl} target="_blank" rel="noopener noreferrer" className="ml-auto shrink-0 text-[12px] text-[#5A5249] underline underline-offset-2 hover:text-[#C4714A] transition-colors">
                    View on Google Maps
                  </a>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {n > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <ControlButton label="Previous review" onClick={() => step(-1)}>
            <path d="M15 18l-6-6 6-6" />
          </ControlButton>
          <ControlButton
            label={paused ? 'Play reviews' : 'Pause reviews'}
            onClick={() => setPausedChoice(!paused)}
          >
            {paused ? <path d="M8 5v14l11-7z" /> : <path d="M9 5v14M15 5v14" />}
          </ControlButton>
          <ControlButton label="Next review" onClick={() => step(1)}>
            <path d="M9 18l6-6-6-6" />
          </ControlButton>
        </div>
      )}
    </div>
  )
}

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="w-10 h-10 rounded-full border border-[#CFC5B6] text-[#2C2825] flex items-center justify-center hover:bg-[#2C2825] hover:text-[#EDE8E0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C4714A] transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  )
}
