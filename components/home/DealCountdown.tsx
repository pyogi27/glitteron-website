'use client'
import { useEffect, useState } from 'react'
import { dealTimeLeft, splitCountdown } from '@/lib/dealOfTheDay'

const PLACEHOLDER = ['--', '--', '--'] as const
const UNITS = ['h', 'm', 's'] as const

/** "Ends in HHh MMm SSs" to today's 23:59:59 IST, ticking every second. */
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

  // Set in type, not boxes: tabular figures keep the width still as the seconds tick.
  return (
    <div className="mt-5 flex items-baseline gap-3 whitespace-nowrap">
      <span aria-hidden="true" className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C4714A]">Ends in</span>
      <span id="deal-timer-label" className="sr-only">Today&apos;s deals end at 11:59:59 PM India time. Time left:</span>
      {/* aria-live="off": a screen reader can read the time on demand but is not
          interrupted every second. */}
      <div role="timer" aria-live="off" aria-labelledby="deal-timer-label" className="flex items-baseline gap-2 text-[20px] font-normal tabular-nums text-white">
        {parts.map((value, i) => (
          <span key={i}>
            {/* 2ch: the "--" placeholder is narrower than two digits, so without it the
                units shift sideways when the clock mounts. */}
            <span className="inline-block min-w-[2ch]">{value}</span>
            <span className="ml-0.5 text-[11px] font-medium text-[#C4714A]">{UNITS[i]}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
