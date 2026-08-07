import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage, { ContactBlock, Section, type SectionSpec } from '@/components/legal/LegalPage'
import JsonLd from '@/components/seo/JsonLd'
import { FAQ_GROUPS, FAQ_ITEMS } from '@/lib/data/faq'
import { breadcrumbSchema, faqSchema } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'FAQ — Shipping, Returns, Warranty & Sizing',
  description:
    'Answers on LitMeUp shipping (free, 5–7 days across India), the 7-day return window, the 5-year warranty, payment methods and how to size a chandelier for your room.',
  alternates: { canonical: '/faq' },
}

const SECTIONS: SectionSpec[] = [
  ...FAQ_GROUPS.map(g => ({ id: g.id, title: g.title })),
  { id: 'more', title: 'Still stuck?' },
  { id: 'contact', title: 'Contact us' },
]

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqSchema(FAQ_ITEMS)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'FAQ', path: '/faq' },
        ])}
      />

      <LegalPage
        eyebrow="Help"
        title="Frequently asked questions"
        intro="Shipping, returns, warranty, payment and sizing — the questions we answer most, with the numbers rather than the runaround."
        sections={SECTIONS}
      >
        {FAQ_GROUPS.map(group => (
          <Section key={group.id} id={group.id} title={group.title}>
            {group.items.map(item => (
              <div key={item.question}>
                <h3 className="font-sans text-[16px] font-medium text-[#2C2825] mb-2 leading-[1.5]">
                  {item.question}
                </h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </Section>
        ))}

        <Section id="more" title="Still stuck?">
          <p>
            The full policies carry the fine print:{' '}
            <Link href="/shipping" className="text-[#9E4C22] underline underline-offset-2 decoration-[#9E4C22]/40 hover:decoration-[#9E4C22]">
              shipping
            </Link>
            ,{' '}
            <Link href="/returns" className="text-[#9E4C22] underline underline-offset-2 decoration-[#9E4C22]/40 hover:decoration-[#9E4C22]">
              returns and exchanges
            </Link>
            ,{' '}
            <Link href="/terms" className="text-[#9E4C22] underline underline-offset-2 decoration-[#9E4C22]/40 hover:decoration-[#9E4C22]">
              terms of use
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[#9E4C22] underline underline-offset-2 decoration-[#9E4C22]/40 hover:decoration-[#9E4C22]">
              privacy
            </Link>
            . For sizing and hanging heights in detail, the{' '}
            <Link href="/guides" className="text-[#9E4C22] underline underline-offset-2 decoration-[#9E4C22]/40 hover:decoration-[#9E4C22]">
              lighting guides
            </Link>{' '}
            work through each room with the measurements. To see a fixture in your own room
            before buying, try the{' '}
            <Link href="/room-visualizer" className="text-[#9E4C22] underline underline-offset-2 decoration-[#9E4C22]/40 hover:decoration-[#9E4C22]">
              room visualizer
            </Link>
            .
          </p>
        </Section>

        <ContactBlock />
      </LegalPage>
    </>
  )
}
