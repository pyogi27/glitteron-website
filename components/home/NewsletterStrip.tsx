'use client'
import { useNewsletterSignup } from '@/hooks/useNewsletterSignup'

export default function NewsletterStrip() {
  const { email, setEmail, submitted, error, pending, submit: handleSubmit } = useNewsletterSignup()

  return (
    <section className="bg-[#EDE8E0] py-[80px] px-4 md:px-12 text-center">
      <div className="max-w-[560px] mx-auto">
        <div className="text-[10px] font-medium tracking-[0.22em] uppercase text-[#A8552C] mb-4">Stay Illuminated</div>
        <h2 className="font-serif text-[36px] font-light text-[#2C2825] leading-[1.2] mb-3">
          Light up your <em className="italic text-[#A8552C]">inbox</em>
        </h2>
        {/* was text-[#2C2825]/65 on #EDE8E0 = 2.21:1, below the 4.5:1 AA floor */}
        <p className="text-[14px] font-light text-[#5A5249] mb-8 leading-[1.8]">
          New arrivals, exclusive offers, and design inspiration — delivered monthly.
        </p>
        <div aria-live="polite">
          {submitted ? (
            <div ref={el => el?.focus()} tabIndex={-1} className="text-[#A8552C] font-serif text-[18px] italic outline-none">Thank you for subscribing ✦</div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-[440px] mx-auto" noValidate>
              <div className="flex gap-3">
                <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'newsletter-error' : undefined}
                  className="min-w-0 flex-1 bg-white border border-[#D8D0C4] text-[#2C2825] placeholder:text-[#6E655C] px-5 py-3.5 rounded-3xl text-[14px] font-light transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C] focus:border-[#A8552C]"
                />
                <button type="submit" disabled={pending}
                  className="bg-[#A8552C] text-white border-none px-7 py-3.5 rounded-3xl font-sans text-[12px] font-semibold tracking-[0.08em] uppercase whitespace-nowrap transition-all hover:-translate-y-0.5 hover:bg-[#8B4423] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C2825] disabled:opacity-60 disabled:translate-y-0">
                  {pending ? 'Signing up…' : 'Subscribe'}
                </button>
              </div>
              {error && (
                <p id="newsletter-error" className="text-[13px] text-[#A8552C] mt-3">{error}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
