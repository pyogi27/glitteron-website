'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { Product } from '@/lib/types'

interface Props { products: Product[] }

export default function ShuffleDeck({ products }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const deck = products.slice(0, 5)

  const shuffle = () => {
    const topCard = cardRefs.current[currentIndex % deck.length]
    if (!topCard) return
    gsap.killTweensOf(topCard)
    gsap.to(topCard, {
      rotation: 15,
      x: 300,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        gsap.set(topCard, { rotation: -8, x: -20, y: 20, opacity: 1, zIndex: 0 })
        setCurrentIndex(prev => prev + 1)
      }
    })
  }

  return (
    <section className="bg-[#1A1714] py-[120px] px-12 flex items-center justify-between gap-16">
      {/* Left text */}
      <div className="flex-1 max-w-[500px]">
        <div className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#C4714A] mb-5">Curated For You</div>
        <h2 className="font-serif text-[clamp(36px,4vw,56px)] font-light text-white leading-[1.1] mb-6">
          Find your <em className="italic text-[#C8A96E]">light</em>
        </h2>
        <p className="text-[14px] font-light text-white/55 leading-[1.85] mb-8 max-w-[380px]">
          Not sure where to start? Let us curate your perfect chandelier based on your room, style, and budget.
        </p>
        <div className="flex gap-4">
          <button onClick={shuffle}
            className="bg-[#C8A96E] text-[#1A1714] border-none px-8 py-3.5 rounded-3xl font-sans text-[12px] font-semibold tracking-[0.08em] uppercase transition-all hover:-translate-y-0.5 hover:bg-[#E8D5A3]">
            Shuffle Cards
          </button>
          <Link href="/collections"
            className="border border-white/25 text-white px-8 py-3.5 rounded-3xl font-sans text-[12px] font-light tracking-[0.08em] uppercase no-underline transition-all hover:border-[#C8A96E] hover:text-[#C8A96E]">
            Browse All →
          </Link>
        </div>
      </div>

      {/* Card deck */}
      <div className="relative w-[320px] h-[420px] flex-shrink-0">
        {deck.map((product, i) => {
          const offset = i * 6
          return (
            <div
              key={product.id}
              ref={el => { cardRefs.current[i] = el }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '100%',
                transform: `rotate(${(i - 2) * 4}deg) translateY(${offset}px)`,
                zIndex: deck.length - i,
              }}
              className="rounded-2xl overflow-hidden border-2 border-white/10 shadow-xl"
            >
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="320px"
              />
              {/* Card label */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                <div className="text-[10px] font-medium tracking-[0.14em] uppercase text-[#C8A96E] mb-1">{product.category}</div>
                <div className="font-serif text-[16px] text-white">{product.name}</div>
                <div className="text-[13px] text-white/70 mt-1">₹{product.price.toLocaleString('en-IN')}</div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
