import Link from 'next/link'
import Logo from '@/components/ui/Logo'

// Only profiles we can verify. Dead href="#" links are worse than no link, and
// each real one is a sameAs signal for the Organization schema.
// TODO: add facebook / pinterest / youtube here once those profiles exist.
const SOCIAL_LINKS = [
  { platform: 'Instagram', href: 'https://www.instagram.com/litmeup.in/' },
]

// The collections page filters on ?category=<category name>; the old ?cat= and
// ?room= params were read by nothing and silently landed on the unfiltered grid.
// Room links now point at the real /rooms/[slug] pages.
const FOOTER_LINKS = {
  // Category names must match the backend exactly — the page filters by name.
  Collections: [
    { label: 'Chandelier Lights', href: '/collections?category=Chandelier+Lights' },
    { label: 'Pendant Lights', href: '/collections?category=Pendant+Lights' },
    { label: 'Ceiling Lights', href: '/collections?category=Ceiling+Lights' },
    { label: 'Wall Lights', href: '/collections?category=Wall+Lights' },
    { label: 'Floor Lamps', href: '/collections?category=Floor+Lamps' },
  ],
  Rooms: [
    { label: 'Living Room', href: '/rooms/living-room' },
    { label: 'Dining Room', href: '/rooms/dining-room' },
    { label: 'Bedroom', href: '/rooms/bedroom' },
    { label: 'Kitchen & Island', href: '/rooms/kitchen' },
    { label: 'Shop All Rooms', href: '/rooms' },
  ],
  Help: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Shipping Policy', href: '/shipping' },
    { label: 'Returns & Exchange', href: '/returns' },
    { label: 'Room Visualizer', href: '/room-visualizer' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-[#EDE8E0] text-[#2C2825]/70 pt-12 pb-6 px-4 md:px-12">
      <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-6 md:gap-10 mb-8 pb-8 border-b border-[#D8D0C4]">
        {/* Brand column */}
        <div>
          <Logo />
          <p className="font-serif text-[17px] text-[#2C2825]/60 italic mt-2.5 mb-4 leading-[1.55]">
            Illuminate every corner<br />of your story.
          </p>
          {/* Social icons */}
          <div className="flex gap-2.5">
            {SOCIAL_LINKS.map(({ platform, href }) => (
              <a
                key={platform}
                href={href}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={`LitMeUp on ${platform}`}
                className="w-[34px] h-[34px] rounded-full border border-[#D8D0C4] flex items-center justify-center text-[#8B7D6E] transition-all duration-200 hover:border-[#A8552C] hover:text-[#A8552C] no-underline cursor-none"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([title, links]) => (
          <div key={title}>
            <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#2C2825] mb-3.5">
              {title}
            </h3>
            <ul className="list-none flex flex-col gap-2">
              {links.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[12.5px] text-[#5C5449] no-underline transition-colors duration-200 hover:text-[#A8552C]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11.5px] text-[#8B7D6E]">
        <span>© {new Date().getFullYear()} LitMeUp. All rights reserved.</span>
        <div className="flex gap-6">
          <Link href="/privacy" className="text-[#8B7D6E] no-underline hover:text-[#A8552C] transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-[#8B7D6E] no-underline hover:text-[#A8552C] transition-colors">
            Terms of Use
          </Link>
        </div>
      </div>
    </footer>
  )
}
