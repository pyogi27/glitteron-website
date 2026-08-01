import type { Metadata } from 'next'
import Link from 'next/link'
import PageBanner from '@/components/collections/PageBanner'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import ContactForm from '@/components/contact/ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us — LitMeUp',
  description:
    'Questions about a fixture, an order or an installation? Talk to the people who build the lights. We reply within one working day.',
}

const CHANNELS = [
  {
    label: 'Email',
    value: 'hello@litmeup.com',
    href: 'mailto:hello@litmeup.com',
    note: 'Best for detailed questions. Replies within one working day.',
    icon: <path d="M4 4h16v16H4zM4 7l8 6 8-6" />,
  },
  {
    label: 'Phone',
    value: '+91 98765 43210',
    href: 'tel:+919876543210',
    note: 'Mon–Sat, 10 a.m. to 7 p.m. IST. A human, not a menu.',
    icon: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    ),
  },
  {
    label: 'Studio',
    value: 'Jaipur, Rajasthan',
    href: null,
    note: 'Workshop visits by appointment — email us to arrange one.',
    icon: (
      <>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
  },
]

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'In-stock fixtures ship within 48 hours and reach most Indian metros in 3–5 working days. Made-to-order pieces take 2–3 weeks; we confirm the date before we charge you.',
  },
  {
    q: 'Can you help me pick the right size?',
    a: 'Yes, and we would rather you asked. Send us your ceiling height, room dimensions and a photo — we will tell you which fixture works and which one will look wrong.',
  },
  {
    q: 'Do you handle installation?',
    a: 'Every fixture ships with a wiring diagram and mounting hardware. In Jaipur, Delhi and Mumbai we can arrange an electrician; elsewhere we will brief yours over the phone.',
  },
  {
    q: 'What if something arrives damaged?',
    a: 'Photograph it and email us within 48 hours. We replace it, we pay the shipping, and we do not ask you to argue about it.',
  },
  {
    q: 'Do you sell to architects and hotels?',
    a: 'We do. Pick "Trade / bulk enquiry" in the form and you will reach the projects team directly, with trade pricing and lead times.',
  },
]

export default function ContactPage() {
  return (
    <>
      <PageBanner
        eyebrow="Contact Us"
        title="Talk to the people who build the lights"
        subtitle="No ticket queue, no chatbot. Send us the room, the problem or the fixture you cannot decide on, and someone from the workshop will answer."
        stats={[
          { num: '<1d', label: 'Reply Time' },
          { num: '6d', label: 'Days A Week' },
          { num: '5yr', label: 'Warranty' },
        ]}
      />

      {/* Channels */}
      <section className="bg-[#EDE8E0] pt-14 md:pt-20 px-4 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {CHANNELS.map((channel, i) => {
            const inner = (
              <>
                <span className="w-11 h-11 rounded-full bg-[#A8552C]/10 flex items-center justify-center text-[#A8552C] mb-5">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {channel.icon}
                  </svg>
                </span>
                <div className="text-[10px] font-medium tracking-[0.16em] uppercase text-[#8B7D6E] mb-2">
                  {channel.label}
                </div>
                <div className="font-serif text-[24px] font-light text-[#2C2825] mb-2.5 leading-tight">
                  {channel.value}
                </div>
                <p className="text-[13px] leading-[1.75] text-[#5C5449]">{channel.note}</p>
              </>
            )

            const base = 'rounded-2xl p-8 bg-[#E2DAD0] border border-transparent block h-full'

            return (
              <RevealOnScroll key={channel.label} delay={i * 0.08}>
                {channel.href ? (
                  <a
                    href={channel.href}
                    className={`${base} no-underline transition-colors duration-200 hover:border-[#A8552C]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C]`}
                  >
                    {inner}
                  </a>
                ) : (
                  <div className={base}>{inner}</div>
                )}
              </RevealOnScroll>
            )
          })}
        </div>
      </section>

      {/* Form + side panel */}
      <section className="bg-[#EDE8E0] py-14 md:py-20 px-4 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-10 lg:gap-14 items-start">
          <RevealOnScroll>
            <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#A8552C] mb-4">
              Send A Message
            </div>
            <h2 className="font-serif text-[clamp(28px,3.4vw,44px)] font-light leading-[1.15] text-[#2C2825] mb-8">
              Tell us about the room.
            </h2>
            <ContactForm />
          </RevealOnScroll>

          <RevealOnScroll delay={0.15} className="lg:sticky lg:top-24">
            <div className="rounded-2xl bg-[#2C2825] p-8 md:p-9">
              <h3 className="font-serif text-[26px] font-light text-[#EDE8E0] mb-4">
                Before you write
              </h3>
              <p className="text-[13.5px] leading-[1.8] text-white/55 mb-7">
                Three things make our answer far more useful — your ceiling height, the room dimensions, and a
                photo of the space as it is now.
              </p>

              <dl className="space-y-5 border-t border-white/10 pt-7">
                <div>
                  <dt className="text-[10px] font-medium tracking-[0.16em] uppercase text-[#E8A87C] mb-1.5">
                    Order enquiries
                  </dt>
                  <dd className="text-[13.5px] leading-[1.7] text-white/60">
                    Have your order number handy — you can find it under{' '}
                    <Link
                      href="/profile?tab=orders"
                      className="text-[#E8A87C] no-underline underline-offset-4 hover:underline"
                    >
                      your orders
                    </Link>
                    .
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium tracking-[0.16em] uppercase text-[#E8A87C] mb-1.5">
                    Not sure what fits?
                  </dt>
                  <dd className="text-[13.5px] leading-[1.7] text-white/60">
                    Try the{' '}
                    <Link
                      href="/room-visualizer"
                      className="text-[#E8A87C] no-underline underline-offset-4 hover:underline"
                    >
                      room visualizer
                    </Link>{' '}
                    first — it settles most size questions in a minute.
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium tracking-[0.16em] uppercase text-[#E8A87C] mb-1.5">
                    Trade & projects
                  </dt>
                  <dd className="text-[13.5px] leading-[1.7] text-white/60">
                    Architects, hotels and developers get trade pricing and dedicated lead times.
                  </dd>
                </div>
              </dl>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#E2DAD0] py-16 md:py-24 px-4 md:px-12">
        <div className="max-w-3xl mx-auto">
          <RevealOnScroll className="mb-10">
            <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#A8552C] mb-4">
              Quick Answers
            </div>
            <h2 className="font-serif text-[clamp(28px,3.6vw,46px)] font-light leading-[1.15] text-[#2C2825]">
              Most people ask these first.
            </h2>
          </RevealOnScroll>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <RevealOnScroll key={faq.q} delay={i * 0.06}>
                <details className="group rounded-2xl bg-[#EDE8E0] border border-transparent transition-colors duration-200 open:border-[#A8552C]/25 hover:border-[#A8552C]/25">
                  <summary className="flex items-center justify-between gap-6 px-7 py-5 list-none [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C] rounded-2xl">
                    <span className="text-[14.5px] font-medium text-[#2C2825] leading-snug">{faq.q}</span>
                    <span className="w-7 h-7 rounded-full border border-[#2C2825]/20 flex items-center justify-center text-[#A8552C] flex-shrink-0 transition-transform duration-300 group-open:rotate-45">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </summary>
                  <p className="px-7 pb-6 -mt-1 text-[13.5px] leading-[1.85] text-[#5C5449] max-w-[62ch]">
                    {faq.a}
                  </p>
                </details>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll delay={0.1} className="mt-10 text-center">
            <p className="text-[13.5px] text-[#5C5449]">
              Still stuck?{' '}
              <a
                href="mailto:hello@litmeup.com"
                className="text-[#A8552C] underline underline-offset-4 transition-opacity hover:opacity-70"
              >
                Email us directly
              </a>{' '}
              — we would rather answer than have you guess.
            </p>
          </RevealOnScroll>
        </div>
      </section>
    </>
  )
}
