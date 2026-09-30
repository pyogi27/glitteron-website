import Link from 'next/link'

/**
 * Server component on purpose. The reveal is a CSS animation (.hero-reveal in
 * globals.css) rather than a GSAP timeline in useEffect, because the <h1> is
 * this page's LCP element — gating its first paint on hydration cost 4.5s of
 * render delay. Nothing here needs client JS now, so none is shipped, and the
 * hero renders with scripting unavailable.
 *
 * Resting opacity is below 1 on the type and the button: the video shows
 * through them.
 */
export default function HeroSection() {
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
        <h1
          className="hero-reveal font-serif text-[clamp(52px,7vw,92px)] font-light leading-[1.05] tracking-[-0.01em] text-balance mb-10"
          style={{ '--hero-opacity': 0.78, '--hero-delay': '0.15s' } as React.CSSProperties}
        >
          Where Light Becomes <em className="italic text-[#F5F0EB]">an Art</em>
          {/* The visible h1 is deliberately atmospheric; this carries the terms
              the page actually ranks for, for crawlers and screen readers. */}
          <span className="sr-only">
            {' '}— handcrafted chandeliers and pendant lights
          </span>
        </h1>
        <div
          className="hero-reveal flex gap-4 justify-center"
          style={{ '--hero-opacity': 0.85, '--hero-delay': '0.5s' } as React.CSSProperties}
        >
          <Link href="/collections" className="bg-[#E2DAD0]/25 text-white border border-white/45 px-9 py-3.5 rounded-3xl font-sans text-[13px] font-medium tracking-[0.08em] uppercase no-underline inline-flex items-center gap-2 backdrop-blur-[2px] transition-all hover:bg-[#E2DAD0]/40 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(196,113,74,0.4)]">
            Explore Collection
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="hero-fade absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 text-[10px] tracking-[0.18em] uppercase"
        style={{ '--hero-delay': '0.9s' } as React.CSSProperties}
      >
        <div className="w-px h-12 bg-gradient-to-b from-[#C4714A]/60 to-transparent animate-[scrollLine_2s_ease-in-out_infinite]" />
        Scroll
      </div>
    </section>
  )
}
