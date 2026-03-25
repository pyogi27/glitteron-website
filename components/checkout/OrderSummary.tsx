'use client'

import Image from 'next/image'
import { useCartStore } from '@/lib/stores/cartStore'
import type { WebsiteCartSummary } from '@/lib/auth/api'

function formatPrice(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

interface Props {
  loading: boolean
  loadingLabel: string
  onPay: () => void
  error: string | null
  serverCart: WebsiteCartSummary | null
  cartLoading: boolean
  shippingOverride: number | null   // non-null when user entered a different pincode
  shippingAvailable: boolean
  shippingLoading: boolean
}

export default function OrderSummary({
  loading,
  loadingLabel,
  onPay,
  error,
  serverCart,
  cartLoading,
  shippingOverride,
  shippingAvailable,
  shippingLoading,
}: Props) {
  const localItems = useCartStore(s => s.items)

  // Use server values when available; fall back to local calculation
  const subtotal = serverCart?.subtotal ?? localItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const gstRate = serverCart?.gstRate ?? 18
  const gstAmount = serverCart?.gstAmount ?? Math.round(subtotal * 0.18)
  const baseShipping = serverCart?.courierCharges ?? 0
  const shipping = shippingOverride !== null ? shippingOverride : baseShipping
  const total = subtotal + gstAmount + shipping

  const isLoading = cartLoading || shippingLoading

  return (
    <aside className="h-fit bg-[#2C2825] text-[#EDE8E0] rounded-[24px] p-5 md:p-7">
      <h3 className="font-serif text-[28px] leading-[1] mb-5">Order Summary</h3>

      {/* Items — always from local cart for name/image/variant display */}
      <div className="space-y-3 mb-5">
        {localItems.map(item => (
          <div key={`${item.productId}-${item.size}-${item.finish}`} className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white truncate">{item.name}</p>
              <p className="text-[11px] text-[#EDE8E0]/60">{item.size} · {item.finish} · qty {item.quantity}</p>
            </div>
            <span className="text-[13px] text-white flex-shrink-0">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="h-px bg-white/15 mb-4" />

      {/* Totals */}
      <div className="space-y-2 text-[13px] mb-6">
        <div className="flex justify-between text-[#EDE8E0]/80">
          <span>Subtotal</span>
          <span>{cartLoading ? <span className="text-[#EDE8E0]/40">—</span> : formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[#EDE8E0]/80">
          <span>Shipping</span>
          <span>
            {shippingLoading ? (
              <span className="text-[#EDE8E0]/40 italic text-[11px]">Calculating…</span>
            ) : !shippingAvailable ? (
              <span className="text-[#EDE8E0]/60 text-[11px]">Calculated at delivery</span>
            ) : shipping === 0 ? (
              <span className="text-[#C9A84C]">Free</span>
            ) : (
              formatPrice(shipping)
            )}
          </span>
        </div>
        <div className="flex justify-between text-[#EDE8E0]/80">
          <span>GST ({gstRate}%)</span>
          <span>{cartLoading ? <span className="text-[#EDE8E0]/40">—</span> : formatPrice(gstAmount)}</span>
        </div>
        <div className="h-px bg-white/15" />
        <div className="flex justify-between text-[16px] font-medium text-white">
          <span>Total</span>
          <span>{isLoading ? <span className="text-[#EDE8E0]/60">—</span> : formatPrice(total)}</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-700/40 text-[12px] text-red-300">
          {error}
        </div>
      )}

      {/* Pay button */}
      <button
        type="button"
        onClick={onPay}
        disabled={loading || localItems.length === 0 || isLoading}
        className="w-full bg-[#C9A84C] text-[#2C2825] border-none py-3.5 rounded-3xl text-[13px] font-semibold uppercase tracking-[0.08em] transition-all duration-300 hover:bg-[#E8C76A] hover:-translate-y-0.5 disabled:opacity-45 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
      >
        {loading ? loadingLabel : 'Pay Now'}
      </button>

      <p className="mt-3 text-center text-[11px] text-[#EDE8E0]/40">Secured by Razorpay</p>
    </aside>
  )
}
