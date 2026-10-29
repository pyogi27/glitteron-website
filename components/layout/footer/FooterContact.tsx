import Link from 'next/link'
import { COMPANY } from '@/lib/company'
import { waMeUrl, WHATSAPP_MESSAGE } from '@/lib/whatsapp'
import { FOOTER_LINK_CLASS } from './footerLinks'

export default function FooterContact() {
  return (
    <div>
      <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#2C2825] mb-3.5">Contact</h3>
      <address className="not-italic flex flex-col gap-2.5 text-[13px] text-[#5C5449] leading-[1.55]">
        <a href={COMPANY.phoneHref} className={FOOTER_LINK_CLASS}>{COMPANY.phone}</a>
        <a href={`mailto:${COMPANY.email}`} className={FOOTER_LINK_CLASS}>{COMPANY.email}</a>
        <a
          href={waMeUrl(COMPANY.phone, WHATSAPP_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          className={FOOTER_LINK_CLASS}
        >
          Chat on WhatsApp
        </a>
        <Link href="/surat-store" className={`${FOOTER_LINK_CLASS} !block max-w-[240px]`}>
          Visit our Surat workshop
          <span className="block text-[12px] text-[#6E655C] mt-0.5">{COMPANY.address}</span>
        </Link>
      </address>
      {/* Mirrors the approved TrustFactors copy; change policy on /shipping and /returns first. */}
      <p className="mt-4 text-[12px] text-[#6E655C]">Free shipping across India · 7-day returns</p>
    </div>
  )
}
