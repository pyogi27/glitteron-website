'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FALLBACK_IMAGES = [
  'https://images.pexels.com/photos/1123262/pexels-photo-1123262.jpeg?auto=compress&cs=tinysrgb&w=600&h=700&fit=crop',
  'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600&h=700&fit=crop',
  'https://images.pexels.com/photos/1090638/pexels-photo-1090638.jpeg?auto=compress&cs=tinysrgb&w=600&h=700&fit=crop',
  'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600&h=700&fit=crop',
  'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600&h=700&fit=crop',
]

const STATIC_CATEGORIES = [
  { name: 'Crystal Chandelier', description: 'Opulent K9 crystal masterpieces' },
  { name: 'Pendant Light',      description: 'Contemporary suspended elegance' },
  { name: 'Sputnik Light',      description: 'Mid-century modern icons' },
  { name: 'Dome Light',         description: 'Sculptural minimalist shades' },
  { name: 'Cage & Industrial',  description: 'Raw geometry, refined craft' },
  { name: 'Wall Light',         description: 'Ambient accent lighting' },
]

export interface CollectionCategory {
  id?: number
  name: string
  description?: string
}

interface Props {
  categories?: CollectionCategory[]
}

export default function CollectionsSection({ categories = STATIC_CATEGORIES }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0, duration: 0.9,
          scrollTrigger: { trigger: headingRef.current, start: 'top 85%' },
        }
      )
      gsap.fromTo(
        cardsRef.current!.children,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.7, stagger: 0.1,
          scrollTrigger: { trigger: cardsRef.current, start: 'top 80%' },
        }
      )
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="py-24 bg-white">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Heading */}
        <div ref={headingRef} className="text-center mb-14 opacity-0">
          <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#C4714A] mb-4">
            Browse by Style
          </p>
          <h2 className="font-serif text-[clamp(34px,4.5vw,58px)] font-light leading-[1.1] text-[#2C2825]">
            Shop by <em className="italic text-[#C4714A]">Collection</em>
          </h2>
        </div>

        {/* Cards grid */}
        <div
          ref={cardsRef}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {categories.map((cat, i) => (
            <Link
              key={cat.id ?? cat.name}
              href={`/collections?category=${encodeURIComponent(cat.name)}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl aspect-[3/4] cursor-pointer"
            >
              {/* Image */}
              <img
                src={FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 [@media(hover:hover)]:group-hover:scale-105"
              />
              {/* Stock photography here ranges from near-black to near-white, so a
                  soft gradient can't guarantee contrast — the label measured
                  1.51:1 over the bright frames. Hold the bottom band opaque
                  enough to carry white text on any image. */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
              {/* Text */}
              <div className="relative mt-auto p-4 text-white">
                <p className="font-serif text-[16px] font-light leading-tight mb-1">{cat.name}</p>
                {/* The API sends description === name, which rendered every card as
                    "Bulbs / Bulbs". Only show a description that adds something. */}
                {cat.description && cat.description !== cat.name && (
                  <p className="text-[12px] text-white/85 tracking-wide">{cat.description}</p>
                )}
              </div>
              {/* Hover border */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-white/0 [@media(hover:hover)]:group-hover:ring-white/30 transition-all duration-300" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
