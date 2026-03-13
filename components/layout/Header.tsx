'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import CartButton from './CartButton'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/collections', label: 'Collections' },
  { href: '/rooms', label: 'Rooms' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

interface HeaderProps {
  transparent?: boolean
}

export default function Header({ transparent = false }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!transparent) return
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [transparent])

  const isLight = transparent && !scrolled

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        isLight
          ? 'border-b border-transparent bg-transparent'
          : 'border-b border-warm-gray/40 bg-white/96 backdrop-blur-xl'
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-12 h-[72px]">
        <Logo light={isLight} />

        <nav className="hidden md:flex items-center gap-9">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-[13px] font-normal tracking-[0.08em] uppercase no-underline relative group transition-all duration-300 ${
                isLight
                  ? 'text-white/82 hover:text-gold'
                  : pathname === href
                  ? 'text-gold-dark opacity-100'
                  : 'text-dark opacity-70 hover:opacity-100 hover:text-gold-dark'
              }`}
            >
              {label}
              <span
                className={`absolute -bottom-0.5 left-0 h-px bg-gold transition-all duration-300 ${
                  pathname === href ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          {/* Search */}
          <button
            className={`cursor-none border-none bg-transparent w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
              isLight
                ? 'text-white/80 hover:text-gold'
                : 'text-dark opacity-70 hover:opacity-100 hover:text-gold-dark'
            }`}
            aria-label="Search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          {/* Wishlist */}
          <button
            className={`cursor-none border-none bg-transparent w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hidden md:flex ${
              isLight
                ? 'text-white/80 hover:text-gold'
                : 'text-dark opacity-70 hover:opacity-100 hover:text-gold-dark'
            }`}
            aria-label="Wishlist"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          <CartButton />

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Toggle menu"
            className="md:hidden w-9 h-9 flex items-center justify-center text-[#1A1714]"
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-[#E8E4DC] shadow-lg py-4 px-6 flex flex-col gap-3">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="text-[14px] font-medium tracking-[0.06em] uppercase text-[#1A1714] opacity-70 hover:opacity-100 hover:text-[#9A7840] transition-all no-underline py-1"
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
