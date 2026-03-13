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
      {/* Dark background */}
      <div className="absolute inset-0 bg-[#1A1210]" />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/52 via-black/38 to-black/60 z-[1]" />
      {/* Glow orbs */}
      <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(196,113,74,0.18)_0%,transparent_65%)] animate-pulse z-[2]" />
      <div className="absolute top-[10%] right-[20%] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(230,180,80,0.12)_0%,transparent_65%)] z-[2]" />

      {/* Content */}
      <div className="relative z-[3] text-center text-white max-w-[760px] px-6">
        <p ref={eyebrow} className="text-[11px] font-medium tracking-[0.22em] uppercase text-white/70 mb-6 opacity-0">
          Handcrafted Lighting Since 2010
        </p>
        <h1 ref={title} className="font-serif text-[clamp(52px,7vw,92px)] font-light leading-[1.05] tracking-[-0.01em] mb-7 opacity-0">
          Light that <em className="italic text-[#F5F0EB]">speaks</em><br />to the soul
        </h1>
        <p ref={subtitle} className="text-[15px] font-light text-white/65 max-w-[480px] mx-auto mb-10 leading-[1.8] opacity-0">
          Discover 500+ handcrafted chandeliers and pendant lights, curated for spaces that deserve to glow.
        </p>
        <div ref={actions} className="flex gap-4 justify-center opacity-0">
          <Link href="/collections" className="bg-[#F4F1EB] text-[#1A1714] border-none px-9 py-3.5 rounded-3xl font-sans text-[13px] font-medium tracking-[0.08em] uppercase no-underline inline-flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(196,113,74,0.4)]">
            Explore Collections →
          </Link>
          <button type="button" className="bg-transparent border border-white/30 text-white px-9 py-3.5 rounded-3xl font-sans text-[13px] font-light tracking-[0.08em] uppercase transition-all hover:border-[#C8A96E] hover:bg-[#C8A96E]/10">
            Watch Story
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div ref={scroll} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 text-[10px] tracking-[0.18em] uppercase opacity-0">
        <div className="w-px h-12 bg-gradient-to-b from-[#C8A96E]/60 to-transparent animate-[scrollLine_2s_ease-in-out_infinite]" />
        Scroll
      </div>
    </section>
  )
}
