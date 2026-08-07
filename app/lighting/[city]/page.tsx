import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageBanner from '@/components/collections/PageBanner'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbSchema, faqSchema } from '@/lib/seo/schema'
import { categories } from '@/lib/data/categories'
import { cities, getCityBySlug } from '@/lib/data/cities'
import { guides } from '@/lib/data/guides'

interface Props {
  params: Promise<{ city: string }>
}

export function generateStaticParams() {
  return cities.map(city => ({ city: city.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug((await params).city)
  if (!city) return {}

  const canonical = `/lighting/${city.slug}`
  return {
    title: city.title,
    description: city.description,
    alternates: { canonical },
    openGraph: { title: city.title, description: city.description, url: canonical, type: 'website' },
  }
}

/**
 * City delivery page: `/lighting/mumbai`.
 *
 * Explicitly not a store page — there is one LitMeUp address and it is in
 * Surat. Only /surat-store carries LocalBusiness markup; these pages carry
 * FAQPage and say in plain text that there is no local showroom.
 */
export default async function CityPage({ params }: Props) {
  const city = getCityBySlug((await params).city)
  if (!city) notFound()

  const others = cities.filter(other => other.slug !== city.slug)

  return (
    <>
      <JsonLd data={faqSchema(city.faqs, `/lighting/${city.slug}`)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Visit the workshop', path: '/surat-store' },
          { name: city.name, path: `/lighting/${city.slug}` },
        ])}
      />
      <PageBanner
        eyebrow={city.state}
        title={`Lighting Delivered to ${city.name}`}
        subtitle={city.subtitle}
        stats={[
          { num: 'Free', label: 'Shipping' },
          { num: '5–7d', label: 'Delivery' },
          { num: '5yr', label: 'Warranty' },
        ]}
      />

      <section className="bg-[#EDE8E0] text-[#2C2825] px-6 md:px-12 pb-20 pt-10">
        <div className="max-w-[760px]">
          {city.intro.map(para => (
            <p key={para.slice(0, 40)} className="text-[15px] font-light leading-[1.9] text-[#2C2825]/75 mb-5">
              {para}
            </p>
          ))}

          {/* Said plainly, on every city page. The whole point of this URL family
              is that it ranks locally without pretending to a local address. */}
          <p className="text-[14px] font-light leading-[1.85] text-[#2C2825]/60 border-l-2 border-[#C4714A] pl-5 my-10">
            LitMeUp has no showroom in {city.name}. Everything is made at, and ships from, our
            workshop in Surat, Gujarat — which is why there is no dealer margin in the price.{' '}
            <Link href="/surat-store" className="text-[#A8552C] no-underline hover:underline">
              Visit us there
            </Link>{' '}
            Monday to Saturday, 10am to 7pm.
          </p>

          <h2 className="font-serif text-[clamp(24px,3vw,32px)] font-light leading-[1.2] mt-14 mb-6">
            Buying from {city.name} — common questions
          </h2>
          <div className="border-t border-[#D8D0C4]">
            {city.faqs.map(faq => (
              <details key={faq.question} className="group border-b border-[#D8D0C4] py-4">
                <summary className="cursor-pointer list-none font-sans text-[15px] font-normal text-[#2C2825] marker:hidden flex items-start justify-between gap-4">
                  <span>{faq.question}</span>
                  <span
                    aria-hidden
                    className="text-[#A85B3B] shrink-0 transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="text-[14px] font-light leading-[1.85] text-[#2C2825]/70 mt-3 pr-8">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-10 mt-14">
            <div>
              <h3 className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#A85B3B] mb-4">
                Shop the range
              </h3>
              <ul className="space-y-2.5">
                {categories.map(category => (
                  <li key={category.slug}>
                    <Link
                      href={`/${category.slug}`}
                      className="text-[14px] font-light text-[#2C2825]/75 no-underline hover:text-[#A8552C] transition-colors"
                    >
                      {category.heading}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#A85B3B] mb-4">
                Read before you buy
              </h3>
              <ul className="space-y-2.5">
                {guides.slice(0, 3).map(guide => (
                  <li key={guide.slug}>
                    <Link
                      href={`/guides/${guide.slug}`}
                      className="text-[14px] font-light text-[#2C2825]/75 no-underline hover:text-[#A8552C] transition-colors"
                    >
                      {guide.title}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/shipping"
                    className="text-[14px] font-light text-[#2C2825]/75 no-underline hover:text-[#A8552C] transition-colors"
                  >
                    Shipping &amp; delivery policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <h3 className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#A85B3B] mt-14 mb-4">
            We also deliver to
          </h3>
          <ul className="flex flex-wrap gap-x-6 gap-y-2.5">
            {others.map(other => (
              <li key={other.slug}>
                <Link
                  href={`/lighting/${other.slug}`}
                  className="text-[14px] font-light text-[#2C2825]/75 no-underline hover:text-[#A8552C] transition-colors"
                >
                  {other.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
