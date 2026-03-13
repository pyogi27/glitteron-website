import HeroSection from '@/components/home/HeroSection'
import TickerStrip from '@/components/home/TickerStrip'
import ProductCarousel from '@/components/home/ProductCarousel'
import StatsDivider from '@/components/home/StatsDivider'
import RoomGrid from '@/components/home/RoomGrid'
import ShuffleDeck from '@/components/home/ShuffleDeck'
import SocialGrid from '@/components/home/SocialGrid'
import ReviewsSection from '@/components/home/ReviewsSection'
import NewsletterStrip from '@/components/home/NewsletterStrip'
import { getFeaturedProducts } from '@/lib/data/products'

export default function HomePage() {
  const featured = getFeaturedProducts()
  return (
    <>
      <HeroSection />
      <TickerStrip />
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
