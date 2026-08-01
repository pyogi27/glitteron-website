import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import PageBanner from '@/components/collections/PageBanner'
import RevealOnScroll from '@/components/ui/RevealOnScroll'

export const metadata: Metadata = {
  title: 'About Us — LitMeUp',
  description:
    'We design and handcraft lighting for spaces that deserve to glow. Meet the people, the process and the promise behind LitMeUp.',
}

const VALUES = [
  {
    title: 'Made by hand',
    body: 'Every fixture passes through the hands of a metalworker, a glass finisher and a quality lead before it ships. Machines help. They do not decide.',
    icon: (
      <>
        <path d="M11 13.5 8.5 21l3.5-2 3.5 2-2.5-7.5" />
        <path d="M12 3a4.5 4.5 0 0 1 4.5 4.5c0 1.9-1.2 3.6-3 4.2h-3c-1.8-.6-3-2.3-3-4.2A4.5 4.5 0 0 1 12 3Z" />
      </>
    ),
  },
  {
    title: 'Built to outlast trends',
    body: 'We choose brass, hand-blown glass and solid steel over plated shortcuts. A LitMeUp piece should look right in your home a decade from now.',
    icon: <path d="M12 3 4 6.5v5c0 4.3 3.4 8.1 8 9.5 4.6-1.4 8-5.2 8-9.5v-5L12 3Z" />,
  },
  {
    title: 'Light you can live in',
    body: 'Warm colour temperatures, glare-controlled diffusers, dimmable as standard. Beautiful is easy. Comfortable takes work.',
    icon: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
  },
  {
    title: 'Honest about the price',
    body: 'We sell direct. No showroom markup, no dealer margin, no seasonal fake discounts. The price you see is the price we stand behind.',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 9.5c-.6-.9-1.7-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 2 3 2 3 .9 3 2-1.3 2-3 2c-1.3 0-2.4-.6-3-1.5M12 6.5v11" />
      </>
    ),
  },
]

const TIMELINE = [
  {
    year: '2016',
    title: 'A workshop and one lathe',
    body: 'Two furniture makers started building lamps because they could not find fixtures that matched the pieces they were making.',
  },
  {
    year: '2019',
    title: 'The first chandelier',
    body: 'A commission for a Jaipur restaurant turned into our signature sputnik line — and the reason we invested in a glass studio.',
  },
  {
    year: '2022',
    title: 'Direct to your door',
    body: 'We closed the wholesale channel and rebuilt as a direct brand, cutting the retail markup out of every fixture.',
  },
  {
    year: '2026',
    title: '500+ designs, one standard',
    body: 'A catalogue that spans five rooms and twelve finishes, still assembled and inspected in the same workshop.',
  },
]

const CRAFT_STEPS = [
  { step: '01', title: 'Sketch', body: 'Every design starts on paper against a real room, not a mood board.' },
  { step: '02', title: 'Prototype', body: 'We build one, live with it, and light it at 2 a.m. before approving it.' },
  { step: '03', title: 'Finish', body: 'Brass is hand-brushed, glass is hand-blown, every joint is checked twice.' },
  { step: '04', title: 'Ship', body: 'Packed in moulded pulp, insured, and traceable from bench to doorstep.' },
]

export default function AboutPage() {
  return (
    <>
      <PageBanner
        eyebrow="About Us"
        title="Light, made by people who care how it lands"
        subtitle="LitMeUp is a small studio that designs, builds and ships its own lighting. No middlemen, no catalogue filler — just fixtures we would put in our own homes."
        stats={[
          { num: '2016', label: 'Founded' },
          { num: '500+', label: 'Designs' },
          { num: '12K+', label: 'Homes Lit' },
        ]}
      />

      {/* Story — editorial two column with overlapping image */}
      <section className="bg-[#EDE8E0] py-16 md:py-24 px-4 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
          <RevealOnScroll>
            <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#A8552C] mb-5">
              Our Story
            </div>
            <h2 className="font-serif text-[clamp(30px,4vw,52px)] font-light leading-[1.15] text-[#2C2825] mb-6">
              We started because the light was always the last thing anyone thought about.
            </h2>
            <div className="space-y-5 text-[14.5px] leading-[1.85] text-[#5C5449] max-w-[52ch]">
              <p>
                A room can be finished — the paint, the floor, the sofa placed exactly right — and still feel wrong
                at seven in the evening. Nine times out of ten it is the light. Too cold, too flat, too high on the
                ceiling and too far from where anyone actually sits.
              </p>
              <p>
                So we started making fixtures the way we made furniture: one at a time, from materials that age
                well, tested in real rooms before they ever reached a catalogue. That has not changed as we have
                grown. The workshop is bigger and the team is larger, but every design still has to survive the same
                question — would we live with this?
              </p>
              <p>
                Today LitMeUp ships to twelve thousand homes. We still build the prototypes by hand, and we still
                answer the phone ourselves.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.15}>
            <div className="relative">
              <div className="relative h-[380px] md:h-[520px] rounded-2xl overflow-hidden">
                <Image
                  src="https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg"
                  alt="A pendant light being assembled by hand at the LitMeUp workshop bench"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(26,18,16,0.4) 0%, rgba(26,18,16,0) 55%)',
                  }}
                />
              </div>
              <div className="absolute -bottom-6 -left-4 md:-left-8 bg-[#2C2825] rounded-2xl px-7 py-6 max-w-[230px]">
                <div className="font-serif text-[38px] font-light text-[#C4714A] leading-none">10</div>
                <div className="text-[11px] tracking-[0.14em] uppercase text-white/50 mt-2">
                  Years at the bench
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Values — asymmetric card grid on dark */}
      <section className="bg-[#2C2825] py-16 md:py-24 px-4 md:px-12">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll className="max-w-[560px] mb-12">
            <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C4714A] mb-4">
              What We Stand For
            </div>
            <h2 className="font-serif text-[clamp(28px,3.6vw,46px)] font-light leading-[1.15] text-[#EDE8E0]">
              Four rules we have not broken yet.
            </h2>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {VALUES.map((value, i) => (
              <RevealOnScroll
                key={value.title}
                delay={i * 0.08}
                className="rounded-2xl p-8 md:p-9 border border-white/8 transition-colors duration-300 hover:border-[#C4714A]/50"
                style={{ background: 'rgba(237,232,224,0.035)' }}
              >
                <span className="w-11 h-11 rounded-full bg-[#C4714A]/12 flex items-center justify-center text-[#E8A87C] mb-6">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {value.icon}
                  </svg>
                </span>
                <h3 className="font-serif text-[24px] font-light text-[#EDE8E0] mb-3">{value.title}</h3>
                <p className="text-[14px] leading-[1.8] text-white/55 max-w-[46ch]">{value.body}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline — horizontal rail */}
      <section className="bg-[#EDE8E0] py-16 md:py-24 px-4 md:px-12">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll className="mb-12">
            <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#A8552C] mb-4">
              The Long Version
            </div>
            <h2 className="font-serif text-[clamp(28px,3.6vw,46px)] font-light leading-[1.15] text-[#2C2825]">
              How we got here.
            </h2>
          </RevealOnScroll>

          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 list-none">
            {TIMELINE.map((item, i) => (
              <RevealOnScroll key={item.year} as="li" delay={i * 0.1} className="relative pt-7">
                <span
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: i === 0 ? '#C4714A' : '#D8D0C4' }}
                />
                <span className="absolute -top-[3px] left-0 w-[7px] h-[7px] rounded-full bg-[#C4714A]" />
                <div className="font-serif text-[30px] font-light text-[#C4714A] leading-none mb-3">
                  {item.year}
                </div>
                <h3 className="text-[15px] font-medium text-[#2C2825] mb-2.5">{item.title}</h3>
                <p className="text-[13.5px] leading-[1.75] text-[#5C5449]">{item.body}</p>
              </RevealOnScroll>
            ))}
          </ol>
        </div>
      </section>

      {/* Craft process — numbered strip over image */}
      <section className="relative py-16 md:py-24 px-4 md:px-12 overflow-hidden">
        <Image
          src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg"
          alt=""
          fill
          aria-hidden="true"
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#1A1210]/85" />
        <div className="relative max-w-6xl mx-auto">
          <RevealOnScroll className="max-w-[520px] mb-12">
            <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#E8A87C] mb-4">
              From Bench To Ceiling
            </div>
            <h2 className="font-serif text-[clamp(28px,3.6vw,46px)] font-light leading-[1.15] text-[#EDE8E0]">
              Four steps, none of them skipped.
            </h2>
          </RevealOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden">
            {CRAFT_STEPS.map((s, i) => (
              <RevealOnScroll key={s.step} delay={i * 0.08} className="bg-[#1A1210] p-8 md:p-9">
                <div className="font-serif text-[46px] font-light text-white/12 leading-none mb-4">{s.step}</div>
                <h3 className="text-[15px] font-medium text-[#EDE8E0] mb-2.5">{s.title}</h3>
                <p className="text-[13.5px] leading-[1.75] text-white/50">{s.body}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#E2DAD0] py-16 md:py-24 px-4 md:px-12">
        <RevealOnScroll className="max-w-[680px] mx-auto text-center">
          <h2 className="font-serif text-[clamp(30px,4vw,52px)] font-light leading-[1.15] text-[#2C2825] mb-5">
            Come see what we have been building.
          </h2>
          <p className="text-[14.5px] leading-[1.85] text-[#5C5449] mb-9 max-w-[46ch] mx-auto">
            Five hundred designs, five rooms, and a team that will happily tell you which one is wrong for your
            ceiling height.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2.5 rounded-full bg-[#2C2825] px-8 py-4 text-[13px] font-medium tracking-[0.06em] text-[#EDE8E0] no-underline transition-colors duration-200 hover:bg-[#A8552C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C]"
            >
              Browse the collection
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full border border-[#2C2825]/25 px-8 py-4 text-[13px] font-medium tracking-[0.06em] text-[#2C2825] no-underline transition-colors duration-200 hover:border-[#A8552C] hover:text-[#A8552C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C]"
            >
              Talk to us
            </Link>
          </div>
        </RevealOnScroll>
      </section>
    </>
  )
}
