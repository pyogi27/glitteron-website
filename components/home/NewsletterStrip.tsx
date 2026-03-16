'use client'
import { useState } from 'react'

export default function NewsletterStrip() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  return (
    <section className="bg-[#2C2825] py-[80px] px-4 md:px-12 text-center">
      <div className="max-w-[560px] mx-auto">
        <div className="text-[10px] font-medium tracking-[0.22em] uppercase text-[#C4714A] mb-4">Stay Illuminated</div>
        <h2 className="font-serif text-[36px] font-light text-white leading-[1.2] mb-3">
          Light up your <em className="italic text-[#C4714A]">inbox</em>
        </h2>
        <p className="text-[13px] font-light text-white/50 mb-8 leading-[1.8]">
          New arrivals, exclusive offers, and design inspiration — delivered monthly.
        </p>
        <div aria-live="polite">
          {submitted ? (
            <div className="text-[#C4714A] font-serif text-[18px] italic">Thank you for subscribing ✦</div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-[440px] mx-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 bg-white/8 border border-white/15 text-white placeholder:text-white/30 px-5 py-3.5 rounded-3xl text-[13px] font-light outline-none focus:border-[#C4714A] transition-colors"
              />
              <button type="submit"
                className="bg-[#C4714A] text-[#2C2825] border-none px-7 py-3.5 rounded-3xl font-sans text-[12px] font-semibold tracking-[0.08em] uppercase whitespace-nowrap transition-all hover:-translate-y-0.5 hover:bg-[#E8A87C]">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
