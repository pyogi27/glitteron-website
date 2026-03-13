// components/product/ProductGallery.tsx
'use client'
import { useState } from 'react'
import Image from 'next/image'

interface Props { images: string[]; name: string }

export default function ProductGallery({ images, name }: Props) {
  const [active, setActive] = useState(0)
  return (
    <div className="lg:sticky lg:top-[72px] flex gap-3.5 p-[32px_24px_32px_48px] bg-[#FAFAF8] h-[50vh] lg:h-[calc(100vh-72px)]">
      {/* Thumbnails */}
      <div className="hidden lg:flex flex-col gap-2.5 w-[76px] flex-shrink-0 overflow-y-auto">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`View image ${i + 1}`}
            className={`w-[76px] h-[76px] rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${active === i ? 'border-[#C8A96E]' : 'border-transparent'}`}
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
      <div className="flex-1 rounded-2xl overflow-hidden bg-[#F4F1EB] relative">
        <Image
          src={images[active]}
          alt={name}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="50vw"
          priority={active === 0}
        />
        <button
          type="button"
          aria-label="Zoom image"
          className="absolute bottom-4 right-4 bg-white/90 border border-[#E8E4DC] w-[38px] h-[38px] rounded-full flex items-center justify-center hover:bg-[#E8D5A3] transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35M8 11h6M11 8v6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
