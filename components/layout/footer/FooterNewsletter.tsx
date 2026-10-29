'use client'
import { useNewsletterSignup } from '@/hooks/useNewsletterSignup'

export default function FooterNewsletter() {
  const { email, setEmail, submitted, error, pending, submit } = useNewsletterSignup()

  return (
    <div className="max-w-[340px]" aria-live="polite">
      <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#2C2825] mb-2.5">Stay Illuminated</h3>
      {submitted ? (
        <p ref={el => el?.focus()} tabIndex={-1} className="font-serif text-[16px] text-[#A8552C] outline-none">Thank you for subscribing ✦</p>
      ) : (
        <form onSubmit={submit} noValidate>
          <p className="text-[12.5px] text-[#5C5449] leading-[1.6] mb-3">
            New arrivals and offers, delivered monthly.
          </p>
          <div className="flex gap-2">
            <label htmlFor="footer-newsletter-email" className="sr-only">Email address</label>
            <input
              id="footer-newsletter-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'footer-newsletter-error' : undefined}
              className="min-w-0 flex-1 bg-white border border-[#D8D0C4] text-[#2C2825] placeholder:text-[#6E655C] px-4 py-2.5 rounded-full text-[13px] font-normal transition-colors focus:border-[#A8552C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C]"
            />
            <button
              type="submit"
              disabled={pending}
              className="bg-[#2C2825] text-[#EDE8E0] px-5 py-2.5 rounded-full text-[11px] font-semibold tracking-[0.1em] uppercase whitespace-nowrap cursor-none transition-all duration-200 hover:bg-[#A8552C] hover:-translate-y-0.5 focus-visible:bg-[#A8552C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C2825] disabled:opacity-60 disabled:translate-y-0"
            >
              {pending ? 'Signing up…' : 'Subscribe'}
            </button>
          </div>
          {error && <p id="footer-newsletter-error" className="text-[12px] text-[#A8552C] mt-2">{error}</p>}
        </form>
      )}
    </div>
  )
}
