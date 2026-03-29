// components/product/ProductGallery.tsx
'use client'
import { useState, useCallback } from 'react'
import Image from 'next/image'

interface Props { images: string[]; name: string }

export default function ProductGallery({ images, name }: Props) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setLightbox(true)
  }, [])

  const closeLightbox = useCallback(() => setLightbox(false), [])

  const lightboxPrev = useCallback(() =>
    setLightboxIndex(i => (i - 1 + images.length) % images.length), [images.length])

  const lightboxNext = useCallback(() =>
    setLightboxIndex(i => (i + 1) % images.length), [images.length])

  return (
    <>
      <div className="lg:sticky lg:top-[72px] flex gap-3.5 p-[32px_24px_32px_48px] bg-[#EDE8E0] h-[50vh] lg:h-[calc(100vh-72px)]">
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

        {/* Main image */}
        <div className="flex-1 rounded-2xl overflow-hidden bg-[#E2DAD0] relative select-none">
          <Image
            src={images[active]}
            alt={name}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="50vw"
            priority={active === 0}
          />

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
              className="object-contain"
              sizes="100vw"
            />
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
