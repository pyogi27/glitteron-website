'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import CartButton from './CartButton'
import WishlistButton from './WishlistButton'
import { useAuthStore } from '@/lib/stores/authStore'
import { logoutApi } from '@/lib/auth/api'

// ─── Profile button + dropdown ────────────────────────────────────────────────

function ProfileButton({ isLight }: { isLight: boolean }) {
  const user = useAuthStore(s => s.user)
  const clearAuth = useAuthStore(s => s.clearAuth)
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setOpen(false) }, [pathname])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleLogout = async () => {
    setOpen(false)
    try { await logoutApi() } catch { /* ignore */ }
    clearAuth()
    router.push('/')
  }

  const initials = mounted && user
    ? `${(user.firstName ?? '?').charAt(0)}${(user.lastName ?? '?').charAt(0)}`.toUpperCase()
    : null

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      {mounted && user ? (
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-label="Account menu"
          className="w-8 h-8 rounded-full flex items-center justify-center font-sans text-[11px] font-semibold transition-all duration-200 hover:brightness-110"
          style={{ background: '#C4714A', color: '#EDE8E0' }}
        >
          {initials}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-label="Account menu"
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 border-none bg-transparent ${
            isLight
              ? 'text-white/80 hover:text-gold'
              : 'text-dark opacity-70 hover:opacity-100 hover:text-gold-dark'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+10px)] w-[220px] rounded-[18px] border border-[#D8D0C4] shadow-[0_12px_40px_rgba(44,40,37,0.14)] overflow-hidden z-50"
          style={{ background: '#FFFFFF' }}
        >
          {mounted && user ? (
            <>
              {/* User info */}
              <div className="px-4 py-4 border-b border-[#D8D0C4]" style={{ background: '#FAF7F2' }}>
                <p className="font-sans text-[13px] font-medium truncate" style={{ color: '#1A1210' }}>
                  {user.firstName} {user.lastName}
                </p>
                <p className="font-sans text-[11.5px] font-light mt-0.5" style={{ color: '#A09488' }}>
                  +91 {user.phone}
                </p>
              </div>

              {/* Links */}
              <div className="py-1.5">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 font-sans text-[12.5px] font-medium no-underline transition-colors hover:bg-[#F4EFE8]"
                  style={{ color: '#2C2825' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  My Profile
                </Link>
                <Link
                  href="/profile?tab=orders"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 font-sans text-[12.5px] font-medium no-underline transition-colors hover:bg-[#F4EFE8]"
                  style={{ color: '#2C2825' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                  My Orders
                </Link>
              </div>

              <div className="h-px mx-4" style={{ background: '#D8D0C4' }} />

              {/* Sign out */}
              <div className="py-1.5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 font-sans text-[12.5px] font-medium text-left transition-colors hover:bg-[#FFF0EB]"
                  style={{ color: '#C4714A' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16,17 21,12 16,7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="py-1.5">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 font-sans text-[12.5px] font-medium no-underline transition-colors hover:bg-[#F4EFE8]"
                style={{ color: '#2C2825' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10,17 15,12 10,7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 font-sans text-[12.5px] font-medium no-underline transition-colors hover:bg-[#F4EFE8]"
                style={{ color: '#2C2825' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const NAV_LINKS_BEFORE_VISUALIZER = [
  { href: '/', label: 'Home' },
  { href: '/collections', label: 'Collections' },
  { href: '/rooms', label: 'Rooms' },
]
const VISUALIZER_LINK = { href: '/room-visualizer', label: 'Visualizer' }
const NAV_LINKS_AFTER_VISUALIZER = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

interface HeaderProps {
  transparent?: boolean
}

export default function Header({ transparent }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const user = useAuthStore(s => s.user)

  const navLinks = [
    ...NAV_LINKS_BEFORE_VISUALIZER,
    ...(user ? [VISUALIZER_LINK] : []),
    ...NAV_LINKS_AFTER_VISUALIZER,
  ]

  const isTransparent = transparent ?? pathname === '/'

  useEffect(() => {
    if (!isTransparent) return
    setScrolled(window.scrollY > 10)
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isTransparent])

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const isLight = isTransparent && !scrolled

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        isLight
          ? 'border-b border-transparent bg-transparent'
          : 'border-b border-warm-gray/40 bg-white/96 backdrop-blur-xl'
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-12 h-header">
        <Logo light={isLight} />

        <nav className="hidden md:flex items-center gap-9">
          {navLinks.map(({ href, label }) => (
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

        <div className="flex items-center gap-3 md:gap-5">
          {/* Search — desktop only. It has no onClick yet, and at 320px the row cannot
              hold five controls; a dead button does not get to outrank a working one. */}
          <button
            className={`cursor-none border-none bg-transparent w-9 h-9 items-center justify-center rounded-full transition-all duration-200 hidden md:flex ${
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
          <WishlistButton isLight={isLight} />

          <ProfileButton isLight={isLight} />

          <CartButton />

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Toggle menu"
            className={`md:hidden w-9 h-9 flex items-center justify-center transition-colors ${
              isLight ? 'text-white' : 'text-[#2C2825]'
            }`}
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
        <nav className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-[#D8D0C4] shadow-lg py-4 px-6 flex flex-col gap-3">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="text-[14px] font-medium tracking-[0.06em] uppercase text-[#2C2825] opacity-70 hover:opacity-100 hover:text-[#8B5E3C] transition-all no-underline py-1"
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
