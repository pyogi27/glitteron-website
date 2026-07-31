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
    <section className="bg-[#EDE8E0] py-[80px] px-4 md:px-12 text-center">
      <div className="max-w-[560px] mx-auto">
        <div className="text-[10px] font-medium tracking-[0.22em] uppercase text-[#A8552C] mb-4">Stay Illuminated</div>
        <h2 className="font-serif text-[36px] font-light text-[#2C2825] leading-[1.2] mb-3">
          Light up your <em className="italic text-[#A8552C]">inbox</em>
        </h2>
        <p className="text-[13px] font-light text-[#2C2825]/65 mb-8 leading-[1.8]">
          New arrivals, exclusive offers, and design inspiration — delivered monthly.
        </p>
        <div aria-live="polite">
          {submitted ? (
            <div className="text-[#A8552C] font-serif text-[18px] italic">Thank you for subscribing ✦</div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-[440px] mx-auto">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 bg-white border border-[#D8D0C4] text-[#2C2825] placeholder:text-[#2C2825]/40 px-5 py-3.5 rounded-3xl text-[13px] font-light outline-none focus:border-[#A8552C] transition-colors"
              />
              <button type="submit"
                className="bg-[#A8552C] text-white border-none px-7 py-3.5 rounded-3xl font-sans text-[12px] font-semibold tracking-[0.08em] uppercase whitespace-nowrap transition-all hover:-translate-y-0.5 hover:bg-[#8B4423]">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
