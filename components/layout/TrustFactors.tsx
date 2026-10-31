import { COMPANY } from '@/lib/company'

const ICON_PROPS = {
  width: 36,
  height: 36,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

const TruckIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M2 6.5h12v10H2zM14 10h4l3 3.5v3h-7" />
    <circle cx="6" cy="17.5" r="1.75" />
    <circle cx="17" cy="17.5" r="1.75" />
  </svg>
)

const ReturnIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4" />
    <path d="M8.5 10.5 12 8.5l3.5 2v4L12 16.5l-3.5-2zM8.5 10.5 12 12.5l3.5-2M12 12.5v4" />
  </svg>
)

const LockIcon = () => (
  <svg {...ICON_PROPS}>
    <rect x="5" y="10.5" width="14" height="10" rx="1.5" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5M12 14.5v2.5" />
  </svg>
)

const ChatIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M4 5h16v11H9l-4 3.5V16H4z" />
    <path d="M8 9.5h8M8 12.5h5" />
  </svg>
)

// Shipping and returns are published on /shipping, /returns and /faq.
// Change the policy there first, then here.
const FACTORS = [
  {
    Icon: TruckIcon,
    title: 'Free Shipping',
    subtitle: <>Across India, delivered in <span className="whitespace-nowrap">5–7 days</span></>,
  },
  { Icon: ReturnIcon, title: 'Easy Returns', subtitle: 'Within 7 days of delivery' },
  { Icon: LockIcon, title: 'Secure Payments', subtitle: 'Safe, encrypted checkout system' },
  {
    Icon: ChatIcon,
    title: 'Top-Notch Support',
    subtitle: (
      <>
        Call our support{' '}
        <a href={COMPANY.phoneHref} className="whitespace-nowrap underline-offset-4 hover:underline focus-visible:underline">
          {COMPANY.phone}
        </a>
      </>
    ),
  },
]

export default function TrustFactors() {
  return (
    <section aria-labelledby="trust-factors-heading" className="bg-white border-t border-warm-gray px-4 md:px-12 py-12 md:py-16">
      <h2 id="trust-factors-heading" className="sr-only">
        Why shop with LitMeUp
      </h2>
      <ul className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 list-none">
        {FACTORS.map(({ Icon, title, subtitle }) => (
          <li key={title} className="flex flex-col items-center text-center text-dark">
            <Icon />
            <h3 className="mt-5 text-[12px] md:text-[13px] font-normal uppercase tracking-[0.18em] text-dark/80 leading-snug">
              {title}
            </h3>
            <p className="mt-2.5 text-[13px] md:text-[14px] text-dark/70 leading-snug">{subtitle}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
