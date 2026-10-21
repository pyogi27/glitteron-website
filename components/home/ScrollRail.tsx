'use client'
import { useRef } from 'react'

const ARROW = 'absolute top-1/2 -translate-y-1/2 w-11 h-11 bg-white border border-[#D8D0C4] rounded-full flex items-center justify-center z-10 shadow-md text-[#2C2825] hover:bg-[#C4714A] hover:border-[#C4714A] transition-all hover:scale-[1.08] active:bg-[#C4714A] active:border-[#C4714A] active:scale-95'

/**
 * Horizontal card rail with scroll-snap and left/right arrows, shared by the homepage
 * carousels. Children are the snap items: give each `flex-none` and a fixed width.
 * Sits inside a `px-4 md:px-12` section and bleeds to its edges.
 */
export default function ScrollRail({ children }: { children: React.ReactNode }) {
  const track = useRef<HTMLDivElement>(null)
  const scrollBy = (dir: number) => track.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })

  return (
    <div className="relative -mx-4 md:-mx-12">
      <button aria-label="Scroll left" onClick={() => scrollBy(-1)} className={`${ARROW} left-2`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      {/* Outer: handles horizontal scroll only — must be a separate element from the track
          so that overflow-x:auto doesn't force overflow-y:auto (CSS spec limitation)

          scroll-pl must match the track's px below. scroll-snap-align: start snaps
          a card's edge to the SCROLLPORT edge, which the track's own padding does
          not move — so the browser was parking scrollLeft at 16 to sit the first
          card flush, eating that padding and bleeding the card to the viewport
          edge. scroll-padding is what insets the snap position. */}
      <div
        ref={track}
        className="overflow-x-auto pb-6 scroll-pl-4 md:scroll-pl-12 [scroll-snap-type:x_mandatory] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Inner: no overflow set, so the card's translateY(-10px) is never clipped vertically */}
        <div className="cards-track flex gap-6 px-4 md:px-12 pt-4 pb-6">
          {children}
        </div>
      </div>
      <button aria-label="Scroll right" onClick={() => scrollBy(1)} className={`${ARROW} right-2`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>
  )
}
