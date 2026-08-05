'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useWishlistStore } from '@/lib/stores/wishlistStore'

interface WishlistButtonProps {
  isLight: boolean
}

/**
 * The header heart. It was a `<button>` with no `onClick` and `hidden md:flex` — dead,
 * and hidden on the screens where hearts actually get tapped.
 */
export default function WishlistButton({ isLight }: WishlistButtonProps) {
  const count = useWishlistStore((s) => s.ids.length)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <Link
      href="/wishlist"
      aria-label={mounted && count > 0 ? `Saved items (${count})` : 'Saved items'}
      className={`relative cursor-none no-underline w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
        isLight
          ? 'text-white/80 hover:text-gold'
          : 'text-dark opacity-70 hover:opacity-100 hover:text-gold-dark'
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={mounted && count > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {/* Rendered only after mount: the count comes from localStorage, so the server
          markup cannot know it without a hydration mismatch. */}
      {mounted && count > 0 && (
        <span
          aria-live="polite"
          className="absolute -top-0.5 -right-0.5 bg-gold text-dark w-[16px] h-[16px] rounded-full text-[9px] font-semibold flex items-center justify-center"
        >
          {count}
        </span>
      )}
    </Link>
  )
}
