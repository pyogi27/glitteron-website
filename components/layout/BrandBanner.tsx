// Slogan matches the footer brand column. About copy is drafted from the
// /about and /faq pages and needs owner sign-off.
export default function BrandBanner() {
  return (
    <section aria-labelledby="brand-banner-heading" className="bg-offwhite px-4 md:px-12 py-14 md:py-20">
      <div className="max-w-2xl mx-auto text-center">
        <h2
          id="brand-banner-heading"
          className="font-serif text-[clamp(28px,3.4vw,40px)] font-light italic text-dark leading-[1.2] mb-6"
        >
          Illuminate every corner of your story.
        </h2>
        <p className="text-[15px] text-dark/80 leading-[1.75] mb-4">
          LitMeUp is a Surat workshop making chandeliers, pendants and wall lights by hand, in brass, hand-blown glass
          and solid steel. Every fixture is assembled and inspected here before it ships.
        </p>
        <p className="text-[15px] text-dark/80 leading-[1.75]">
          We sell direct, with no showroom markup and no seasonal fake discounts, so the price you see is the price we
          stand behind. Every piece is dimmable as standard and covered by a five-year warranty.
        </p>
      </div>
    </section>
  )
}
