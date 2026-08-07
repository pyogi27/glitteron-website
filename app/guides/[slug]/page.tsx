import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import LegalPage, { Section, type SectionSpec } from '@/components/legal/LegalPage'
import GuideBody from '@/components/guides/GuideBody'
import JsonLd from '@/components/seo/JsonLd'
import { getGuideBySlug, guides, relatedGuides } from '@/lib/data/guides'
import { articleSchema, breadcrumbSchema, faqSchema } from '@/lib/seo/schema'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return guides.map(g => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuideBySlug(slug)
  if (!guide) return { title: 'Guide not found', robots: { index: false, follow: true } }

  const path = `/guides/${guide.slug}`
  return {
    title: guide.metaTitle,
    description: guide.description,
    alternates: { canonical: path },
    openGraph: {
      title: guide.metaTitle,
      description: guide.description,
      url: path,
      type: 'article',
      modifiedTime: guide.updated,
    },
  }
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const guide = getGuideBySlug(slug)
  if (!guide) notFound()

  const path = `/guides/${guide.slug}`
  const sections: SectionSpec[] = [
    ...guide.sections.map(s => ({ id: s.id, title: s.heading })),
    { id: 'faq', title: 'Common questions' },
    { id: 'next', title: 'Where to next' },
  ]

  return (
    <>
      <JsonLd
        data={articleSchema({
          title: guide.title,
          description: guide.description,
          path,
          updated: guide.updated,
        })}
      />
      <JsonLd data={faqSchema(guide.faqs, path)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: guide.title, path },
        ])}
      />

      <LegalPage eyebrow={guide.category} title={guide.title} intro={guide.answer} sections={sections}>
        <p className="text-[12px] text-[#5C5449] tracking-[0.04em] -mt-6 mb-10">
          Updated{' '}
          <time dateTime={guide.updated}>{DATE_FORMAT.format(new Date(guide.updated))}</time> ·{' '}
          <Link href="/guides" className="text-[#9E4C22] underline underline-offset-2 decoration-[#9E4C22]/40 hover:decoration-[#9E4C22]">
            All guides
          </Link>
        </p>

        {guide.sections.map(section => (
          <Section key={section.id} id={section.id} title={section.heading}>
            <GuideBody blocks={section.blocks} />
          </Section>
        ))}

        <Section id="faq" title="Common questions">
          {guide.faqs.map(faq => (
            <div key={faq.question}>
              <h3 className="font-sans text-[16px] font-medium text-[#2C2825] mb-2 leading-[1.5]">
                {faq.question}
              </h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </Section>

        <Section id="next" title="Where to next">
          <ul className="flex flex-wrap gap-3 list-none">
            {guide.shop.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-2 rounded-full border border-[#C9C0B2] bg-white px-5 py-2.5 text-[13px] text-[#2C2825] no-underline transition-colors hover:border-[#A8552C] hover:text-[#A8552C]"
                >
                  {link.label}
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="pt-2">Keep reading:</p>
          <ul className="flex flex-col gap-2 list-none">
            {relatedGuides(guide.slug).map(other => (
              <li key={other.slug}>
                <Link
                  href={`/guides/${other.slug}`}
                  className="text-[#9E4C22] underline underline-offset-2 decoration-[#9E4C22]/40 hover:decoration-[#9E4C22]"
                >
                  {other.title}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </LegalPage>
    </>
  )
}
