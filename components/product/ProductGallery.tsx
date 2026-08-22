// components/product/ProductGallery.tsx
'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import LightToggle from '@/components/ui/LightToggle'

interface Props { images: string[]; name: string; lightOnImage?: string }

export default function ProductGallery({ images, name, lightOnImage }: Props) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightOn, setLightOn] = useState(false)
  const [litFailed, setLitFailed] = useState(false)

  // The lit shot only corresponds to the primary image, so the overlay is
  // suppressed once the user browses to another angle. When it does show, the
  // off shot underneath fades out: both are alpha PNGs framed slightly
  // differently, so a base left at full opacity outlined a second lamp around
  // the lit one.
  const litSrc = litFailed ? undefined : lightOnImage
  const showLit = lightOn && Boolean(litSrc) && active === 0
  const showLitInLightbox = lightOn && Boolean(litSrc) && lightboxIndex === 0

  // Mobile carousel. Scroll position is the source of truth for `active`, so the dots
  // and the lit-image overlay stay in sync with what the shopper actually swiped to.
  const trackRef = useRef<HTMLDivElement>(null)
  const onTrackScroll = useCallback(() => {
    const el = trackRef.current
    if (!el || el.clientWidth === 0) return
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }, [])

  const scrollToIndex = useCallback((i: number) => {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }, [])

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setLightbox(true)
  }, [])

  const closeLightbox = useCallback(() => setLightbox(false), [])

  const lightboxPrev = useCallback(() =>
    setLightboxIndex(i => (i - 1 + images.length) % images.length), [images.length])

  const lightboxNext = useCallback(() =>
    setLightboxIndex(i => (i + 1) % images.length), [images.length])

  // Escape and arrows. Without these the lightbox is a keyboard trap: the only way out
  // was clicking the backdrop or the close button with a pointer.
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      else if (e.key === 'ArrowLeft') lightboxPrev()
      else if (e.key === 'ArrowRight') lightboxNext()
    }
    window.addEventListener('keydown', onKey)
    // Stop the page scrolling behind the overlay.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [lightbox, closeLightbox, lightboxPrev, lightboxNext])

  return (
    <>
      {/* self-start stops the grid stretching this cell to the row height, which is
          what lets `sticky` actually stick as the buy box and details scroll past. */}
      <div className="lg:sticky lg:top-header lg:self-start flex gap-3.5 p-[32px_24px_32px_48px] bg-[#EDE8E0] h-[50vh] lg:h-[calc(100vh-var(--spacing-header))]">
        {/* Thumbnails */}
        <div className="hidden lg:flex flex-col gap-2.5 w-[76px] flex-shrink-0 overflow-y-auto">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={`w-[76px] h-[76px] rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${active === i ? 'border-[#C4714A]' : 'border-transparent'}`}
            >
              <Image
                src={`${src.split('?')[0]}?auto=compress&cs=tinysrgb&w=76&h=76&fit=crop`}
                alt={`${name} thumbnail ${i + 1}`}
                width={76}
                height={76}
                className="object-cover w-full h-full hover:scale-[1.06] transition-transform duration-[400ms]"
              />
            </button>
          ))}
        </div>

        {/* Main image. Below lg this is a scroll-snap carousel — the thumbnail rail is
            desktop-only, so without it a phone shopper only ever saw image 1. */}
        <div className="flex-1 rounded-2xl overflow-hidden bg-[#E2DAD0] relative select-none">
          <div
            ref={trackRef}
            onScroll={onTrackScroll}
            className={`lg:hidden absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
              transition-opacity duration-500 ${showLit ? 'opacity-0' : 'opacity-100'}`}
          >
            {images.map((src, i) => (
              <div key={i} className="relative w-full h-full flex-shrink-0 snap-center">
                <Image
                  src={src}
                  alt={i === 0 ? name : `${name} view ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>

          <Image
            src={images[active]}
            alt={name}
            fill
            className={`hidden lg:block object-cover transition-opacity duration-500 ${showLit ? 'opacity-0' : 'opacity-100'}`}
            sizes="50vw"
            priority={active === 0}
          />

          {litSrc && (
            <Image
              src={litSrc}
              alt=""
              aria-hidden="true"
              fill
              className={`object-cover transition-opacity duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] ${showLit ? 'opacity-100' : 'opacity-0'}`}
              sizes="50vw"
              onError={() => setLitFailed(true)}
            />
          )}

          {/* Light on/off */}
          {litSrc && (
            <div className="absolute bottom-4 left-4 z-10 bg-white/90 border border-[#D8D0C4] rounded-full px-3.5 py-2">
              <LightToggle on={lightOn} onChange={setLightOn} />
            </div>
          )}

          {/* Mobile dots — the only affordance telling a phone shopper more photos exist */}
          {images.length > 1 && (
            <div className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 bg-white/80 rounded-full px-2.5 py-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to image ${i + 1} of ${images.length}`}
                  aria-current={i === active}
                  onClick={() => scrollToIndex(i)}
                  className="w-5 h-5 flex items-center justify-center cursor-pointer"
                >
                  <span
                    aria-hidden="true"
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === active ? 'bg-[#2C2825]' : 'bg-[#A09488]/50'}`}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Zoom button */}
          <button
            type="button"
            aria-label="Zoom image"
            onClick={() => openLightbox(active)}
            className="absolute bottom-4 right-4 bg-white/90 border border-[#D8D0C4] w-[38px] h-[38px] rounded-full flex items-center justify-center hover:bg-[#E8A87C] transition-all z-10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35M8 11h6M11 8v6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} images`}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Image container */}
          <div
            className="relative w-full h-full max-w-4xl max-h-[90vh] mx-auto flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex]}
              alt={`${name} ${lightboxIndex + 1}`}
              fill
              className={`object-contain transition-opacity duration-500 ${showLitInLightbox ? 'opacity-0' : 'opacity-100'}`}
              sizes="100vw"
            />
            {litSrc && (
              <Image
                src={litSrc}
                alt=""
                aria-hidden="true"
                fill
                className={`object-contain transition-opacity duration-500 ${showLitInLightbox ? 'opacity-100' : 'opacity-0'}`}
                sizes="100vw"
                onError={() => setLitFailed(true)}
              />
            )}
          </div>

          {/* Close */}
          <button
            type="button"
            aria-label="Close"
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={e => { e.stopPropagation(); lightboxPrev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={e => { e.stopPropagation(); lightboxNext() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </>
          )}

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={e => { e.stopPropagation(); setLightboxIndex(i) }}
                  className={`w-2 h-2 rounded-full transition-all ${i === lightboxIndex ? 'bg-white scale-125' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
