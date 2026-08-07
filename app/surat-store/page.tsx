import type { Metadata } from 'next'
import Link from 'next/link'
import PageBanner from '@/components/collections/PageBanner'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbSchema, faqSchema, localBusinessSchema } from '@/lib/seo/schema'
import { categories } from '@/lib/data/categories'
import { cities } from '@/lib/data/cities'
import { COMPANY } from '@/lib/company'

// The layout appends " | LitMeUp", so the brand does not belong in here twice.
const TITLE = 'Lighting Store in Surat — Visit Our Workshop'
const DESCRIPTION =
  'Visit the LitMeUp workshop in Udhana, Surat — 500+ handcrafted chandeliers and pendant lights, lit and on display. Open Monday to Saturday, 10am to 7pm.'

/** Address-only map link. No coordinates, because we have none surveyed. */
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${COMPANY.name}, ${COMPANY.address}`,
)}`

const FAQS = [
  {
    question: 'Where is the LitMeUp workshop?',
    answer: `${COMPANY.address}. It is in the Udhana industrial area, off Udhana Magdalla Road near Navjivan Circle.`,
  },
  {
    question: 'What are your opening hours?',
    answer:
      'Monday to Saturday, 10am to 7pm. Closed on Sundays. Call ahead on a public holiday — the workshop keeps local holidays.',
  },
  {
    question: 'Can I see fixtures lit before buying?',
    answer:
      'Yes, that is the main reason to come. Finish and colour temperature are the two things photographs are worst at, and both are settled in about a minute in person.',
  },
  {
    question: 'Do you have stores in other cities?',
    answer:
      'No. Surat is our only location. We sell direct to customers everywhere else in India, with free shipping and no dealer margin in the price.',
  },
]

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/surat-store' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/surat-store', type: 'website' },
}

export default function SuratStorePage() {
  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={faqSchema(FAQS, '/surat-store')} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Visit the workshop', path: '/surat-store' },
        ])}
      />
      <PageBanner
        eyebrow="Surat, Gujarat"
        title="Visit the Workshop"
        subtitle="Every LitMeUp fixture is made here, and you are welcome to come and see them lit."
        stats={[
          { num: 'Mon–Sat', label: 'Open' },
          { num: '10–7', label: 'Hours' },
          { num: '2016', label: 'Since' },
        ]}
      />

      <section className="bg-[#EDE8E0] text-[#2C2825] px-6 md:px-12 pb-20 pt-10">
        <div className="max-w-[760px]">
          <div className="grid sm:grid-cols-2 gap-10 mb-14">
            <div>
              <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#A85B3B] mb-4">
                Address
              </h2>
              <address className="not-italic text-[15px] font-light leading-[1.9] text-[#2C2825]/75">
                69 Jalaram Industrial Estate<br />
                Navjivan Circle, Udhana Magdalla Road<br />
                Surat, Gujarat 395007<br />
                India
              </address>
              <a
                href={MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-[14px] font-light text-[#A8552C] no-underline hover:underline"
              >
                Open in Google Maps
              </a>
            </div>

            <div>
              <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#A85B3B] mb-4">
                Hours &amp; contact
              </h2>
              <p className="text-[15px] font-light leading-[1.9] text-[#2C2825]/75">
                Monday to Saturday, 10am – 7pm<br />
                Closed Sunday
              </p>
              <p className="text-[15px] font-light leading-[1.9] text-[#2C2825]/75 mt-3">
                <a href={COMPANY.phoneHref} className="text-[#A8552C] no-underline hover:underline">
                  {COMPANY.phone}
                </a>
                <br />
                <a href={`mailto:${COMPANY.email}`} className="text-[#A8552C] no-underline hover:underline">
                  {COMPANY.email}
                </a>
              </p>
            </div>
          </div>

          <h2 className="font-serif text-[clamp(26px,3.2vw,38px)] font-light leading-[1.2] mb-6">
            What you will find here
          </h2>
          <p className="text-[15px] font-light leading-[1.9] text-[#2C2825]/75 mb-5">
            This is a working workshop rather than a showroom floor, and that is the point.
            Brass is turned and plated here, glass is blown and fitted here, and every fixture
            is assembled and inspected here before it ships. What is on display is what is being
            made.
          </p>
          <p className="text-[15px] font-light leading-[1.9] text-[#2C2825]/75 mb-5">
            Come for the two decisions photographs are worst at. Finish is one — twelve of them,
            and the difference between antique brass and aged brass is obvious in the hand and
            invisible on a screen. Colour temperature is the other; standing under a 2700K and a
            3500K fixture side by side settles in a minute what a spec sheet never does.
          </p>
          <p className="text-[15px] font-light leading-[1.9] text-[#2C2825]/75 mb-5">
            Surat is about 265 km from Ahmedabad and 280 km from Mumbai, both an easy drive.
            If you cannot make it, everything here ships free anywhere in India with a 7-day
            return window, so buying unseen is not the risk it sounds like.
          </p>

          <h2 className="font-serif text-[clamp(24px,3vw,32px)] font-light leading-[1.2] mt-14 mb-6">
            Visiting — common questions
          </h2>
          <div className="border-t border-[#D8D0C4]">
            {FAQS.map(faq => (
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
                Browse before you come
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
                Cannot visit? We deliver
              </h3>
              <ul className="space-y-2.5">
                {cities.map(city => (
                  <li key={city.slug}>
                    <Link
                      href={`/lighting/${city.slug}`}
                      className="text-[14px] font-light text-[#2C2825]/75 no-underline hover:text-[#A8552C] transition-colors"
                    >
                      Lighting delivered to {city.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
