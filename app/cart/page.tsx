import type { Metadata } from 'next'
import CartPageClient from '@/components/cart/CartPageClient'

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Review your selections and proceed to checkout.',
  robots: { index: false, follow: true },
}

export default function CartPage() {
  return <CartPageClient />
}
