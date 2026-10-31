import type { ReactNode } from 'react'
import { COMPANY } from '@/lib/company'
import { waMeUrl } from '@/lib/whatsapp'
import { PhoneCallArt, VideoCallArt, WhatsAppArt } from './ConsultationArt'

/**
 * Homepage "free expert consultation" card: a dark card (after the Jainsons
 * Lights consultation band) with a headline and one illustrated card per way to
 * reach the team. There is no booking backend: video and chat open WhatsApp with
 * a prefilled message, phone dials the store. Each whole card is the link, so it
 * is one tap target on mobile.
 */

const ArrowIcon = ({ className }: { className?: string }) => (
  // lucide-static 0.400.0 arrow-right (ISC)
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
)

const greeting = `Hi ${COMPANY.name},`

interface ConsultOption {
  title: string
  benefit: string
  /** What the link does, shown under the benefit. */
  action: string
  href: string
  opensWhatsApp: boolean
  art: ReactNode
}

// Evaluated at build time, so a malformed COMPANY.phone fails the build rather than shipping dead links.
const OPTIONS: ConsultOption[] = [
  {
    title: 'Video call',
    benefit: 'See fixtures lit up on camera and get advice for your room.',
    action: 'Book on WhatsApp',
    href: waMeUrl(COMPANY.phone, `${greeting} I'd like a free video consultation to see fixtures for my room.`),
    opensWhatsApp: true,
    art: <VideoCallArt />,
  },
  {
    title: 'Phone call',
    benefit: 'Quick answers on sizing, wattage and colour temperature.',
    action: COMPANY.phone,
    href: COMPANY.phoneHref,
    opensWhatsApp: false,
    art: <PhoneCallArt />,
  },
  {
    title: 'WhatsApp chat',
    benefit: 'Send photos of your room and get product picks back.',
    action: 'Send photos',
    href: waMeUrl(COMPANY.phone, `${greeting} I'd like product picks for my room. I'll send photos here.`),
    opensWhatsApp: true,
    art: <WhatsAppArt />,
  },
]

const NEW_TAB = { target: '_blank', rel: 'noopener noreferrer' } as const
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light'

export default function ConsultationSection() {
  return (
    <section aria-labelledby="consultation-heading" className="py-[100px] px-4 md:px-12">
      <div className="rounded-2xl bg-black px-5 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] uppercase text-[#C4714A] mb-4">
          <span className="w-8 h-px bg-[#C4714A] inline-block" />
          Free Expert Help
        </div>
        <h2 id="consultation-heading" className="font-serif text-[clamp(32px,4vw,52px)] font-normal leading-[1.15] text-white">
          Light your room right, <em className="text-gold-light">with an expert</em>
        </h2>
        <p className="mt-4 max-w-[46ch] text-[15px] font-normal leading-relaxed text-white/75">
          Not sure which light suits your room? Pick how you&apos;d like to talk. It&apos;s free.
        </p>

        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {OPTIONS.map((o) => (
            <li key={o.title}>
              <a
                href={o.href}
                {...(o.opensWhatsApp ? NEW_TAB : {})}
                className={`group flex h-full flex-col overflow-hidden rounded-xl bg-brand-umber text-white no-underline ${FOCUS}`}
              >
                <div className="overflow-hidden border-b border-white/10">
                  <div className="transition-transform duration-500 motion-safe:group-hover:scale-[1.03]">{o.art}</div>
                </div>
                <div className="flex flex-1 flex-col px-6 pt-6 pb-7">
                  <span className="font-serif text-[26px] font-normal leading-tight group-hover:text-gold-light">{o.title}</span>
                  <span className="mt-2 text-[14px] font-normal leading-relaxed text-white/70">{o.benefit}</span>
                  <span className="mt-auto flex items-center gap-2 pt-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-gold-light">
                    <span className="whitespace-nowrap">{o.action}</span>
                    <ArrowIcon className="flex-none transition-transform group-hover:translate-x-1" />
                  </span>
                  {o.opensWhatsApp && <span className="sr-only"> (opens WhatsApp in a new tab)</span>}
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
