import type { Metadata } from 'next'
import OrderListClient from '@/components/orders/OrderListClient'

export const metadata: Metadata = {
  title: 'My Orders — LitMeUp',
  description: 'View your order history.',
}

export default function OrdersPage() {
  return <OrderListClient />
}
