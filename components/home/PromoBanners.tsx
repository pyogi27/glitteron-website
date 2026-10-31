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
// the small ones 38fr of that, less a 16px gap. Below lg it is the category-tile
// layout: the large slot full width, the small ones side by side. Those tiles are
// portrait or near-square while the uploads are 4:1 (1920x480), so object-cover
// renders the image ~4x the tile's height wide; the sub-lg sizes say so, or a
// phone gets a 384px file stretched to ~1600px.
const SLOT = {
  large: {
    sizes: '(min-width: 1280px) 760px, (min-width: 1024px) 60vw, (min-width: 640px) 225vw, 500vw',
    frame: 'col-span-2 aspect-[4/5] sm:aspect-[16/9] lg:col-span-1 lg:row-span-2 lg:aspect-auto',
    pad: 'p-5 pb-6 sm:p-8 lg:p-11',
    title: 'text-[22px] sm:text-[28px] lg:text-[clamp(28px,3.6vw,48px)]',
    line: 'text-[13px] lg:text-[16px]',
  },
  small: {
    sizes: '(min-width: 1280px) 470px, (min-width: 1024px) 37vw, (min-width: 640px) 150vw, 200vw',
    frame: 'aspect-square sm:aspect-[4/3] lg:aspect-auto',
    pad: 'p-3 pb-4 sm:p-5 lg:p-7',
    title: 'text-[14px] sm:text-[18px] lg:text-[clamp(24px,2.4vw,32px)]',
    // A half-width phone tile only has room for the name.
    line: 'hidden sm:block text-[12px] lg:text-[14px]',
  },
} as const

export default function PromoBanners({ banners }: Props) {
  return (
    <section aria-labelledby="promo-banners-heading" className="bg-white px-6 pb-16 lg:pb-24">
      <h2 id="promo-banners-heading" className="sr-only">Featured collections</h2>
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-3 sm:gap-4 lg:h-[520px] lg:grid-cols-[minmax(0,62fr)_minmax(0,38fr)] lg:grid-rows-2">
        {banners.map((banner, i) => {
          const slot = i === 0 ? SLOT.large : SLOT.small
          return (
            <Link
              key={banner.id}
              href={banner.href}
              className={`group relative isolate flex flex-col items-center justify-end overflow-hidden rounded-xl bg-gradient-to-br text-center lg:items-start lg:justify-center lg:rounded-2xl lg:text-left from-brand-umber via-gold-dark to-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dark ${slot.frame} ${slot.pad}`}
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
                  the right half, where the shade fades out. Below lg the label sits
                  bottom-centre instead, so the same shade runs bottom-up over the
                  bottom 35% the label occupies. */}
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/65 via-35% to-black/0 to-75% lg:hidden" />
              <div aria-hidden="true" className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-black/80 via-black/65 via-60% to-black/10 lg:block" />
              <div className="flex w-full flex-col items-center text-white lg:max-w-[58%] lg:items-start">
                <h3 className={`font-sans font-medium uppercase leading-[1.1] tracking-[0.06em] lg:font-serif lg:font-normal lg:normal-case lg:leading-[1.05] lg:tracking-normal ${slot.title}`}>{banner.name}</h3>
                <p className={`mt-1.5 font-sans font-normal tracking-[0.02em] lg:mt-2 ${slot.line}`}>{banner.valueLine}</p>
                {/* Styled, not a button: the whole banner is the one link. Below lg
                    the tile alone is the call to action, as on category tiles. */}
                <span className="mt-5 hidden items-center lg:inline-flex gap-2 whitespace-nowrap rounded-full bg-black px-5 py-2.5 font-sans text-[12px] font-medium uppercase tracking-[0.12em] text-white transition-colors duration-300 group-hover:bg-gold-dark">
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
