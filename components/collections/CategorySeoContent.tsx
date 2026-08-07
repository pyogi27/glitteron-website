import Link from 'next/link'
import { bandSlug, categories, formatInr, type LightCategory } from '@/lib/data/categories'
import { getRoomSubPage } from '@/lib/data/category-rooms'
import { guides } from '@/lib/data/guides'
import { rooms } from '@/lib/data/rooms'

/**
 * Below-the-grid copy for a category landing page: prose that explains what
 * the shopper is choosing between, the questions they ask before buying, and
 * links onward to the guides and room pages that answer them at length.
 *
 * <details> rather than a JS accordion — the answers stay in the HTML for both
 * the crawler and a keyboard, and the page ships no extra script.
 */
export default function CategorySeoContent({ category }: { category: LightCategory }) {
  const linkedGuides = category.guides
    .map(slug => guides.find(g => g.slug === slug))
    .filter((g): g is NonNullable<typeof g> => Boolean(g))

  // Prefer the category's own room page ("Dining Room Chandeliers") over the
  // generic /rooms page — it is the more specific destination and the one we
  // want the crawler to reach from here.
  const linkedRooms = category.rooms.flatMap(slug => {
    const room = rooms.find(r => r.slug === slug)
    if (!room) return []
    const subPage = getRoomSubPage(category.slug, slug)
    return [{
      href: subPage ? `/${category.slug}/${slug}` : `/rooms/${slug}`,
      label: subPage ? subPage.heading : `${room.name} lighting`,
    }]
  })

  const siblings = categories.filter(c => c.slug !== category.slug)

  return (
    <section className="bg-[#EDE8E0] text-[#2C2825] px-6 md:px-12 pb-20 pt-4">
      <div className="max-w-[760px]">
        <h2 className="font-serif text-[clamp(26px,3.2vw,38px)] font-light leading-[1.2] mb-6">
          Choosing {category.heading.toLowerCase()}
        </h2>
        {category.intro.map(para => (
          <p key={para.slice(0, 40)} className="text-[15px] font-light leading-[1.9] text-[#2C2825]/75 mb-5">
            {para}
          </p>
        ))}

        <h2 className="font-serif text-[clamp(24px,3vw,32px)] font-light leading-[1.2] mt-14 mb-6">
          {category.heading} — common questions
        </h2>
        <div className="border-t border-[#D8D0C4]">
          {category.faqs.map(faq => (
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
              <p className="text-[14px] font-light leading-[1.85] text-[#2C2825]/70 mt-3 pr-8">{faq.answer}</p>
            </details>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-10 mt-14">
          <div>
            <h3 className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#A85B3B] mb-4">
              Read before you buy
            </h3>
            <ul className="space-y-2.5">
              {linkedGuides.map(guide => (
                <li key={guide.slug}>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="text-[14px] font-light text-[#2C2825]/75 no-underline hover:text-[#A8552C] transition-colors"
                  >
                    {guide.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#A85B3B] mb-4">
              Shop by room
            </h3>
            <ul className="space-y-2.5">
              {linkedRooms.map(room => (
                <li key={room.href}>
                  <Link
                    href={room.href}
                    className="text-[14px] font-light text-[#2C2825]/75 no-underline hover:text-[#A8552C] transition-colors"
                  >
                    {room.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {category.priceBands.length > 0 && (
          <>
            <h3 className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#A85B3B] mt-14 mb-4">
              Shop by budget
            </h3>
            <ul className="flex flex-wrap gap-x-6 gap-y-2.5">
              {category.priceBands.map(band => (
                <li key={band.max}>
                  <Link
                    href={`/${category.slug}/${bandSlug(band)}`}
                    className="text-[14px] font-light text-[#2C2825]/75 no-underline hover:text-[#A8552C] transition-colors"
                  >
                    {category.shortName} under {formatInr(band.max)}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <h3 className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#A85B3B] mt-14 mb-4">
          More lighting
        </h3>
        <ul className="flex flex-wrap gap-x-6 gap-y-2.5">
          {siblings.map(sibling => (
            <li key={sibling.slug}>
              <Link
                href={`/${sibling.slug}`}
                className="text-[14px] font-light text-[#2C2825]/75 no-underline hover:text-[#A8552C] transition-colors"
              >
                {sibling.heading}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
