import Image from 'next/image'
import Link from 'next/link'

export interface PromoBanner {
  id: number
  name: string
  href: string
  /** null renders the brand gradient instead. See promoImageOf in lib/promoBanners.ts. */
  image: string | null
  /** "Up to N% Off" or the category's value line. See promoValueLine. */
  valueLine: string
}

interface Props {
  /** Ordered: the first is the large banner, the next two stack on the right. */
  banners: PromoBanner[]
}

// Rendered width of each slot, so the browser picks a fitting srcset entry. Content
// is 1232px at most (1280 - 2×24 padding); on desktop the large slot takes 62fr and
// the small ones 38fr of that, less a 16px gap.
const SLOT = {
  large: {
    sizes: '(min-width: 1280px) 760px, (min-width: 1024px) 60vw, 100vw',
    frame: 'aspect-[5/4] sm:col-span-2 sm:aspect-[16/9] lg:col-span-1 lg:row-span-2 lg:aspect-auto',
    pad: 'p-5 sm:p-8 lg:p-11',
    title: 'text-[clamp(28px,3.6vw,48px)]',
    line: 'text-[14px] lg:text-[16px]',
  },
  small: {
    sizes: '(min-width: 1280px) 470px, (min-width: 1024px) 37vw, (min-width: 640px) 50vw, 100vw',
    frame: 'aspect-[3/2] sm:aspect-[4/3] lg:aspect-auto',
    pad: 'p-5 lg:p-7',
    title: 'text-[clamp(24px,2.4vw,32px)]',
    line: 'text-[13px] lg:text-[14px]',
  },
} as const

export default function PromoBanners({ banners }: Props) {
  return (
    <section aria-labelledby="promo-banners-heading" className="bg-white px-6 pb-16 lg:pb-24">
      <h2 id="promo-banners-heading" className="sr-only">Featured collections</h2>
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-4 sm:grid-cols-2 lg:h-[520px] lg:grid-cols-[minmax(0,62fr)_minmax(0,38fr)] lg:grid-rows-2">
        {banners.map((banner, i) => {
          const slot = i === 0 ? SLOT.large : SLOT.small
          return (
            <Link
              key={banner.id}
              href={banner.href}
              className={`group relative isolate flex flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-umber via-gold-dark to-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dark ${slot.frame} ${slot.pad}`}
            >
              {banner.image && (
                <Image
                  src={banner.image}
                  // Decorative: the heading inside the link already names it.
                  alt=""
                  fill
                  sizes={slot.sizes}
                  className="-z-10 object-cover transition-transform duration-[1200ms] ease-out motion-safe:[@media(hover:hover)]:group-hover:scale-105"
                />
              )}
              {/* Admin-uploaded photos run from near-black to near-white, so hold at
                  least 65% black under the text column (left 60%): that keeps
                  #EDE8E0 text at ≥5.7:1 even over pure white. The product sits on
                  the right half, where the shade fades out. */}
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/65 via-60% to-black/10" />
              <div className="flex max-w-[58%] flex-col items-start text-white">
                <h3 className={`font-serif font-light italic leading-[1.05] ${slot.title}`}>{banner.name}</h3>
                <p className={`mt-2 font-sans font-light tracking-[0.02em] ${slot.line}`}>{banner.valueLine}</p>
                {/* Styled, not a button: the whole banner is the one link. */}
                <span className="mt-5 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-black px-5 py-2.5 font-sans text-[12px] font-medium uppercase tracking-[0.12em] text-white transition-colors duration-300 group-hover:bg-gold-dark">
                  Shop Now <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
