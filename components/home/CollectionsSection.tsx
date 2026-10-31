'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { categoryPath } from '@/lib/data/categories'

gsap.registerPlugin(ScrollTrigger)

const FALLBACK_IMAGES = [
  'https://images.pexels.com/photos/1123262/pexels-photo-1123262.jpeg?auto=compress&cs=tinysrgb&w=600&h=700&fit=crop',
  'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=600&h=700&fit=crop',
  'https://images.pexels.com/photos/1090638/pexels-photo-1090638.jpeg?auto=compress&cs=tinysrgb&w=600&h=700&fit=crop',
  'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600&h=700&fit=crop',
  'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600&h=700&fit=crop',
]

const STATIC_CATEGORIES = [
  { name: 'Crystal Chandelier' },
  { name: 'Pendant Light' },
  { name: 'Sputnik Light' },
  { name: 'Dome Light' },
  { name: 'Cage & Industrial' },
  { name: 'Wall Light' },
]

export interface CollectionCategory {
  id?: number
  name: string
  image?: string | null
  hoverImage?: string | null
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
          <h2 className="font-serif text-[clamp(34px,4.5vw,58px)] font-normal leading-[1.1] text-[#2C2825]">
            Shop by <em className="text-[#C4714A]">Collection</em>
          </h2>
        </div>

        {/* Cards grid */}
        <div
          ref={cardsRef}
          // Flex-wrap rather than grid so an odd card count (7 today) centres the
          // last row instead of leaving an orphan hanging off the left edge.
          className="flex flex-wrap justify-center gap-4"
        >
          {categories.map((cat, i) => {
            const image = cat.image?.trim()
            return (
              <Link
                key={cat.id ?? cat.name}
                // Flat landing page where we have one; the filter view is the fallback
                // for any category the backend adds before we write copy for it.
                href={categoryPath(cat.name) ?? `/collections?category=${encodeURIComponent(cat.name)}`}
                // Staggered only on the single desktop row; wrapped rows would look ragged.
                className="group flex flex-col cursor-pointer w-[calc((100%-16px)/2)] md:w-[calc((100%-48px)/4)] lg:w-[calc((100%-96px)/7)] lg:even:mt-7 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dark"
              >
                {/* Arch frame, echoing the logo. Category art is a cutout on a neutral
                    ground, so it sits on a sand surface instead of under a dark
                    gradient. Multiply drops any off-white matte into the sand. */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-2xl border border-warm-gray bg-[radial-gradient(120%_70%_at_50%_35%,#F3EEE6_0%,var(--color-offwhite)_100%)] transition-colors duration-500 [@media(hover:hover)]:group-hover:border-brand-clay">
                  {/* Hover glow: its own layer because gradients cannot be transitioned. */}
                  <div className="absolute inset-0 opacity-0 bg-[radial-gradient(120%_70%_at_50%_30%,#F6DDB0_0%,#E8C890_55%,transparent_100%)] transition-opacity duration-500 [@media(hover:hover)]:group-hover:opacity-100" />
                  <img
                    src={image || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]}
                    // Decorative: the label below already names the link.
                    alt=""
                    className={
                      image
                        ? 'absolute inset-x-[6%] top-[8%] h-[88%] w-[88%] object-contain mix-blend-multiply transition-transform duration-700 ease-out [@media(hover:hover)]:group-hover:-translate-y-2 [@media(hover:hover)]:group-hover:scale-105'
                        : 'absolute inset-0 h-full w-full object-cover transition-transform duration-700 [@media(hover:hover)]:group-hover:scale-105'
                    }
                  />
                  {/* Optional hover image, stacked over the main one and faded in: no src
                      swap, no layout shift. It is a lifestyle photo, not a cutout, so it
                      fills the arch with no blend. Touch devices never match hover:hover. */}
                  {cat.hoverImage?.trim() && (
                    <img
                      src={cat.hoverImage.trim()}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover opacity-0 transition-[opacity,scale] duration-[400ms,700ms] [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:scale-105"
                    />
                  )}
                </div>
                <p className="mt-4 px-1 text-center font-serif text-[17px] font-normal leading-tight text-dark transition-colors duration-300 [@media(hover:hover)]:group-hover:text-brand-clay">
                  {cat.name}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
