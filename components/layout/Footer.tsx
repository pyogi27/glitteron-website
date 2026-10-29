import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import FooterBottomBar from './footer/FooterBottomBar'
import FooterContact from './footer/FooterContact'
import FooterNewsletter from './footer/FooterNewsletter'
import FooterSocial from './footer/FooterSocial'
import { FOOTER_COLUMNS, FOOTER_LINK_CLASS } from './footer/footerLinks'

export default function Footer() {
  return (
    <footer className="bg-[#EDE8E0] text-[#2C2825]/70 pt-12 pb-6 px-4 md:px-12">
      <div className="grid grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.3fr] gap-x-6 gap-y-10 lg:gap-10 mb-8 pb-8 border-b border-[#D8D0C4]">
        {/* Brand + newsletter + social */}
        <div className="col-span-2 lg:col-span-1 flex flex-col gap-5">
          <div>
            <Logo />
            <p className="font-serif text-[17px] text-[#2C2825]/70 mt-2.5 leading-[1.55]">
              Illuminate every corner<br />of your story.
            </p>
          </div>
          <FooterNewsletter />
          <FooterSocial />
        </div>

        <nav aria-label="Footer" className="contents">
          {FOOTER_COLUMNS.map(({ title, links }) => (
            <div key={title} className="min-w-0">
              <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#2C2825] mb-3.5">{title}</h3>
              <ul className="list-none flex flex-col gap-2.5">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className={FOOTER_LINK_CLASS}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="col-span-2 lg:col-span-1 min-w-0">
          <FooterContact />
        </div>
      </div>

      <FooterBottomBar />
    </footer>
  )
}
