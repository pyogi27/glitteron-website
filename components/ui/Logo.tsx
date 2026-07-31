import Link from 'next/link'

interface LogoProps {
  light?: boolean
}

// ponytail: mark inlined from public/brand/litmeup-mark.svg so it recolours with
// the `light` variant. Wordmark stays live text — the lockup SVG needs Jost.
export default function Logo({ light = false }: LogoProps) {
  const shade = light ? '#C08A3E' : '#A85B3B'
  const plate = light ? '#E8E0D4' : '#2E2620'
  const glow = light ? '#C08A3E' : '#E5C88F'

  return (
    <Link
      href="/"
      aria-label="LitMeUp — home"
      className={`flex items-center gap-2.5 no-underline transition-colors ${
        light ? 'text-white' : 'text-dark'
      }`}
    >
      <span className="w-8 flex-shrink-0">
        <svg viewBox="0 0 84 73" fill="none" className="w-full h-auto" aria-hidden="true">
          <path d="M0 42 A42 42 0 0 1 84 42 Z" fill={shade} />
          <rect x="0" y="44" width="84" height="4" fill={plate} />
          <path d="M19 50 A23 23 0 0 0 65 50 Z" fill={glow} fillOpacity={light ? 0.5 : 1} />
        </svg>
      </span>
      <span className="font-serif text-[22px] font-medium tracking-[0.06em]">
        Lit<span className={light ? 'text-white/70' : 'text-[#8A7B69]'}>Me</span>Up
      </span>
    </Link>
  )
}
