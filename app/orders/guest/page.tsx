import type { Metadata } from 'next'
import GuestOrderClient from '@/components/orders/GuestOrderClient'

// The token rides in the URL fragment: never indexed, never sent on in a Referer.
export const metadata: Metadata = {
  title: 'Your Order',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default function GuestOrderPage() {
  return <GuestOrderClient />
}
