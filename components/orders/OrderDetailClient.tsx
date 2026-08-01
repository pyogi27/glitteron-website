'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams, usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/authStore'
import { getWebsiteOrder, type WebsiteOrder } from '@/lib/auth/api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatPrice(str: string) {
  const n = parseFloat(str)
  return `₹${n.toLocaleString('en-IN')}`
}

function OrderStatusBadge({ status }: { status: WebsiteOrder['status'] }) {
  const styles = {
    approved: 'bg-green-600/10 text-green-700',
    pending: 'bg-yellow-500/10 text-yellow-700',
    declined: 'bg-red-600/10 text-red-700',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] ${styles[status]}`}>
      {status}
    </span>
  )
}

function PaymentStatusBadge({ status }: { status: WebsiteOrder['payment']['status'] }) {
  const styles = {
    PAID: 'bg-green-600/10 text-green-700',
    PENDING: 'bg-yellow-500/10 text-yellow-700',
    FAILED: 'bg-red-600/10 text-red-700',
    REFUNDED: 'bg-gray-500/10 text-gray-600',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] ${styles[status]}`}>
      {status}
    </span>
  )
}

export default function OrderDetailClient() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'

  const [order, setOrder] = useState<WebsiteOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [showSuccessBanner, setShowSuccessBanner] = useState(isSuccess)

  // Auth gate
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!useAuthStore.getState().accessToken) {
        router.replace(`/login?return=${pathname}`)
      } else {
        setAuthChecked(true)
      }
    }, 600)
    return () => clearTimeout(timeout)
  }, [router, pathname])

  useEffect(() => {
    if (!authChecked) return
    const id = Number(params.id)
    if (!id) { setError('Invalid order ID'); setLoading(false); return }
    getWebsiteOrder(id)
      .then(res => setOrder(res.order))
      .catch((err: { message?: string }) => setError(err.message ?? 'Order not found'))
      .finally(() => setLoading(false))
  }, [authChecked, params.id])

  if (!authChecked || loading) {
    return (
      <div className="pt-header bg-[#EDE8E0] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="pt-header bg-[#EDE8E0] min-h-screen px-4 md:px-12 py-12">
        <div className="max-w-[800px] mx-auto text-center">
          <p className="text-[#A09488] text-[14px] mb-4">{error ?? 'Order not found'}</p>
          <Link href="/orders" className="text-[#C9A84C] text-[13px] hover:underline">← Back to orders</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Success banner */}
      {showSuccessBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
          <p className="text-[13px] font-medium">🎉 Payment successful! Your order has been placed.</p>
          <button
            onClick={() => setShowSuccessBanner(false)}
            className="text-white/70 hover:text-white text-[18px] leading-none ml-4"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className={showSuccessBanner ? 'pt-header mt-[48px]' : 'pt-header'}>
        {/* Breadcrumb */}
        <div className="bg-white border-b border-[#D8D0C4]">
          <div className="px-4 md:px-12 py-3.5 flex items-center gap-2 text-[11.5px] text-[#A09488]">
            <Link href="/" className="hover:text-[#8B5E3C] transition-colors">Home</Link>
            <span className="opacity-45">›</span>
            <Link href="/orders" className="hover:text-[#8B5E3C] transition-colors">My Orders</Link>
            <span className="opacity-45">›</span>
            <span className="text-[#2C2825] font-normal">Order #{order.id}</span>
          </div>
        </div>

        <section className="bg-[#EDE8E0] min-h-[calc(100vh-var(--spacing-header))] px-4 md:px-12 py-8 md:py-12">
          <div className="max-w-[900px] mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-[24px] border border-[#D8D0C4] p-5 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-serif text-[clamp(28px,3vw,42px)] leading-[1.1] text-[#2C2825]">Order #{order.id}</h1>
                  <p className="text-[13px] text-[#A09488] mt-1">Placed on {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.payment.status} />
                </div>
              </div>
              {order.customerAddress && (
                <div className="mt-5 pt-5 border-t border-[#D8D0C4]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A09488] mb-1">Shipping Address</p>
                  <p className="text-[14px] text-[#2C2825]">{order.customerAddress}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="bg-white rounded-[24px] border border-[#D8D0C4] overflow-hidden">
              <div className="px-5 md:px-8 py-4 border-b border-[#D8D0C4] bg-[#FAF7F2]">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A09488]">Order Items</h2>
              </div>
              <div className="divide-y divide-[#D8D0C4]">
                {order.OrderItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-5 md:px-8">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#E2DAD0] flex-shrink-0">
                      {(item.product.thumbnailImage || item.product.mainImage) ? (
                        <Image
                          src={(item.product.thumbnailImage || item.product.mainImage)!}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#A09488] text-[10px]">No image</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[#2C2825]">{item.product.name}</p>
                      {item.productVariation && (
                        <p className="text-[12px] text-[#A09488] mt-0.5">{item.productVariation.name}</p>
                      )}
                      <p className="text-[12px] text-[#A09488] mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[12px] text-[#A09488]">{formatPrice(item.price)} each</p>
                      <p className="text-[15px] font-medium text-[#2C2825]">{formatPrice(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-white rounded-[24px] border border-[#D8D0C4] p-5 md:p-8">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A09488] mb-4">Order Total</h2>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between text-[#A09488]">
                  <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
                </div>
                {parseFloat(order.courierCharges ?? '0') > 0 && (
                  <div className="flex justify-between text-[#A09488]">
                    <span>Shipping</span><span>{formatPrice(order.courierCharges!)}</span>
                  </div>
                )}
                {parseFloat(order.gstAmount ?? '0') > 0 && (
                  <div className="flex justify-between text-[#A09488]">
                    <span>GST ({parseFloat(order.gstRate)}%)</span><span>{formatPrice(order.gstAmount!)}</span>
                  </div>
                )}
                <div className="h-px bg-[#D8D0C4]" />
                <div className="flex justify-between text-[16px] font-medium text-[#2C2825]">
                  <span>Total</span><span>{formatPrice(order.finalTotal)}</span>
                </div>
              </div>
            </div>

            {/* Back */}
            <div>
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.08em] text-[#A09488] hover:text-[#2C2825] transition-colors"
              >
                ← Back to orders
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
