import Image from 'next/image'
import { COMPANY } from '@/lib/company'
import { waMeUrl } from '@/lib/whatsapp'

/**
 * Homepage "free expert consultation" card: a dark card (after the Jainsons
 * Lights consultation band) split into a video-call photo and the three ways to
 * reach the team. There is no booking backend: video and chat open WhatsApp with
 * a prefilled message, phone dials the store.
 *
 * Styled in RoomGrid's language (edge-to-edge photo, one radius, small caps,
 * serif titles) rather than icon circles and mock call controls, which read as
 * a UI-kit template next to the rest of the page.
 */

const ArrowIcon = ({ className }: { className?: string }) => (
  // lucide-static 0.400.0 arrow-right (ISC)
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
)

const greeting = `Hi ${COMPANY.name},`
// Evaluated at build time, so a malformed COMPANY.phone fails the build rather than shipping dead links.
const BOOK_HREF = waMeUrl(COMPANY.phone, `${greeting} I'd like a free lighting consultation.`)

interface ConsultOption {
  title: string
  benefit: string
  /** What the link does, shown on the right from sm up. */
  action: string
  href: string
  opensWhatsApp: boolean
}

const OPTIONS: ConsultOption[] = [
  {
    title: 'Video call',
    benefit: 'See fixtures lit up on camera and get advice for your room.',
    action: 'Book on WhatsApp',
    href: waMeUrl(COMPANY.phone, `${greeting} I'd like a free video consultation to see fixtures for my room.`),
    opensWhatsApp: true,
  },
  {
    title: 'Phone call',
    benefit: 'Quick answers on sizing, wattage and colour temperature.',
    action: COMPANY.phone,
    href: COMPANY.phoneHref,
    opensWhatsApp: false,
  },
  {
    title: 'WhatsApp chat',
    benefit: 'Send photos of your room and get product picks back.',
    action: 'Send photos',
    href: waMeUrl(COMPANY.phone, `${greeting} I'd like product picks for my room. I'll send photos here.`),
    opensWhatsApp: true,
  },
]

// The questions the team answers, drawn on the photo: approximate white-light
// colours from warm (2700K) to daylight (6500K).
const KELVIN_SCALE = 'linear-gradient(90deg, #FFA757 0%, #FFC48A 30%, #FFE2C4 60%, #F3F2FF 100%)'

const NEW_TAB = { target: '_blank', rel: 'noopener noreferrer' } as const
const NEW_TAB_NOTE = <span className="sr-only"> (opens WhatsApp in a new tab)</span>
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light'

export default function ConsultationSection() {
  return (
    <section aria-labelledby="consultation-heading" className="py-[100px] px-4 md:px-12">
      <div className="overflow-hidden rounded-2xl bg-black lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="relative aspect-[16/9] lg:aspect-auto lg:min-h-[560px]">
          <Image
            src="https://images.pexels.com/photos/6585966/pexels-photo-6585966.jpeg?auto=compress&cs=tinysrgb&w=2400"
            alt="Woman smiling at her laptop on a video call, in a living room lit by warm table lamps"
            width={2400}
            height={1350}
            loading="lazy"
            // At lg the 16:9 photo is cropped to a column taller than its ratio, so the
            // rendered width is set by the column's height (~620-850px x 16/9), not by 50vw.
            sizes="(min-width: 1024px) 1500px, 100vw"
            // The tall lg crop shows only ~half the width: frame the lit lamps and the
            // laptop there, not a close-up face (which read as generic stock).
            className="absolute inset-0 h-full w-full object-cover object-[58%_50%] lg:object-[16%_50%]"
          />
          {/* Bottom scrim for the scale; on desktop the photo also fades into the card. */}
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-r from-transparent to-black lg:block" />

          <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 text-white">
            {/* Same chip as RoomGrid's "128 designs" tag. */}
            <span className="w-fit rounded-full bg-black/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] backdrop-blur-sm">
              Video consult
            </span>
            <div className="max-w-[420px]">
              <div className="h-1 rounded-full" style={{ background: KELVIN_SCALE }} />
              <div className="mt-2.5 flex justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-white/85">
                <span>2700K warm</span>
                <span>4000K neutral</span>
                <span>6500K day</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-10 sm:px-10 sm:py-12 lg:py-16 lg:pl-8 lg:pr-16">
          <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] uppercase text-[#C4714A] mb-4">
            <span className="w-8 h-px bg-[#C4714A] inline-block" />
            Free Expert Help
          </div>
          <h2 id="consultation-heading" className="font-serif text-[clamp(32px,4vw,52px)] font-normal leading-[1.15] text-white">
            Light your room right, <em className="text-gold-light">with an expert</em>
          </h2>
          <p className="mt-4 max-w-[46ch] text-[15px] font-normal leading-relaxed text-white/75">
            Not sure which light suits your room? Our team helps you pick the fixture, size and warmth, free.
          </p>

          <ul className="mt-10 border-t border-white/15">
            {OPTIONS.map((o, i) => (
              <li key={o.title} className="border-b border-white/15">
                <a
                  href={o.href}
                  {...(o.opensWhatsApp ? NEW_TAB : {})}
                  className={`group grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-5 py-5 text-white no-underline ${FOCUS}`}
                >
                  <span aria-hidden="true" className="text-[11px] font-medium tabular-nums tracking-[0.14em] text-[#C4714A]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <span className="block font-serif text-[22px] font-normal leading-tight group-hover:text-gold-light">{o.title}</span>
                    <span className="mt-1 block text-[13px] font-normal leading-snug text-white/65">{o.benefit}</span>
                  </span>
                  <span className="flex items-center gap-2 self-center text-[11px] font-medium uppercase tracking-[0.12em] text-white/70 group-hover:text-white">
                    <span className="hidden sm:inline whitespace-nowrap">{o.action}</span>
                    <ArrowIcon className="transition-transform group-hover:translate-x-1" />
                  </span>
                  {o.opensWhatsApp && NEW_TAB_NOTE}
                </a>
              </li>
            ))}
          </ul>

          {/* Dark text, not white: white on WhatsApp green is ~2:1, #1A1210 on it is ~9:1. */}
          <a
            href={BOOK_HREF}
            {...NEW_TAB}
            className={`group mt-10 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#25D366] px-6 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.06em] text-black no-underline transition-transform hover:-translate-y-0.5 sm:w-auto sm:px-8 sm:tracking-[0.08em] ${FOCUS}`}
          >
            {/* simple-icons 13 WhatsApp mark (CC0) */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="flex-none">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Book Free Consultation
            <ArrowIcon className="hidden flex-none sm:block transition-transform group-hover:translate-x-1" />
            {NEW_TAB_NOTE}
          </a>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-white/60">Free · No obligation</p>
        </div>
      </div>
    </section>
  )
}
