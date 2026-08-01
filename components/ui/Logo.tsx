import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  /** Reversed (cream) artwork for dark/transparent backgrounds. */
  light?: boolean
  /** Larger placement for footers/splash where there is vertical room. */
  lockup?: boolean
}

// ponytail: official stacked artwork used as-is — no crops, no redraw.
// Source is 1624x2484 (0.654:1), so height drives the size and width follows.
const ART_W = 1624
const ART_H = 2484

export default function Logo({ light = false, lockup = false }: LogoProps) {
  const src = light
    ? '/brand/lit-me-up-stacked-reversed-transparent.png'
    : '/brand/lit-me-up-stacked-transparent.png'

  return (
    <Link href="/" aria-label="LitMeUp — home" className="inline-flex no-underline">
      <Image
        src={src}
        alt="LitMeUp"
        width={ART_W}
        height={ART_H}
        priority
        sizes={lockup ? '131px' : '59px'}
        className={lockup ? 'h-[200px] w-auto' : 'h-[90px] w-auto'}
      />
    </Link>
  )
}
