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
import { fetchCategories, fetchFeaturedProducts } from '@/lib/api/server'

export default async function HomePage() {
  const [apiCategories, featured] = await Promise.all([
    fetchCategories(),
    fetchFeaturedProducts(20),
  ])

  return (
    <>
      <HeroSection />
      <TickerStrip />
      <CollectionsSection categories={apiCategories.length > 0 ? apiCategories : undefined} />
      <ProductCarousel titlePrefix="New" titleHighlight="Arrivals" label="Just In" products={featured.slice(0, 6)} />
      <StatsDivider />
      <ProductCarousel titlePrefix="Bestselling" titleHighlight="Lights" label="Most Loved" products={featured} />
      <RoomGrid />
      <ShuffleDeck products={featured} />
      <SocialGrid />
      <ReviewsSection />
      <NewsletterStrip />
    </>
  )
}
