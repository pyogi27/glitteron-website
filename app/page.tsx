import type { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import TickerStrip from '@/components/home/TickerStrip'
import CollectionsSection from '@/components/home/CollectionsSection'
import ProductCarousel from '@/components/home/ProductCarousel'
import VideoCarousel from '@/components/home/VideoCarousel'
import StatsDivider from '@/components/home/StatsDivider'
import RoomGrid from '@/components/home/RoomGrid'
import ConsultationSection from '@/components/home/ConsultationSection'
import PromoBanners from '@/components/home/PromoBanners'
import DealOfTheDay from '@/components/home/DealOfTheDay'
import SocialGrid from '@/components/home/SocialGrid'
import GoogleReviewsBanner from '@/components/reviews/GoogleReviewsBanner'
import NewsletterStrip from '@/components/home/NewsletterStrip'
import JsonLd from '@/components/seo/JsonLd'
import { organizationSchema, videoObjectSchema, websiteSchema } from '@/lib/seo/schema'
import { fetchCategories, fetchFeaturedProducts, fetchProductVideos, fetchProducts, mapApiProduct } from '@/lib/api/server'
import { categoryPath } from '@/lib/data/categories'
import { listingPrice } from '@/lib/pricing'
import { promoImageOf, promoValueLine } from '@/lib/promoBanners'
import { dedupeProducts, selectDealProducts } from '@/lib/dealOfTheDay'

// Moved off the root layout: there it was inherited by every page that did not
// set its own canonical, so the account and cart pages each named the homepage
// as their canonical while also sending noindex — two contradictory signals.
export const metadata: Metadata = { alternates: { canonical: '/' } }

// Merchandising order for the homepage "Shop by Collection" grid, by category
// id: Pendant, Chandelier, Ceiling, Wall, Table, Floor, Bulb.
const COLLECTION_ORDER = [5, 4, 2, 1, 7, 3, 6]

// Homepage promo banners, by category id: the first is the large one, the next two
// stack beside it. `name` is only used when /api/categories fails; `valueLine`
// replaces "Up to N% Off" while no product in the category is discounted.
const PROMO_BANNERS = [
  { id: 4, name: 'Chandelier Lights', valueLine: 'Handcrafted statement pieces' },
  { id: 5, name: 'Pendant Lights', valueLine: 'Warm light over every table' },
  { id: 1, name: 'Wall Lights', valueLine: 'Soft glow for every wall' },
]

// One request covers a whole category (273 products at most, measured 2026-10-21),
// so "Up to N%" is the true maximum rather than the first page's.
const PROMO_PRODUCT_LIMIT = 500

export default async function HomePage() {
  const [apiCategories, featured, videos, promoProducts] = await Promise.all([
    fetchCategories(),
    // 24 cards are laid out below (8 + 16) and the API returns duplicates,
    // so over-fetch to leave room for the dedupe pass.
    fetchFeaturedProducts(45),
    fetchProductVideos(12),
    // fetchProducts never rejects: a failed request comes back empty, so that
    // banner shows its value line instead of a discount.
    Promise.all(PROMO_BANNERS.map(b => fetchProducts({ categoryId: b.id, limit: PROMO_PRODUCT_LIMIT }))),
  ])

  // Two sections used to slice from index 0, so New Arrivals and Bestselling
  // both opened with the same products. Carve disjoint
  // windows instead. Slices past the end are empty, which every consumer
  // handles, so a short catalog degrades to fewer cards rather than repeats.
  //
  // Dedupe first: /api/products returns the same product more than once in a
  // single page of results (MT3803-2 came back at both index 8 and 16), so
  // slicing alone still repeated cards inside one carousel.
  const catalog = dedupeProducts(featured)

  // flatMap over the ids, not a sort on the API order: an id the backend drops
  // just yields one fewer card.
  const collections = COLLECTION_ORDER.flatMap(id => apiCategories.filter(c => Number(c.id) === id))

  const newArrivals = catalog.slice(0, 8)
  const bestsellers = catalog.slice(8, 24)

  const promoBanners = PROMO_BANNERS.map((b, i) => {
    const category = apiCategories.find(c => Number(c.id) === b.id)
    const name = category?.name ?? b.name
    return {
      id: b.id,
      name,
      href: categoryPath(name) ?? `/collections?category=${encodeURIComponent(name)}`,
      image: promoImageOf(category),
      // listingPrice is what puts the "-N%" badge on product cards, so the banner
      // can only quote a discount a shopper will actually find.
      valueLine: promoValueLine(promoProducts[i].products.map(p => listingPrice(p).discount), b.valueLine),
    }
  })

  // Deal of the Day draws on what is already fetched: the featured page plus the three
  // promo categories (~650 products). Only discounted rows are mapped, so the extra
  // work is proportional to the deals, not the catalogue.
  // ponytail: categories outside PROMO_BANNERS only contribute via `featured`; fetch
  // them too if their discounts go missing from the carousel.
  const deals = selectDealProducts(
    [...catalog, ...promoProducts.flatMap(r => r.products.filter(p => (listingPrice(p).discount ?? 0) > 0).map(p => mapApiProduct(p)))],
    catalog,
  )

  // One or two videos read as a broken rail, so a thin (or failed) response
  // drops the section.
  const showVideos = videos.length >= 3

  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={websiteSchema()} />
      <TickerStrip />
      <HeroSection />
      <CollectionsSection categories={collections.length > 0 ? collections : undefined} />
      <PromoBanners banners={promoBanners} />
      <DealOfTheDay products={deals} />
      <ProductCarousel titlePrefix="New" titleHighlight="Arrivals" label="Just In" products={newArrivals} />
      {showVideos && videos.map(v => {
        const schema = videoObjectSchema(v)
        return schema && <JsonLd key={v.productId} data={schema} />
      })}
      {showVideos && <VideoCarousel items={videos} />}
      <StatsDivider />
      <ProductCarousel titlePrefix="Trending" titleHighlight="Now" label="Most Loved" products={bestsellers} />
      <RoomGrid />
      <ConsultationSection />
      <SocialGrid />
      <GoogleReviewsBanner />
      <NewsletterStrip />
    </>
  )
}
