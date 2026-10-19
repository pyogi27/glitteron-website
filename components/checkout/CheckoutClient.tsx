'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useCartStore } from '@/lib/stores/cartStore'
import {
  createCheckout,
  verifyPayment,
  getWebsiteCart,
  getShippingRate,
  validateCoupon,
  type WebsiteCartSummary,
} from '@/lib/auth/api'
import { syncCartToServer, toSyncable } from '@/lib/api/cartSync'
import { loadRazorpayScript, openRazorpayModal } from '@/lib/razorpay'
import AddressForm, { type AddressFormData } from './AddressForm'
import OrderSummary from './OrderSummary'

type LoadingState = 'syncing' | 'creating_order' | 'verifying' | null

const LOADING_LABELS: Record<NonNullable<LoadingState>, string> = {
  syncing: 'Syncing cart…',
  creating_order: 'Creating order…',
  verifying: 'Verifying payment…',
}

const EMPTY_ADDRESS: AddressFormData = {
  fullName: '',
  phone: '',
  addressLine1: '',
  city: '',
  state: '',
  zipCode: '',
}

export default function CheckoutClient() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { items, clearCart } = useCartStore()

  const [address, setAddress] = useState<AddressFormData>(EMPTY_ADDRESS)
  const [loading, setLoading] = useState<LoadingState>(null)
  const [error, setError] = useState<string | null>(null)
  const authChecked = useRequireAuth()

  // Server cart totals (live prices, discounts, GST, shipping for the pincode typed below)
  const [serverCart, setServerCart] = useState<WebsiteCartSummary | null>(null)
  const [cartLoading, setCartLoading] = useState(false)
  const [shippingAvailable, setShippingAvailable] = useState(true)

  // Coupon: `appliedCoupon` is the code the totals include. The server re-checks it at Pay.
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  // A refresh failed while a coupon is applied (e.g. 429): keep the last good totals and
  // block Pay until a retry succeeds, rather than showing totals without the discount.
  const [pricingFailed, setPricingFailed] = useState(false)
  const [pricingNonce, setPricingNonce] = useState(0)
  // What the totals on screen were priced for. Every validate counts toward the backend's
  // coupon rate limit (10/min), so never re-price something already priced (e.g. by Apply).
  const pricedKeyRef = useRef<string | null>(null)
  // Clears the "creating order" spinner if Razorpay's timeout closes the modal.
  const spinnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)


  // Pre-fill address from user profile
  useEffect(() => {
    if (user) {
      setAddress({
        fullName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
        phone: user.phone ?? '',
        addressLine1: user.address ?? '',
        city: user.city ?? '',
        state: user.state ?? '',
        zipCode: user.zipCode ?? '',
      })
    }
  }, [user])

  // Redirect to cart if empty
  useEffect(() => {
    if (authChecked && items.length === 0) {
      router.replace('/cart')
    }
  }, [authChecked, items.length, router])

  const typedPincode = /^\d{6}$/.test(address.zipCode.trim()) ? address.zipCode.trim() : undefined
  const cartKey = items.map(i => `${i.apiProductId ?? i.productId}:${i.productVariationId ?? ''}:${i.quantity}`).join('|')
  const pricingKeyFor = (coupon: string | null) => `${cartKey}#${typedPincode ?? ''}#${coupon ?? ''}`
  const pricingKey = pricingKeyFor(appliedCoupon)

  // Price the cart as checkout will charge it: synced to the server, for the pincode being
  // typed (free-shipping discounts depend on it), with the applied coupon. Debounced so
  // typing a pincode doesn't fire a request per keystroke.
  useEffect(() => {
    if (!authChecked || items.length === 0) return
    if (pricedKeyRef.current === pricingKey) return
    let cancelled = false
    setCartLoading(true)
    const timer = setTimeout(async () => {
      try {
        await syncCartToServer(items)
      } catch {
        if (cancelled) return
        if (appliedCoupon) setPricingFailed(true)
        else setServerCart(null) // fall back to the local estimate
        setCartLoading(false)
        return
      }
      try {
        const [summary, rate] = await Promise.all([
          appliedCoupon ? validateCoupon(appliedCoupon, typedPincode) : getWebsiteCart(typedPincode),
          typedPincode ? getShippingRate(typedPincode).catch(() => null) : Promise.resolve(null),
        ])
        if (cancelled) return
        pricedKeyRef.current = pricingKey
        setServerCart(summary)
        setShippingAvailable(rate ? rate.available : true)
        setPricingFailed(false)
      } catch (err: unknown) {
        if (cancelled) return
        const apiErr = err as { status?: number; message?: string }
        if (appliedCoupon && apiErr.status === 400) {
          // The code stopped applying (cart changed, expired, used up): drop it, which
          // re-runs this effect and prices the cart without it.
          setAppliedCoupon(null)
          setCouponError(apiErr.message ?? "This code can't be applied to your cart")
        } else if (appliedCoupon) {
          setPricingFailed(true) // e.g. 429: keep the last totals, block Pay until Retry
        } else {
          setServerCart(null) // fall back to the local estimate
        }
      } finally {
        if (!cancelled) setCartLoading(false)
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  // pricingKey covers items/typedPincode/appliedCoupon; pricingNonce forces a retry.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, pricingKey, pricingNonce])

  const retryPricing = useCallback(() => {
    pricedKeyRef.current = null
    setPricingNonce(n => n + 1)
  }, [])

  const applyCoupon = useCallback(async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setCouponLoading(true)
    setCouponError(null)
    try {
      await syncCartToServer(items)
      const summary = await validateCoupon(code, typedPincode)
      const applied = summary.couponCode ?? code
      // Mark these totals as priced, so the effect doesn't validate the same thing again.
      pricedKeyRef.current = pricingKeyFor(applied)
      setServerCart(summary)
      setPricingFailed(false)
      setAppliedCoupon(applied)
    } catch (err: unknown) {
      setCouponError((err as { message?: string }).message ?? "This code can't be applied to your cart")
    } finally {
      setCouponLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponInput, items, typedPincode, cartKey])

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponError(null)
    setPricingFailed(false)
  }, [])

  const clearSpinnerTimer = () => {
    if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current)
    spinnerTimerRef.current = null
  }

  const handlePay = useCallback(async () => {
    // Validate address
    const fields: [keyof AddressFormData, string][] = [
      ['fullName', 'Full Name'],
      ['phone', 'Phone'],
      ['addressLine1', 'Address Line'],
      ['city', 'City'],
      ['state', 'State'],
      ['zipCode', 'Pincode'],
    ]
    for (const [key, label] of fields) {
      if (!address[key]?.trim()) {
        setError(`Please fill in ${label}`)
        return
      }
    }
    setError(null)
    clearSpinnerTimer() // a previous attempt's timer must not clear this attempt's spinner

    try {
      // Step 1: Sync local cart → server cart (clear first to remove stale items)
      setLoading('syncing')

      const syncable = toSyncable(items)

      if (syncable.length === 0) {
        setError('Cart items could not be synced. Please try re-adding items to cart.')
        setLoading(null)
        return
      }

      // Reconcile rather than clear-then-re-add. On this path a failed sync must block
      // before the Razorpay modal opens — the surrounding try already does that, and
      // syncCartToServer throws rather than swallowing.
      await syncCartToServer(items)

      // Step 2: Create Razorpay order
      setLoading('creating_order')
      const checkout = await createCheckout({
        addressLine1: address.addressLine1,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
      }, appliedCoupon)

      // Step 3: Load Razorpay script
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        setError('Payment gateway unavailable. Please try again.')
        setLoading(null)
        return
      }

      // Razorpay can't expire an order server-side, so close Checkout when the
      // server's reservation ends. A payment after that (or on an order replaced
      // by a newer checkout) is refunded by the server, never fulfilled.
      const secondsLeft = checkout.reservedUntil
        ? Math.floor((new Date(checkout.reservedUntil).getTime() - Date.now()) / 1000)
        : 0
      if (secondsLeft > 0) {
        // ondismiss is documented for a user close only; clear the spinner if the
        // timeout closes the modal instead. Never interrupts an in-flight verify.
        spinnerTimerRef.current = setTimeout(() => setLoading(l => (l === 'creating_order' ? null : l)), secondsLeft * 1000)
      }

      // Step 4: Open Razorpay modal
      const rzp = openRazorpayModal({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: Math.round(checkout.amount * 100),
        currency: checkout.currency,
        name: 'LitMeUp',
        description: 'Order Payment',
        order_id: checkout.razorpayOrderId,
        ...(secondsLeft > 0 ? { timeout: secondsLeft } : {}),
        prefill: {
          name: address.fullName,
          contact: address.phone,
          email: user?.email ?? '',
        },
        theme: { color: '#C9A84C' },
        handler: async (response) => {
          clearSpinnerTimer()
          setLoading('verifying')
          try {
            const result = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            clearCart()
            router.push(`/orders/${result.salesOrderId}?success=true`)
          } catch (err: unknown) {
            const apiErr = err as { status?: number; message?: string }
            if (apiErr.status === 502) {
              setError(
                `Your payment was received (ID: ${response.razorpay_payment_id}). Please contact support with this ID.`
              )
            } else {
              setError(apiErr.message ?? 'Payment verification failed. Please contact support.')
            }
            setLoading(null)
          }
        },
        modal: {
          ondismiss: () => {
            clearSpinnerTimer()
            setLoading(null)
          },
        },
      })

      rzp.on('payment.failed', (res: unknown) => {
        const r = res as { error?: { description?: string } }
        setError(r.error?.description ?? 'Payment failed. Please try again.')
        setLoading(null)
      })

    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string }
      const msg = apiErr.message ?? ''
      if (apiErr.status === 409) {
        // The coupon stopped applying after the preview. Re-price without it rather than
        // charging a total the shopper never saw.
        setAppliedCoupon(null)
        setCouponError(msg || "This code can't be applied to your cart")
        setError('Your total changed because the coupon no longer applies. Please review it and press Pay again.')
      } else if (msg.toLowerCase().includes('no longer available')) {
        setError(msg)
      } else if (msg.toLowerCase().includes('empty')) {
        router.replace('/cart')
      } else {
        setError(msg || 'Something went wrong. Please try again.')
      }
      setLoading(null)
    }
  }, [address, items, user, clearCart, router, appliedCoupon])

  // Loading skeleton while waiting for auth check
  if (!authChecked) {
    return (
      <div className="pt-header bg-[#EDE8E0] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="pt-header bg-white border-b border-[#D8D0C4]">
        <div className="px-4 md:px-12 py-3.5 flex items-center gap-2 text-[11.5px] text-[#A09488]">
          <Link href="/" className="hover:text-[#8B5E3C] transition-colors">Home</Link>
          <span className="opacity-45">›</span>
          <Link href="/cart" className="hover:text-[#8B5E3C] transition-colors">Cart</Link>
          <span className="opacity-45">›</span>
          <span className="text-[#2C2825] font-normal">Checkout</span>
        </div>
      </div>

      <section className="bg-[#EDE8E0] min-h-[calc(100vh-var(--spacing-header))] px-4 md:px-12 py-8 md:py-12">
        <div className="max-w-[1320px] mx-auto">
          <h1 className="font-serif text-[clamp(32px,3.5vw,52px)] leading-[1.05] text-[#2C2825] mb-8">Checkout</h1>
          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_0.95fr] gap-6 md:gap-8">
            <AddressForm
              value={address}
              onChange={setAddress}
              disabled={loading !== null}
            />
            <OrderSummary
              loading={loading !== null}
              loadingLabel={loading ? LOADING_LABELS[loading] : ''}
              onPay={handlePay}
              error={error}
              serverCart={serverCart}
              cartLoading={cartLoading}
              shippingAvailable={shippingAvailable}
              pricingFailed={pricingFailed}
              onRetryPricing={retryPricing}
              coupon={{
                input: couponInput,
                onInput: setCouponInput,
                onApply: applyCoupon,
                onRemove: removeCoupon,
                applied: appliedCoupon,
                error: couponError,
                // Apply waits for the cart sync in flight: two syncs at once double quantities.
                loading: couponLoading || cartLoading,
              }}
            />
          </div>
        </div>
      </section>
    </>
  )
}
