import type { Metadata } from 'next'
import OrderListClient from '@/components/orders/OrderListClient'

export const metadata: Metadata = {
  title: 'My Orders',
  description: 'View your order history.',
  robots: { index: false, follow: false },
}

export default function OrdersPage() {
  return <OrderListClient />
}
