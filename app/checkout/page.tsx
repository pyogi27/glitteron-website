import type { Metadata } from 'next'
import CheckoutClient from '@/components/checkout/CheckoutClient'

export const metadata: Metadata = {
  title: 'Checkout — LitmeUp',
  description: 'Complete your order securely.',
}

export default function CheckoutPage() {
  return <CheckoutClient />
}
