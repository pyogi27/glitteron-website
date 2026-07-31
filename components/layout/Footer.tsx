import Link from 'next/link'
import Logo from '@/components/ui/Logo'

const FOOTER_LINKS = {
  Collections: [
    { label: 'Chandeliers', href: '/collections?cat=chandeliers' },
    { label: 'Pendant Lights', href: '/collections?cat=pendant' },
    { label: 'Sputnik Lights', href: '/collections?cat=sputnik' },
    { label: 'Dome Lights', href: '/collections?cat=dome' },
    { label: 'Crystal Lights', href: '/collections?cat=crystal' },
  ],
  Rooms: [
    { label: 'Living Room', href: '/collections?room=living-room' },
    { label: 'Dining Room', href: '/collections?room=dining-room' },
    { label: 'Bedroom', href: '/collections?room=bedroom' },
    { label: 'Home Office', href: '/collections?room=home-office' },
    { label: 'Foyer / Entrance', href: '/collections?room=foyer' },
  ],
  Help: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Shipping Policy', href: '/shipping' },
    { label: 'Returns & Warranty', href: '/returns' },
    { label: 'Installation Guide', href: '/installation' },
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
            {['instagram', 'facebook', 'pinterest', 'youtube'].map((platform) => (
              <a
                key={platform}
                href="#"
                aria-label={platform}
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
      <div className="flex items-center justify-between text-[11.5px] text-[#8B7D6E]">
        <span>© {new Date().getFullYear()} LitMeUp. All rights reserved.</span>
        <div className="flex gap-6">
          <Link href="/privacy" className="text-[#8B7D6E] no-underline hover:text-[#A8552C] transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="text-[#8B7D6E] no-underline hover:text-[#A8552C] transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  )
}
