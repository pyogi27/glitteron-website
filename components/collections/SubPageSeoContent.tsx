import Link from 'next/link'
import type { CategoryFaq, LightCategory } from '@/lib/data/categories'
import { guides } from '@/lib/data/guides'

interface Props {
  category: LightCategory
  heading: string
  intro: string[]
  faqs: CategoryFaq[]
  /** Sibling links within the same category: other rooms, other price bands. */
  siblings: { label: string; href: string }[]
  siblingsLabel: string
}

/**
 * Below-the-grid copy for a sub-tier page (room or price band). Same shape as
 * the category version, but the sideways links point within the category —
 * a shopper on "dining room chandeliers" wants the other rooms and the budget
 * cuts, not a jump to floor lamps.
 */
export default function SubPageSeoContent({
  category,
  heading,
  intro,
  faqs,
  siblings,
  siblingsLabel,
}: Props) {
  const linkedGuides = category.guides
    .map(slug => guides.find(g => g.slug === slug))
    .filter((g): g is NonNullable<typeof g> => Boolean(g))

  return (
    <section className="bg-[#EDE8E0] text-[#2C2825] px-6 md:px-12 pb-20 pt-4">
      <div className="max-w-[760px]">
        <h2 className="font-serif text-[clamp(26px,3.2vw,38px)] font-light leading-[1.2] mb-6">
          Choosing {heading.toLowerCase()}
        </h2>
        {intro.map(para => (
          <p key={para.slice(0, 40)} className="text-[15px] font-light leading-[1.9] text-[#2C2825]/75 mb-5">
            {para}
          </p>
        ))}

        {faqs.length > 0 && (
          <>
            <h2 className="font-serif text-[clamp(24px,3vw,32px)] font-light leading-[1.2] mt-14 mb-6">
              {heading} — common questions
            </h2>
            <div className="border-t border-[#D8D0C4]">
              {faqs.map(faq => (
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
          </>
        )}

        <div className="grid sm:grid-cols-2 gap-10 mt-14">
          {siblings.length > 0 && (
            <div>
              <h3 className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#A85B3B] mb-4">
                {siblingsLabel}
              </h3>
              <ul className="space-y-2.5">
                {siblings.map(sibling => (
                  <li key={sibling.href}>
                    <Link
                      href={sibling.href}
                      className="text-[14px] font-light text-[#2C2825]/75 no-underline hover:text-[#A8552C] transition-colors"
                    >
                      {sibling.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
              <li>
                <Link
                  href={`/${category.slug}`}
                  className="text-[14px] font-light text-[#2C2825]/75 no-underline hover:text-[#A8552C] transition-colors"
                >
                  All {category.heading.toLowerCase()}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
