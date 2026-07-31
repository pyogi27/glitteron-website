import type { Metadata } from 'next'
import { Suspense } from 'react'
import OrderDetailClient from '@/components/orders/OrderDetailClient'

export const metadata: Metadata = {
  title: 'Order Detail — LitMeUp',
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="pt-[72px] bg-[#EDE8E0] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
      </div>
    }>
      <OrderDetailClient />
    </Suspense>
  )
}
