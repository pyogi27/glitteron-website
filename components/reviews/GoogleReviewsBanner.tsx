// components/reviews/GoogleReviewsBanner.tsx
import StarRating from '@/components/ui/StarRating'
import GoogleReviewsTicker from '@/components/reviews/GoogleReviewsTicker'
import { fetchGoogleReviews } from '@/lib/api/googleReviews'
import { trustedCountLabel } from '@/lib/googleReviews'

/** The store's Google Business Profile rating and reviews, straight from the Places
 *  API. Renders nothing when the API is unconfigured, fails or has no reviews with
 *  text — no placeholder numbers, ever. Not part of any JSON-LD: review markup is
 *  reserved for on-site reviews (lib/seo/schema.ts). */
export default async function GoogleReviewsBanner() {
  const data = await fetchGoogleReviews()
  if (!data) return null

  // One decimal everywhere, so the stars' accessible label matches the number shown.
  const rating = data.rating.toFixed(1)
  const countLink = (
    <>
      {data.count.toLocaleString('en-IN')} Google review{data.count === 1 ? '' : 's'}
    </>
  )

  return (
    <section aria-labelledby="google-reviews-heading" className="py-16 lg:py-[100px] px-4 md:px-12 bg-[#EDE8E0]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 md:gap-16 items-center">
        <div>
          <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C4714A] mb-4">Google Reviews</div>
          <h2 id="google-reviews-heading" className="font-serif text-[clamp(32px,4vw,48px)] font-normal leading-[1.15]">
            Trusted by <em className="">{trustedCountLabel(data.count)}</em> customers
          </h2>

          {/* Places policy: the Google Maps logo, 16–19px tall, with clear space around it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/google-maps-logo.svg" alt="Google Maps" width={98} height={18} className="mt-8 mb-2" />

          <div className="mt-3 flex items-center gap-3">
            <span className="font-serif text-[40px] leading-none text-[#2C2825]">{rating}</span>
            <StarRating rating={Number(rating)} size={18} />
          </div>
          <p className="mt-3 text-[14px] text-[#2C2825]">
            {data.reviewsUrl ? (
              <a href={data.reviewsUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#C4714A] transition-colors">
                {countLink}
              </a>
            ) : countLink}
          </p>
          <p className="mt-4 text-[13.5px] leading-[1.7] text-[#5A5249] max-w-sm">
            Every rating here comes straight from our Google Business Profile.
          </p>
          {/* Places policy: disclose how displayed reviews are filtered and ordered. */}
          <p className="mt-2 text-[12px] text-[#5A5249]">
            Showing Google&apos;s most relevant reviews that include written text.
          </p>
        </div>

        <GoogleReviewsTicker reviews={data.reviews} />
      </div>
    </section>
  )
}
