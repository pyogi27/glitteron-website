'use client'
import { useEffect, useState } from 'react'
import { dealTimeLeft, splitCountdown } from '@/lib/dealOfTheDay'

const PLACEHOLDER = ['--', '--', '--'] as const

/** "Ends In HH : MM : SS" to today's 23:59:59 IST, ticking every second. */
export default function DealCountdown() {
  // null until mounted: the server cannot know the visitor's clock, so the server HTML
  // and the first client render both show the placeholder and hydration matches.
  const [msLeft, setMsLeft] = useState<number | null>(null)
  useEffect(() => {
    // Recomputed from the clock each tick, so a throttled background tab catches up
    // instead of drifting, and the rollover at 0 is dealTimeLeft's job.
    const tick = () => setMsLeft(dealTimeLeft(Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const parts = msLeft == null ? PLACEHOLDER : splitCountdown(msLeft)

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <span aria-hidden="true" className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#D9C3A0]">Ends In</span>
      <span id="deal-timer-label" className="sr-only">Today&apos;s deals end at 11:59:59 PM India time. Time left:</span>
      {/* aria-live="off": a screen reader can read the time on demand but is not
          interrupted every second. */}
      <div role="timer" aria-live="off" aria-labelledby="deal-timer-label" className="flex items-center gap-1.5 sm:gap-2">
        {parts.map((value, i) => (
          <span key={i} className="flex items-center gap-1.5 sm:gap-2">
            {i > 0 && <span aria-hidden="true" className="text-[22px] text-[#C08A3E]">:</span>}
            <span className="inline-flex h-[50px] w-[52px] items-center justify-center rounded-[10px] border border-[#C08A3E]/45 bg-[#F2C46D]/[0.07] text-[24px] font-medium tabular-nums text-[#F2C46D]">
              {value}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
