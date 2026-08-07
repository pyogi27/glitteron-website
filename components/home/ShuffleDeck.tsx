'use client'
import { useRef, useEffect, useCallback, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/lib/types'

interface Props { products: Product[] }

const STACK_POSITIONS = [
  { r: -9,   tx: -14, ty: 28 },
  { r: -5,   tx:  -7, ty: 14 },
  { r: -1.5, tx:  -2, ty:  5 },
  { r:  2.5, tx:   4, ty: 10 },
  { r:  0,   tx:   0, ty:  0 },
]

const FANNED_POSITIONS = [
  { r: -32, tx: -230, ty: 40 },
  { r: -16, tx: -115, ty: 14 },
  { r:   0, tx:    0, ty:  0 },
  { r:  16, tx:  115, ty: 14 },
  { r:  32, tx:  230, ty: 40 },
]

const FANNED_HOVER_TY = [16, -6, -12, -6, 16]

export default function ShuffleDeck({ products }: Props) {
  const deck = products.slice(0, 5)
  const deckRef      = useRef<HTMLDivElement>(null)
  const cardRefs     = useRef<(HTMLElement | null)[]>([])
  const activeIdxRef = useRef(deck.length - 1)
  const isBusyRef    = useRef(false)
  const isFannedRef  = useRef(false)
  const [activeIdx, setActiveIdx] = useState(deck.length - 1)
  // Mobile: which card is shown in the swipe view
  const [mobileIdx, setMobileIdx] = useState(0)
  const [isMobile, setIsMobile]   = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // ── Desktop: apply stacked positions ──
  const applyStack = useCallback((withTransition = true) => {
    const N = deck.length
    const active = activeIdxRef.current
    cardRefs.current.forEach((el, i) => {
      if (!el) return
      const distFromTop = ((active - i) + N) % N
      const posIdx = N - 1 - distFromTop
      const p = STACK_POSITIONS[posIdx]
      el.style.zIndex = String(posIdx + 1)
      if (withTransition) {
        el.style.transition = 'transform .55s cubic-bezier(.22,1,.36,1), box-shadow .4s, opacity .3s'
      }
      el.style.transform = `rotate(${p.r}deg) translate(${p.tx}px, ${p.ty}px)`
      el.style.opacity   = '1'
    })
  }, [deck.length])

  // ── Desktop: apply fanned positions ──
  const applyFanned = useCallback(() => {
    const N = deck.length
    const active = activeIdxRef.current
    cardRefs.current.forEach((el, i) => {
      if (!el) return
      const distFromTop = ((active - i) + N) % N
      const fanIdx = N - 1 - distFromTop
      const p = FANNED_POSITIONS[fanIdx]
      el.style.transition = 'transform .65s cubic-bezier(.34,1.18,.64,1), box-shadow .4s'
      el.style.transform  = `rotate(${p.r}deg) translate(${p.tx}px, ${p.ty}px)`
    })
  }, [deck.length])

  // ── Desktop: init on mount ──
  useEffect(() => {
    if (isMobile) return
    cardRefs.current.forEach((el, i) => {
      if (!el) return
      const N = deck.length
      const active = activeIdxRef.current
      const distFromTop = ((active - i) + N) % N
      const posIdx = N - 1 - distFromTop
      const p = STACK_POSITIONS[posIdx]
      el.style.transition = 'none'
      el.style.zIndex     = String(posIdx + 1)
      el.style.transform  = `rotate(${p.r}deg) translate(${p.tx}px, ${p.ty}px)`
      el.style.opacity    = '1'
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

  // ── Desktop: auto-pulse on scroll into view ──
  useEffect(() => {
    if (isMobile) return
    const el = deckRef.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            if (!isBusyRef.current && !isFannedRef.current) {
              isFannedRef.current = true
              applyFanned()
              setTimeout(() => {
                isFannedRef.current = false
                applyStack()
              }, 1200)
            }
          }, 600)
          obs.unobserve(el)
        }
      })
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [isMobile, applyFanned, applyStack])

  // ── Desktop: deck hover ──
  const handleDeckEnter = useCallback(() => {
    if (isBusyRef.current) return
    isFannedRef.current = true
    applyFanned()
  }, [applyFanned])

  const handleDeckLeave = useCallback(() => {
    isFannedRef.current = false
    applyStack()
  }, [applyStack])

  // ── Desktop: individual card hover lift ──
  const handleCardEnter = useCallback((fanIdx: number) => {
    if (!isFannedRef.current) return
    const N = deck.length
    const active = activeIdxRef.current
    const el = cardRefs.current.find((_, i) => {
      const distFromTop = ((active - i) + N) % N
      return N - 1 - distFromTop === fanIdx
    })
    if (!el) return
    const p = FANNED_POSITIONS[fanIdx]
    el.style.transition = 'transform .35s cubic-bezier(.34,1.18,.64,1), box-shadow .3s'
    el.style.transform  = `rotate(${p.r}deg) translate(${p.tx}px, ${FANNED_HOVER_TY[fanIdx]}px) scale(1.05)`
    el.style.boxShadow  = '0 30px 72px rgba(196,113,74,.25), 0 12px 32px rgba(0,0,0,.5)'
  }, [deck.length])

  const handleCardLeave = useCallback((fanIdx: number) => {
    if (!isFannedRef.current) return
    const N = deck.length
    const active = activeIdxRef.current
    const el = cardRefs.current.find((_, i) => {
      const distFromTop = ((active - i) + N) % N
      return N - 1 - distFromTop === fanIdx
    })
    if (!el) return
    const p = FANNED_POSITIONS[fanIdx]
    el.style.transition = 'transform .5s cubic-bezier(.34,1.18,.64,1), box-shadow .4s'
    el.style.transform  = `rotate(${p.r}deg) translate(${p.tx}px, ${p.ty}px) scale(1)`
    el.style.boxShadow  = ''
  }, [deck.length])

  // ── Desktop: shuffle ──
  const shuffle = useCallback(() => {
    if (isBusyRef.current) return
    isBusyRef.current = true
    isFannedRef.current = false

    const N = deck.length
    const active = activeIdxRef.current
    const topEl = cardRefs.current[active]
    if (!topEl) { isBusyRef.current = false; return }

    const flyX = (Math.random() > 0.5 ? 1 : -1) * (280 + Math.random() * 80)
    const flyR = flyX > 0 ? 25 : -25
    topEl.style.transition = 'transform .4s cubic-bezier(.55,.05,.67,.19), opacity .35s'
    topEl.style.transform  = `rotate(${flyR}deg) translate(${flyX}px, -160px) scale(.82)`
    topEl.style.opacity    = '0'
    topEl.style.zIndex     = String(N + 1)

    setTimeout(() => {
      topEl.style.transition = 'none'
      topEl.style.opacity    = '0'
      topEl.style.zIndex     = '0'
      topEl.style.transform  = `rotate(${flyR * 0.5}deg) translate(0, 60px) scale(.9)`

      activeIdxRef.current = (active - 1 + N) % N
      setActiveIdx(activeIdxRef.current)
      applyStack(true)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          topEl.style.transition = 'opacity .3s ease, transform .55s cubic-bezier(.22,1,.36,1)'
          topEl.style.opacity    = '1'
        })
      })

      setTimeout(() => { isBusyRef.current = false }, 600)
    }, 420)
  }, [deck.length, applyStack])

  // ── Mobile: swipe navigation ──
  const mobilePrev = () => setMobileIdx(i => (i - 1 + deck.length) % deck.length)
  const mobileNext = () => setMobileIdx(i => (i + 1) % deck.length)

  // fetchProducts returns { products: [] } on any backend failure, so deck can
  // be empty. The mobile branch below reads deck[mobileIdx].images[0], which
  // threw a TypeError and white-screened the page. A deck of nothing has no
  // section to render.
  if (deck.length === 0) return null

  // ─────────────────────────────────────────
  // MOBILE LAYOUT
  // ─────────────────────────────────────────
  if (isMobile) {
    const product = deck[mobileIdx % deck.length]
    return (
      <section className="bg-[#EDE8E0] py-16 px-6 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 70% 30%, rgba(196,113,74,.1) 0%, transparent 65%)' }} />

        {/* Heading */}
        <div className="text-center mb-8 relative z-10">
          <div className="text-[10px] font-medium tracking-[0.22em] uppercase text-[#A8552C] mb-3">Curated For You</div>
          <h2 className="font-serif text-[36px] font-light text-[#2C2825] leading-[1.05]">
            Find your <em className="italic text-[#A8552C]">light</em>
          </h2>
          <p className="text-[13px] font-light text-[#2C2825]/65 leading-[1.8] mt-3 max-w-[300px] mx-auto">
            Tap through our curated picks to find the perfect light for your space.
          </p>
        </div>

        {/* Card + nav */}
        <div className="relative z-10 flex items-center justify-center gap-4">
          {/* Prev */}
          <button
            onClick={mobilePrev}
            className="w-9 h-9 rounded-full border border-[#D8D0C4] flex items-center justify-center text-[#8B7D6E] transition-colors hover:border-[#A8552C] hover:text-[#A8552C] flex-shrink-0"
            aria-label="Previous"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          {/* Card — a link, not a dead div. Tapping a light you like should open
              it, not advance the carousel. */}
          <Link
            href={`/collections/${product.slug}`}
            className="relative rounded-[20px] overflow-hidden flex-shrink-0 block no-underline"
            style={{
              width: 260,
              height: 340,
              border: '1px solid rgba(196,113,74,.14)',
              boxShadow: '0 16px 48px rgba(0,0,0,.5), inset 0 2px 0 rgba(196,113,74,.1)',
            }}
          >
            {/* Vignette */}
            <div className="absolute inset-0 z-[1] pointer-events-none rounded-[inherit]"
              style={{ background: 'linear-gradient(160deg, rgba(196,113,74,.12) 0%, transparent 45%, rgba(26,18,16,.55) 100%)' }} />

            <Image
              key={product.id}
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="260px"
            />

            {/* Label always visible on mobile */}
            <div className="absolute bottom-0 left-0 right-0 z-[2] px-5 pb-5 pt-8"
              style={{ background: 'linear-gradient(to top, rgba(26,18,16,.9) 0%, transparent 100%)' }}
            >
              <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[#C4714A] mb-1">{product.category}</div>
              <div className="font-serif text-[17px] font-normal text-white leading-[1.2]">{product.name}</div>
              <div className="text-[13px] text-white/80 mt-1">₹{product.price.toLocaleString('en-IN')}</div>
            </div>
          </Link>

          {/* Next */}
          <button
            onClick={mobileNext}
            className="w-9 h-9 rounded-full border border-[#D8D0C4] flex items-center justify-center text-[#8B7D6E] transition-colors hover:border-[#A8552C] hover:text-[#A8552C] flex-shrink-0"
            aria-label="Next"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2.5 mt-6">
          {deck.map((_, i) => (
            <button
              key={i}
              onClick={() => setMobileIdx(i)}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                background: i === mobileIdx ? '#A8552C' : 'rgba(44,40,37,.22)',
                transform: i === mobileIdx ? 'scale(1.4)' : 'scale(1)',
              }}
              aria-label={`Go to card ${i + 1}`}
            />
          ))}
          <span className="text-[11px] text-[#8B7D6E] ml-1">{mobileIdx + 1} / {deck.length}</span>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 mt-8">
          <button
            onClick={mobileNext}
            className="inline-flex items-center gap-2.5 bg-transparent border border-[#A8552C] text-[#A8552C] px-7 py-3 rounded-[40px] font-sans text-[11px] font-semibold tracking-[0.12em] uppercase"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
            </svg>
            Next Card
          </button>
          <Link
            href="/collections"
            className="text-[12px] font-light tracking-[0.1em] uppercase text-[#8B7D6E] no-underline"
          >
            Browse All →
          </Link>
        </div>
      </section>
    )
  }

  // ─────────────────────────────────────────
  // DESKTOP LAYOUT
  // ─────────────────────────────────────────
  return (
    <section className="bg-[#EDE8E0] py-[110px] px-6 md:px-20 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[60%] h-[140%] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(196,113,74,.11) 0%, transparent 65%)' }} />
      <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[60%] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(196,113,74,.06) 0%, transparent 60%)' }} />

      {/* Left text */}
      <div className="flex-1 max-w-[500px] text-center lg:text-left relative z-10">
        <div className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#A8552C] mb-5">Curated For You</div>
        <h2 className="font-serif text-[clamp(34px,4.2vw,58px)] font-light text-[#2C2825] leading-[1.05] mb-6">
          Find your <em className="italic text-[#A8552C]">light</em>
        </h2>
        <p className="text-[14px] font-light text-[#2C2825]/70 leading-[1.85] mb-8 max-w-[380px] mx-auto lg:mx-0">
          From grand crystal chandeliers to minimal pendants — our collection holds a light for every taste. Pick any card to see the piece.
        </p>

        <div className="flex flex-wrap gap-4 justify-center lg:justify-start items-center">
          <button
            onClick={shuffle}
            className="inline-flex items-center gap-2.5 bg-transparent border border-[#A8552C] text-[#A8552C] px-7 py-3 rounded-[40px] font-sans text-[11px] font-semibold tracking-[0.12em] uppercase transition-all duration-300 hover:bg-[#A8552C] hover:border-[#A8552C] hover:text-white hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
            </svg>
            Shuffle Cards
          </button>
          <span className="text-[12px] text-[#8B7D6E] font-light tracking-wide">or hover to fan out</span>
        </div>

        {/* Counter dots */}
        <div className="flex items-center gap-3 mt-9 justify-center lg:justify-start">
          {deck.map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                background: i === activeIdx ? '#A8552C' : 'rgba(44,40,37,.22)',
                transform: i === activeIdx ? 'scale(1.35)' : 'scale(1)',
              }}
            />
          ))}
          <span className="text-[11px] text-[#8B7D6E] ml-1">{activeIdx + 1} / {deck.length}</span>
        </div>

        <div className="mt-8">
          <Link
            href="/collections"
            className="text-[12px] font-light tracking-[0.1em] uppercase text-[#8B7D6E] no-underline transition-colors hover:text-[#A8552C]"
          >
            Browse All →
          </Link>
        </div>
      </div>

      {/* Card deck. The fan spans 310px + 2×230px of translate = 770px, so the
          box has to be at least that wide or the outer cards clip at 1440. */}
      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 780, height: 540 }}>
        <div
          ref={deckRef}
          onMouseEnter={handleDeckEnter}
          onMouseLeave={handleDeckLeave}
          style={{ position: 'relative', width: 310, height: 420, transformStyle: 'preserve-3d' }}
        >
          {deck.map((product, i) => {
            const getFanIdx = () => {
              const N = deck.length
              const active = activeIdxRef.current
              const distFromTop = ((active - i) + N) % N
              return N - 1 - distFromTop
            }
            return (
              <Link
                key={product.id}
                href={`/collections/${product.slug}`}
                ref={el => { cardRefs.current[i] = el }}
                onMouseEnter={() => handleCardEnter(getFanIdx())}
                onMouseLeave={() => handleCardLeave(getFanIdx())}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 20,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid rgba(196,113,74,.14)',
                  boxShadow: '0 8px 32px rgba(0,0,0,.45), inset 0 2px 0 rgba(196,113,74,.1)',
                  willChange: 'transform',
                  transformOrigin: '50% 110%',
                }}
              >
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 'inherit', zIndex: 1, pointerEvents: 'none',
                  background: 'linear-gradient(160deg, rgba(196,113,74,.12) 0%, transparent 45%, rgba(26,18,16,.55) 100%)',
                }} />
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="310px"
                  draggable={false}
                />
                {/* Always visible. These cards are links now, and a link whose
                    label only appears on hover tells you nothing about where
                    it goes — on touch, nothing at all. */}
                <div className="absolute bottom-0 left-0 right-0 z-[2] px-[22px] pb-[22px] pt-[30px]"
                  style={{ background: 'linear-gradient(to top, rgba(26,18,16,.9) 0%, transparent 100%)' }}
                >
                  <div className="text-[9px] font-semibold tracking-[0.18em] uppercase text-[#C4714A] mb-1">{product.category}</div>
                  <div className="font-serif text-[18px] font-normal text-white leading-[1.2]">{product.name}</div>
                  <div className="text-[13px] text-white/80 mt-1">₹{product.price.toLocaleString('en-IN')}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

    </section>
  )
}
