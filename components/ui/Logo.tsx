import Link from 'next/link'

interface LogoProps {
  light?: boolean
}

export default function Logo({ light = false }: LogoProps) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 no-underline transition-colors ${
        light ? 'text-white' : 'text-dark'
      }`}
    >
      <div className="w-8 h-8 flex-shrink-0">
        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
          <circle cx="16" cy="8" r="3" fill="#C4714A" />
          <path d="M16 11L10 22L22 22Z" fill="none" stroke="#C4714A" strokeWidth="1.2" />
          <ellipse cx="16" cy="23" rx="6" ry="2" fill="none" stroke="#C4714A" strokeWidth="1" />
          <line x1="13" y1="22" x2="11" y2="27" stroke="#C4714A" strokeWidth="0.8" />
          <line x1="16" y1="22" x2="16" y2="27" stroke="#C4714A" strokeWidth="0.8" />
          <line x1="19" y1="22" x2="21" y2="27" stroke="#C4714A" strokeWidth="0.8" />
          <circle cx="11" cy="27.5" r="1.2" fill="#C4714A" />
          <circle cx="16" cy="27.5" r="1.2" fill="#C4714A" />
          <circle cx="21" cy="27.5" r="1.2" fill="#C4714A" />
        </svg>
      </div>
      <span className="font-serif text-[22px] font-medium tracking-[0.06em]">
        Litme<span className="text-gold">Up</span>
      </span>
    </Link>
  )
}
