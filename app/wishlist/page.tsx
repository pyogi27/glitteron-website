import type { Metadata } from 'next'
import WishlistPageClient from '@/components/wishlist/WishlistPageClient'

export const metadata: Metadata = {
  title: 'Saved Items',
  description: 'The pieces you have saved for your space.',
  robots: { index: false, follow: true },
}

export default function WishlistPage() {
  return <WishlistPageClient />
}
