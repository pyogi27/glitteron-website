import Link from 'next/link'
import { COMPANY } from '@/lib/company'

// Re-exported so policy pages can keep importing it from here.
export { COMPANY }

export interface SectionSpec {
  /** Anchor id, also used by the side nav. */
  id: string
  title: string
}

export function Section({ id, title, children }: { id?: string; title?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-14 scroll-mt-header-ticker">
      {title && (
        <h2 className="font-serif text-[clamp(24px,2.6vw,32px)] font-light text-[#2C2825] mb-5 leading-[1.25]">
          {title}
        </h2>
      )}
      {/* 16px floor for mobile readability; 1.8 leading sits in the 1.5–1.75+ band. */}
      <div className="flex flex-col gap-5 text-[16px] leading-[1.8] text-[#5C5449]">{children}</div>
    </section>
  )
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3 pl-5 list-disc marker:text-[#A8552C]">
      {items.map(item => (
        <li key={item} className="pl-1.5">
          {item}
        </li>
      ))}
    </ul>
  )
}

/** Pulls a key figure (timeframe, fee) out of the prose so it is scannable. */
export function KeyFacts({ facts }: { facts: { value: string; label: string }[] }) {
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[#D8D0C4] border border-[#D8D0C4] rounded-2xl overflow-hidden my-2">
      {facts.map(f => (
        <div key={f.label} className="bg-[#F5F1EA] px-5 py-4">
          <dt className="text-[10px] font-medium tracking-[0.14em] uppercase text-[#8B7D6E] mb-1.5">
            {f.label}
          </dt>
          <dd className="font-serif text-[22px] font-light text-[#A8552C] leading-none">{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ContactBlock() {
  return (
    <Section id="contact" title="Contact us">
      <p>If you have any questions about this policy, please get in touch:</p>
      <ul className="flex flex-col gap-2.5 list-none">
        <li>
          Email:{' '}
          <a
            href={`mailto:${COMPANY.email}`}
            className="text-[#A8552C] no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C] rounded-sm"
          >
            {COMPANY.email}
          </a>
        </li>
        <li>
          Phone:{' '}
          <a
            href={COMPANY.phoneHref}
            className="text-[#A8552C] no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C] rounded-sm"
          >
            {COMPANY.phone}
          </a>
        </li>
        <li>Address: {COMPANY.address}</li>
      </ul>
      <p className="pt-1">
        You can also reach us through our{' '}
        <Link
          href="/contact"
          className="text-[#A8552C] no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C] rounded-sm"
        >
          contact page
        </Link>
        .
      </p>
    </Section>
  )
}

interface Props {
  title: string
  intro: string
  /** Section anchors for the sidebar index. */
  sections: SectionSpec[]
  /** Kicker above the title. The FAQ uses this shell but is not a legal page. */
  eyebrow?: string
  children: React.ReactNode
}

/**
 * Shared shell for policy pages.
 *
 * PageBanner requires stats, which do not suit a legal page, so this uses a
 * simpler header in the same visual language. Long documents get a sticky
 * section index on desktop so the page is navigable rather than one long scroll.
 */
export default function LegalPage({ title, intro, sections, eyebrow = 'Legal', children }: Props) {
  return (
    <>
      <header className="pt-header bg-[#2C2825] text-white pb-14 px-6 md:px-12">
        <div className="max-w-[900px] pt-12">
          <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#D08355] mb-4">
            {eyebrow}
          </div>
          <h1 className="font-serif text-[clamp(38px,5vw,64px)] font-light leading-[1.08] mb-5">
            {title}
          </h1>
          <p className="text-[16px] font-light text-white/60 max-w-[54ch] leading-[1.75]">{intro}</p>
        </div>
      </header>

      <div className="bg-[#EDE8E0] px-6 md:px-12 py-16 min-h-screen">
        <div className="flex gap-16 items-start max-w-[1100px]">
          {/* Sticky index — desktop only; the anchors remain reachable inline on mobile. */}
          <nav
            aria-label="On this page"
            className="hidden lg:block sticky top-header-ticker w-[210px] shrink-0"
          >
            <div className="text-[10px] font-medium tracking-[0.16em] uppercase text-[#8B7D6E] mb-4">
              On this page
            </div>
            <ul className="flex flex-col gap-2.5 list-none border-l border-[#D8D0C4]">
              {sections.map(s => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block -ml-px pl-4 border-l border-transparent text-[13px] leading-[1.5] text-[#5C5449] no-underline transition-colors duration-200 hover:text-[#A8552C] hover:border-[#A8552C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C]"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* ~68ch keeps body copy in the 65–75 character readability band. */}
          <main className="flex-1 min-w-0 max-w-[68ch]">{children}</main>
        </div>
      </div>
    </>
  )
}
