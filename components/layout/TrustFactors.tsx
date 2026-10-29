// Shipping and returns are published on /shipping, /returns and /faq.
// Change the policy there first, then here.
const FACTORS = [
  { title: 'Free Shipping', subtitle: 'Across India, delivered in 5–7 days' },
  { title: 'Easy Returns', subtitle: 'Within 7 days of delivery' },
  // TODO: price match terms are not published anywhere yet. Confirm the subtitle
  // and add the policy to /faq or /shipping.
  { title: '100% Price Match', subtitle: 'Found it for less? We will match it' },
]

export default function TrustFactors() {
  return (
    <section aria-labelledby="trust-factors-heading" className="bg-white px-4 md:px-12 py-10 md:py-14">
      <h2 id="trust-factors-heading" className="sr-only">
        Why shop with LitMeUp
      </h2>
      <ul className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 list-none">
        {FACTORS.map(({ title, subtitle }) => (
          <li key={title} className="border border-warm-gray bg-white rounded-2xl px-6 py-8 md:py-10 text-center">
            <h3 className="font-serif text-[22px] font-normal text-dark leading-tight mb-2">{title}</h3>
            <p className="text-[14px] text-dark/75 leading-snug">{subtitle}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
