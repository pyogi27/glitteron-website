'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

const STORAGE_KEY = 'glitteron_newsletter_dismissed'
const RESHOW_DAYS = 30
const TRIGGER_DELAY_MS = 8_000

type State = 'hidden' | 'open' | 'closing' | 'success'

export default function NewsletterPopup() {
  const [state, setState] = useState<State>('hidden')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const { ts } = JSON.parse(raw)
        const daysSince = (Date.now() - ts) / (1000 * 60 * 60 * 24)
        if (daysSince < RESHOW_DAYS) return
      }
    } catch {
      // corrupted storage — proceed to show
    }

    const timer = setTimeout(() => setState('open'), TRIGGER_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  // Escape key to close
  useEffect(() => {
    if (state !== 'open') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [state])

  // Lock body scroll
  useEffect(() => {
    if (state === 'open') {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [state])

  function handleClose() {
    setState('closing')
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() }))
    } catch { /* ignore */ }
    setTimeout(() => setState('hidden'), 280)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    // Email provider integration: replace this block with your provider's API call
    setState('success')
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() }))
    } catch { /* ignore */ }
    setTimeout(() => setState('hidden'), 3000)
  }

  if (state === 'hidden') return null

  const isClosing = state === 'closing'

  return (
    <div
      className="fixed inset-0 z-[9995] flex items-center justify-center px-4"
      style={{
        animation: isClosing
          ? 'backdropOut 0.2s ease forwards'
          : 'backdropIn 0.3s ease forwards',
        background: 'rgba(26, 18, 16, 0.72)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Newsletter signup"
    >
      <div
        className="relative w-full overflow-hidden rounded-[20px]"
        style={{
          maxWidth: 420,
          animation: isClosing
            ? 'popupOut 0.25s ease-in forwards'
            : 'popupIn 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards',
          boxShadow: '0 32px 80px rgba(26,18,16,0.7), 0 0 0 1px rgba(250,247,243,0.06)',
        }}
      >
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.pexels.com/photos/1743231/pexels-photo-1743231.jpeg?auto=compress&cs=tinysrgb&w=840&h=1120&fit=crop"
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, rgba(26,18,16,0.18) 0%, rgba(26,18,16,0.0) 30%, rgba(26,18,16,0.97) 65%)',
            }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 z-10 w-7 h-7 rounded-full flex items-center justify-center text-[13px] transition-all hover:bg-white/10"
          style={{
            background: 'rgba(26,18,16,0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: 'rgba(250,247,243,0.5)',
            border: '1px solid rgba(250,247,243,0.1)',
          }}
          aria-label="Close popup"
        >
          ✕
        </button>

        {/* Content */}
        <div className="relative z-[2] px-7 pt-52 pb-8 flex flex-col gap-3">
          {state === 'success' ? (
            <div className="text-center py-6 flex flex-col items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ background: 'rgba(196,113,74,0.2)', border: '1.5px solid rgba(196,113,74,0.4)', color: '#E8A87C' }}
              >
                ✓
              </div>
              <div>
                <div className="font-serif text-[22px] font-light text-[#EDE8E0] leading-snug mb-2">
                  You&apos;re <em className="italic text-[#E8A87C]">in!</em>
                </div>
                <div className="text-[12px] font-light leading-relaxed" style={{ color: 'rgba(237,232,224,0.5)' }}>
                  Check your inbox for your<br />10% discount code.
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Discount badge */}
              <div
                className="flex items-center gap-2 self-start rounded-[30px] px-3 py-[5px]"
                style={{
                  background: 'rgba(196,113,74,0.18)',
                  border: '1px solid rgba(196,113,74,0.35)',
                }}
              >
                <span className="font-serif text-[22px] font-normal leading-none" style={{ color: '#E8A87C' }}>
                  10%
                </span>
                <span
                  className="text-[9px] font-medium tracking-[0.12em] uppercase leading-tight"
                  style={{ color: 'rgba(237,232,224,0.5)' }}
                >
                  off your<br />first order
                </span>
              </div>

              {/* Eyebrow */}
              <div className="text-[9px] font-medium tracking-[0.22em] uppercase" style={{ color: '#C4714A' }}>
                Welcome Gift
              </div>

              {/* Heading */}
              <h2 className="font-serif text-[24px] font-light leading-[1.15] text-[#EDE8E0]">
                Light Your Home,{' '}
                <em className="italic" style={{ color: '#E8A87C' }}>
                  Save on Your First
                </em>
              </h2>

              {/* Body */}
              <p className="text-[11px] font-light leading-relaxed" style={{ color: 'rgba(237,232,224,0.45)' }}>
                Subscribe for your discount code plus early access to new collections.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-1" noValidate>
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="Your email address"
                  className="w-full rounded-lg px-3.5 py-[10px] text-[12px] font-light outline-none transition-all"
                  style={{
                    background: 'rgba(237,232,224,0.07)',
                    border: error ? '1px solid rgba(196,113,74,0.6)' : '1px solid rgba(237,232,224,0.13)',
                    color: '#EDE8E0',
                    fontFamily: 'inherit',
                  }}
                  aria-label="Email address"
                />
                {error && (
                  <p className="text-[10px] font-light" style={{ color: '#E8A87C' }}>
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-[11px] rounded-lg text-[11px] font-medium tracking-[0.14em] uppercase transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: '#C4714A',
                    color: '#EDE8E0',
                    fontFamily: 'inherit',
                  }}
                >
                  Claim My 10% Off
                </button>
              </form>

              {/* Skip */}
              <button
                onClick={handleClose}
                className="text-[10px] font-light text-center transition-opacity hover:opacity-60 mt-1"
                style={{ color: 'rgba(237,232,224,0.2)', fontFamily: 'inherit' }}
              >
                No thanks, I&apos;ll pay full price
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
