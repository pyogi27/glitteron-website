'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/authStore'
import { getWebsiteOrders, type WebsiteOrder, type WebsiteOrderPagination } from '@/lib/auth/api'

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
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] ${styles[status]}`}>
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
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.08em] ${styles[status]}`}>
      {status}
    </span>
  )
}

export default function OrderListClient() {
  const router = useRouter()
  const pathname = usePathname()
  const [orders, setOrders] = useState<WebsiteOrder[]>([])
  const [pagination, setPagination] = useState<WebsiteOrderPagination | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

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
    setLoading(true)
    setError(null)
    getWebsiteOrders(page, 10)
      .then(res => {
        setOrders(res.orders)
        setPagination(res.pagination)
      })
      .catch((err: { message?: string }) => setError(err.message ?? 'Failed to load orders'))
      .finally(() => setLoading(false))
  }, [authChecked, page])

  if (!authChecked || loading) {
    return (
      <div className="pt-[72px] bg-[#EDE8E0] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="pt-[72px] bg-white border-b border-[#D8D0C4]">
        <div className="px-4 md:px-12 py-3.5 flex items-center gap-2 text-[11.5px] text-[#A09488]">
          <Link href="/" className="hover:text-[#8B5E3C] transition-colors">Home</Link>
          <span className="opacity-45">›</span>
          <span className="text-[#2C2825] font-normal">My Orders</span>
        </div>
      </div>

      <section className="bg-[#EDE8E0] min-h-[calc(100vh-72px)] px-4 md:px-12 py-8 md:py-12">
        <div className="max-w-[1320px] mx-auto">
          <h1 className="font-serif text-[clamp(32px,3.5vw,52px)] leading-[1.05] text-[#2C2825] mb-8">My Orders</h1>

          {error && (
            <div className="p-4 rounded-2xl bg-red-600/10 border border-red-600/20 text-red-700 text-[13px] mb-6">{error}</div>
          )}

          {orders.length === 0 && !error ? (
            <div className="bg-white rounded-[24px] border border-[#D8D0C4] p-10 text-center">
              <p className="font-serif text-[28px] text-[#2C2825] mb-3">No orders yet</p>
              <p className="text-[13px] text-[#A09488] mb-6">Your order history will appear here once you place an order.</p>
              <Link
                href="/collections"
                className="inline-flex items-center justify-center bg-[#2C2825] text-white no-underline px-6 py-3 rounded-3xl text-[12px] font-medium uppercase tracking-[0.08em] transition-all hover:bg-[#8B5E3C] hover:-translate-y-0.5"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] border border-[#D8D0C4] overflow-hidden">
              {/* Table header — desktop only */}
              <div className="hidden md:grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-[#D8D0C4] bg-[#FAF7F2]">
                {['Order', 'Date', 'Items', 'Total', 'Status', 'Payment'].map(h => (
                  <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A09488]">{h}</span>
                ))}
              </div>

              {orders.map((order, i) => (
                <div
                  key={order.id}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className={`grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-2 md:gap-4 px-6 py-4 cursor-pointer transition-colors hover:bg-[#FAF7F2] ${i > 0 ? 'border-t border-[#D8D0C4]' : ''}`}
                >
                  <div className="font-medium text-[14px] text-[#2C2825]">#{order.id}</div>
                  <div className="text-[13px] text-[#A09488]">{formatDate(order.createdAt)}</div>
                  <div className="text-[13px] text-[#A09488]">{order.OrderItems.length} item{order.OrderItems.length !== 1 ? 's' : ''}</div>
                  <div className="text-[13px] font-medium text-[#2C2825]">{formatPrice(order.finalTotal)}</div>
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.payment.status} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-5 py-2 rounded-full border border-[#D8D0C4] text-[12px] uppercase tracking-[0.08em] text-[#A09488] hover:text-[#2C2825] hover:border-[#2C2825] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-[12px] text-[#A09488]">Page {page} of {pagination.totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-5 py-2 rounded-full border border-[#D8D0C4] text-[12px] uppercase tracking-[0.08em] text-[#A09488] hover:text-[#2C2825] hover:border-[#2C2825] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
