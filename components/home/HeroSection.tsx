'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import Link from 'next/link'

export default function HeroSection() {
  const eyebrow = useRef<HTMLParagraphElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const subtitle = useRef<HTMLParagraphElement>(null)
  const actions = useRef<HTMLDivElement>(null)
  const scroll = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()
      tl.fromTo(eyebrow.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.3 })
        .fromTo(title.current,   { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9 }, '-=0.4')
        .fromTo(subtitle.current,{ opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9 }, '-=0.5')
        .fromTo(actions.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9 }, '-=0.5')
        .fromTo(scroll.current,  { opacity: 0 },         { opacity: 1, duration: 1 }, '-=0.2')
    })
    return () => ctx.revert()
  }, [])

  return (
    <section className="relative h-screen min-h-[680px] flex items-center justify-center overflow-hidden">
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/hero-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      >
        {/* ponytail: native <source media> picks the file — no JS, no resize listener.
            Locked at load; a desktop→mobile resize keeps the desktop file. Fine for a background. */}
        <source src="/website_video.mp4" media="(min-width: 768px)" type="video/mp4" />
        <source src="/mobile_video.mp4" type="video/mp4" />
      </video>
      {/* Dark fallback background */}
      <div className="absolute inset-0 bg-[#1A1210]" style={{ zIndex: -1 }} />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/52 via-black/38 to-black/60 z-[1]" />

      {/* Glow orbs */}
      <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(196,113,74,0.18)_0%,transparent_65%)] animate-[flicker1_4s_ease-in-out_infinite] z-[2]" />
      <div className="absolute top-[10%] right-[20%] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(230,180,80,0.12)_0%,transparent_65%)] animate-[flicker2_3s_ease-in-out_infinite_1.5s] z-[2]" />
      <div className="absolute bottom-[25%] left-[55%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(196,113,74,0.1)_0%,transparent_65%)] animate-[flicker1_5s_ease-in-out_infinite_0.7s] z-[2]" />

      {/* Content */}
      <div className="relative z-[3] text-center text-white max-w-[760px] px-6">
        <p ref={eyebrow} className="text-[11px] font-medium tracking-[0.22em] uppercase text-[rgba(237,232,224,0.72)] mb-6 opacity-0">
          Premium Chandeliers &amp; Pendant Lights
        </p>
        <h1 ref={title} className="font-serif text-[clamp(52px,7vw,92px)] font-light leading-[1.05] tracking-[-0.01em] mb-7 opacity-0">
          Where Light Becomes <em className="italic text-[#F5F0EB]">Art</em>
        </h1>
        <p ref={subtitle} className="text-[15px] font-light text-white/65 max-w-[480px] mx-auto mb-10 leading-[1.8] opacity-0">
          Curated chandeliers and pendant lights that transform every room into a masterpiece. Crafted for those who believe ambiance is everything.
        </p>
        <div ref={actions} className="flex gap-4 justify-center opacity-0">
          <Link href="/collections" className="bg-[#E2DAD0] text-[#2C2825] border-none px-9 py-3.5 rounded-3xl font-sans text-[13px] font-medium tracking-[0.08em] uppercase no-underline inline-flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(196,113,74,0.4)]">
            Explore Collection
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div ref={scroll} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 text-[10px] tracking-[0.18em] uppercase opacity-0">
        <div className="w-px h-12 bg-gradient-to-b from-[#C4714A]/60 to-transparent animate-[scrollLine_2s_ease-in-out_infinite]" />
        Scroll
      </div>
    </section>
  )
}
