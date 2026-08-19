import type { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import TickerStrip from '@/components/home/TickerStrip'
import CollectionsSection from '@/components/home/CollectionsSection'
import ProductCarousel from '@/components/home/ProductCarousel'
import StatsDivider from '@/components/home/StatsDivider'
import RoomGrid from '@/components/home/RoomGrid'
import ShuffleDeck from '@/components/home/ShuffleDeck'
import SocialGrid from '@/components/home/SocialGrid'
import ReviewsSection from '@/components/home/ReviewsSection'
import NewsletterStrip from '@/components/home/NewsletterStrip'
import JsonLd from '@/components/seo/JsonLd'
import { organizationSchema, websiteSchema } from '@/lib/seo/schema'
import { fetchCategories, fetchFeaturedProducts } from '@/lib/api/server'

// Moved off the root layout: there it was inherited by every page that did not
// set its own canonical, so the account and cart pages each named the homepage
// as their canonical while also sending noindex — two contradictory signals.
export const metadata: Metadata = { alternates: { canonical: '/' } }

export default async function HomePage() {
  const [apiCategories, featured] = await Promise.all([
    fetchCategories(),
    // 29 cards are laid out below (8 + 16 + 5) and the API returns duplicates,
    // so over-fetch to leave room for the dedupe pass.
    fetchFeaturedProducts(45),
  ])

  // Three sections used to slice from index 0, so New Arrivals, Bestselling and
  // the shuffle deck all opened with the same two products. Carve disjoint
  // windows instead. Slices past the end are empty, which every consumer
  // handles, so a short catalog degrades to fewer cards rather than repeats.
  //
  // Dedupe first: /api/products returns the same product more than once in a
  // single page of results (MT3803-2 came back at both index 8 and 16), so
  // slicing alone still repeated cards inside one carousel.
  const seen = new Set<string>()
  const catalog = featured.filter(p => {
    const key = p.slug || String(p.id)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const newArrivals = catalog.slice(0, 8)
  const bestsellers = catalog.slice(8, 24)
  const curated = catalog.slice(24, 29)

  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={websiteSchema()} />
      <TickerStrip />
      <HeroSection />
      <CollectionsSection categories={apiCategories.length > 0 ? apiCategories.slice(0, 6) : undefined} />
      <ProductCarousel titlePrefix="New" titleHighlight="Arrivals" label="Just In" products={newArrivals} />
      <StatsDivider />
      <ProductCarousel titlePrefix="Bestselling" titleHighlight="Lights" label="Most Loved" products={bestsellers} />
      <RoomGrid />
      {/* A deck of one or two cards isn't a deck. Falling back to New Arrivals
          here would just reintroduce the duplication this split exists to fix,
          so a thin catalog drops the section instead. */}
      {curated.length >= 3 && <ShuffleDeck products={curated} />}
      <SocialGrid />
      <ReviewsSection />
      <NewsletterStrip />
    </>
  )
}
