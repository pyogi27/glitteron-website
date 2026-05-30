import type { Metadata } from 'next'
import CartPageClient from '@/components/cart/CartPageClient'

export const metadata: Metadata = {
  title: 'Cart — LitmeUp',
  description: 'Review your selections and proceed to checkout.',
}

export default function CartPage() {
  return <CartPageClient />
}
