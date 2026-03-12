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
    <footer className="bg-black text-white/60 pt-[72px] pb-9 px-12">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-14 mb-14 pb-14 border-b border-white/[0.07]">
        {/* Brand column */}
        <div>
          <Logo light />
          <p className="font-serif text-[17px] text-white/38 italic mt-3.5 mb-5 leading-[1.55]">
            Illuminate every corner<br />of your story.
          </p>
          {/* Social icons */}
          <div className="flex gap-2.5">
            {['instagram', 'facebook', 'pinterest', 'youtube'].map((platform) => (
              <a
                key={platform}
                href="#"
                aria-label={platform}
                className="w-[34px] h-[34px] rounded-full border border-white/14 flex items-center justify-center text-white/45 transition-all duration-200 hover:border-gold hover:text-gold no-underline cursor-none"
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
            <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white mb-5">
              {title}
            </h3>
            <ul className="list-none flex flex-col gap-3">
              {links.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[12.5px] text-white/48 no-underline transition-colors duration-200 hover:text-gold"
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
      <div className="flex items-center justify-between text-[11.5px] text-white/28">
        <span>© {new Date().getFullYear()} GlitterOn. All rights reserved.</span>
        <div className="flex gap-6">
          <Link href="/privacy" className="text-white/28 no-underline hover:text-gold/60 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="text-white/28 no-underline hover:text-gold/60 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  )
}
