import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/seo/JsonLd'
import { guides } from '@/lib/data/guides'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { absoluteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Lighting Guides — Sizing, Heights & Light Quality',
  description:
    'How to size a chandelier, how high to hang a dining light, how many pendants a kitchen island takes, and which Kelvin belongs in which room. Practical numbers, no fluff.',
  alternates: { canonical: '/guides' },
}

/** The index is a real list page, so it says so in markup as well as in layout. */
function guideListSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url: absoluteUrl('/guides'),
    name: 'LitMeUp lighting guides',
    numberOfItems: guides.length,
    itemListElement: guides.map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(`/guides/${g.slug}`),
      name: g.title,
    })),
  }
}

export default function GuidesPage() {
  return (
    <>
      <JsonLd data={guideListSchema()} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
        ])}
      />

      <header className="pt-header bg-[#2C2825] text-white pb-14 px-6 md:px-12">
        <div className="max-w-[900px] pt-12">
          <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#D08355] mb-4">
            Guides
          </div>
          <h1 className="font-serif text-[clamp(38px,5vw,64px)] font-light leading-[1.08] mb-5">
            Lighting, answered with numbers
          </h1>
          <p className="text-[16px] font-light text-white/60 max-w-[54ch] leading-[1.75]">
            What size, how high, how many, which Kelvin. The measurements we give customers on
            the phone, written down so you can measure once and buy once.
          </p>
        </div>
      </header>

      <div className="bg-[#EDE8E0] px-6 md:px-12 py-16 min-h-screen">
        {/* Editorial list rather than a card grid: the answer line is the reason
            to click, and it needs room to be read. */}
        <ul className="max-w-[880px] list-none flex flex-col">
          {guides.map(guide => (
            <li key={guide.slug} className="border-t border-[#D8D0C4] last:border-b">
              <Link
                href={`/guides/${guide.slug}`}
                className="group grid md:grid-cols-[1fr_auto] gap-x-10 gap-y-3 items-start py-8 no-underline"
              >
                <div>
                  <div className="text-[10px] font-medium tracking-[0.16em] uppercase text-[#8B7D6E] mb-2.5">
                    {guide.category}
                  </div>
                  <h2 className="font-serif text-[clamp(22px,2.4vw,30px)] font-light leading-[1.25] text-[#2C2825] mb-3 transition-colors group-hover:text-[#A8552C]">
                    {guide.title}
                  </h2>
                  <p className="text-[15px] leading-[1.75] text-[#5C5449] max-w-[62ch]">
                    {guide.answer}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="hidden md:flex w-10 h-10 shrink-0 items-center justify-center rounded-full border border-[#C9C0B2] text-[#8B7D6E] transition-all group-hover:border-[#A8552C] group-hover:text-[#A8552C] group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="max-w-[880px] mt-12 text-[15px] leading-[1.8] text-[#5C5449]">
          Question not covered here? The{' '}
          <Link href="/faq" className="text-[#9E4C22] underline underline-offset-2 decoration-[#9E4C22]/40 hover:decoration-[#9E4C22]">
            FAQ
          </Link>{' '}
          handles shipping, returns and warranty, and our team answers sizing questions on the{' '}
          <Link href="/contact" className="text-[#9E4C22] underline underline-offset-2 decoration-[#9E4C22]/40 hover:decoration-[#9E4C22]">
            contact page
          </Link>
          .
        </p>
      </div>
    </>
  )
}
