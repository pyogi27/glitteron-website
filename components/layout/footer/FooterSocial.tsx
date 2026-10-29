import { SOCIAL_LINKS } from './footerLinks'

function InstagramGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function FooterSocial() {
  return (
    <ul className="flex gap-2.5 list-none" aria-label="Social profiles">
      {SOCIAL_LINKS.map(({ platform, href }) => (
        <li key={platform}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer me"
            aria-label={`LitMeUp on ${platform}`}
            className="w-9 h-9 rounded-full border border-[#D8D0C4] flex items-center justify-center text-[#5C5449] no-underline cursor-none transition-all duration-200 hover:border-[#A8552C] hover:bg-[#A8552C] hover:text-[#EDE8E0] hover:-translate-y-0.5 focus-visible:border-[#A8552C] focus-visible:bg-[#A8552C] focus-visible:text-[#EDE8E0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C2825]"
          >
            <InstagramGlyph />
          </a>
        </li>
      ))}
    </ul>
  )
}
