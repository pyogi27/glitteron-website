'use client'

import Image from 'next/image'
import { useCartStore } from '@/lib/stores/cartStore'
import type { WebsiteCartSummary } from '@/lib/auth/api'
import { serverLineFor } from '@/lib/pricing'

function formatPrice(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

export interface CouponProps {
  input: string
  onInput: (value: string) => void
  onApply: () => void
  onRemove: () => void
  /** The code the current totals include, or null. */
  applied: string | null
  error: string | null
  loading: boolean
}

interface Props {
  loading: boolean
  loadingLabel: string
  onPay: () => void
  error: string | null
  /** Totals as checkout will charge them, priced for the pincode being entered. */
  serverCart: WebsiteCartSummary | null
  cartLoading: boolean
  shippingAvailable: boolean
  /** The totals couldn't be refreshed with the coupon applied; Pay is blocked until retried. */
  pricingFailed: boolean
  onRetryPricing: () => void
  coupon: CouponProps
}

const Dash = () => <span className="text-[#EDE8E0]/40">—</span>

export default function OrderSummary({
  loading,
  loadingLabel,
  onPay,
  error,
  serverCart,
  cartLoading,
  shippingAvailable,
  pricingFailed,
  onRetryPricing,
  coupon,
}: Props) {
  const localItems = useCartStore(s => s.items)
  const serverItems = serverCart?.items ?? []

  // Server values when available; the local fallback has no shipping and no discounts.
  const localSubtotal = localItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const listSubtotal = serverCart?.listSubtotal ?? serverCart?.subtotal ?? localSubtotal
  const subtotal = serverCart?.subtotal ?? localSubtotal
  const gstRate = serverCart?.gstRate ?? 18
  const gstAmount = serverCart?.gstAmount ?? Math.round(subtotal * 0.18)
  const shipping = serverCart?.courierCharges ?? 0
  const shippingWaived = (serverCart?.courierWaived ?? 0) > 0
  const total = serverCart?.finalTotal ?? subtotal + gstAmount + shipping
  const lineDiscounts = (serverCart?.appliedDiscounts ?? []).filter(d => d.type === 'percentage' && d.amount > 0)

  return (
    <aside className="h-fit bg-[#2C2825] text-[#EDE8E0] rounded-[24px] p-5 md:p-7">
      <h3 className="font-serif text-[28px] leading-[1] mb-5">Order Summary</h3>

      {/* Items — names/images from the local cart, prices from the server when it has them */}
      <div className="space-y-3 mb-5">
        {localItems.map(item => {
          const line = serverLineFor(item, serverItems)
          const lineTotal = line?.lineTotal ?? item.price * item.quantity
          const listTotal = line ? line.livePrice * line.quantity : lineTotal
          return (
            <div key={`${item.productId}-${item.size}-${item.finish}`} className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white truncate">{item.name}</p>
                <p className="text-[11px] text-[#EDE8E0]/60">
                  {item.size} · {item.finish} · qty {item.quantity}
                  {line?.discountLabel && <span className="ml-1.5 text-[#C9A84C]">{line.discountLabel}</span>}
                </p>
              </div>
              <span className="text-[13px] text-white flex-shrink-0 text-right">
                {lineTotal < listTotal && (
                  <span className="block text-[11px] text-[#EDE8E0]/45 line-through">{formatPrice(listTotal)}</span>
                )}
                {formatPrice(lineTotal)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Coupon */}
      <div className="mb-5">
        {coupon.applied ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#C9A84C]/40 bg-[#C9A84C]/10 px-3 py-2.5">
            <p className="text-[12px] text-[#EDE8E0]">
              Code <span className="font-semibold tracking-[0.06em] text-[#E8C76A]">{coupon.applied}</span> applied
            </p>
            <button
              type="button"
              onClick={coupon.onRemove}
              disabled={loading}
              className="text-[11px] uppercase tracking-[0.08em] text-[#EDE8E0]/70 hover:text-white disabled:opacity-45"
            >
              Remove
            </button>
          </div>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={e => { e.preventDefault(); coupon.onApply() }}
          >
            <label htmlFor="coupon-code" className="sr-only">Coupon code</label>
            <input
              id="coupon-code"
              value={coupon.input}
              onChange={e => coupon.onInput(e.target.value.toUpperCase())}
              placeholder="Coupon code"
              autoComplete="off"
              maxLength={30}
              aria-invalid={coupon.error ? true : undefined}
              aria-describedby={coupon.error ? 'coupon-error' : undefined}
              className="flex-1 min-w-0 rounded-xl bg-white/[0.08] border border-white/15 px-3 py-2.5 text-[13px] tracking-[0.06em] text-white placeholder:text-[#EDE8E0]/40 placeholder:tracking-normal focus:outline-none focus:border-[#C9A84C]"
            />
            <button
              type="submit"
              disabled={coupon.loading || loading || !coupon.input.trim()}
              className="rounded-xl border border-[#C9A84C]/60 px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#E8C76A] transition-colors hover:bg-[#C9A84C]/15 disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {coupon.loading ? 'Checking…' : 'Apply'}
            </button>
          </form>
        )}
        {coupon.error && (
          <p id="coupon-error" role="alert" className="mt-2 text-[11.5px] text-red-300">{coupon.error}</p>
        )}
      </div>

      <div className="h-px bg-white/15 mb-4" />

      {/* Totals */}
      <div className="space-y-2 text-[13px] mb-6">
        <div className="flex justify-between text-[#EDE8E0]/80">
          <span>Subtotal</span>
          <span>{cartLoading ? <Dash /> : formatPrice(listSubtotal)}</span>
        </div>
        {!cartLoading && lineDiscounts.map(d => (
          <div key={d.id} className="flex justify-between text-[#C9A84C]">
            <span>{d.code ? `Coupon ${d.code}` : d.name}</span>
            <span>−{formatPrice(d.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between text-[#EDE8E0]/80">
          <span>Shipping</span>
          <span>
            {cartLoading ? (
              <span className="text-[#EDE8E0]/40 text-[11px]">Calculating…</span>
            ) : !shippingAvailable ? (
              <span className="text-[#EDE8E0]/60 text-[11px]">Calculated at delivery</span>
            ) : shipping === 0 ? (
              <span className="text-[#C9A84C]">
                {shippingWaived && (
                  <span className="mr-1.5 text-[11px] text-[#EDE8E0]/45 line-through">
                    {formatPrice(serverCart?.courierWaived ?? 0)}
                  </span>
                )}
                Free
              </span>
            ) : (
              formatPrice(shipping)
            )}
          </span>
        </div>
        <div className="flex justify-between text-[#EDE8E0]/80">
          <span>GST ({gstRate}%)</span>
          <span>{cartLoading ? <Dash /> : formatPrice(gstAmount)}</span>
        </div>
        <div className="h-px bg-white/15" />
        <div className="flex justify-between text-[16px] font-medium text-white">
          <span>Total</span>
          <span>{cartLoading ? <span className="text-[#EDE8E0]/60">—</span> : formatPrice(total)}</span>
        </div>
      </div>

      {pricingFailed && (
        <div role="alert" className="mb-4 flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-900/30 border border-amber-700/40 text-[12px] text-amber-200">
          <span>We couldn&apos;t update your total. Please retry before paying.</span>
          <button type="button" onClick={onRetryPricing} className="shrink-0 uppercase tracking-[0.08em] text-[11px] text-white hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div role="alert" className="mb-4 p-3 rounded-xl bg-red-900/30 border border-red-700/40 text-[12px] text-red-300">
          {error}
        </div>
      )}

      {/* Pay button */}
      <button
        type="button"
        onClick={onPay}
        disabled={loading || localItems.length === 0 || cartLoading || coupon.loading || pricingFailed}
        className="w-full bg-[#C9A84C] text-[#2C2825] border-none py-3.5 rounded-3xl text-[13px] font-semibold uppercase tracking-[0.08em] transition-all duration-300 hover:bg-[#E8C76A] hover:-translate-y-0.5 disabled:opacity-45 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
      >
        {loading ? loadingLabel : 'Pay Now'}
      </button>

      <p className="mt-3 text-center text-[11px] text-[#EDE8E0]/40">Secured by Razorpay</p>
    </aside>
  )
}
