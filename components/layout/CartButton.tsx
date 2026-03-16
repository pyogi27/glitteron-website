'use client'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/lib/stores/cartStore'

export default function CartButton() {
  const count = useCartStore((s) => s.count())
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <button className="relative flex items-center gap-2 bg-dark text-white border-none px-[18px] py-2 rounded-3xl font-sans text-xs font-medium tracking-[0.06em] uppercase transition-all duration-300 hover:bg-gold-dark hover:-translate-y-0.5 cursor-none">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      Cart
      {mounted && count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-gold text-dark w-[18px] h-[18px] rounded-full text-[10px] font-semibold flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  )
}
