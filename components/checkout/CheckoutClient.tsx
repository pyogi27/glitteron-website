'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/authStore'
import { useCartStore } from '@/lib/stores/cartStore'
import {
  clearServerCart,
  addToServerCart,
  createCheckout,
  verifyPayment,
  getWebsiteCart,
  getShippingRate,
  type WebsiteCartSummary,
} from '@/lib/auth/api'
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
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { items, clearCart } = useCartStore()

  const [address, setAddress] = useState<AddressFormData>(EMPTY_ADDRESS)
  const [loading, setLoading] = useState<LoadingState>(null)
  const [error, setError] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Server cart totals (live prices + pre-computed GST/shipping)
  const [serverCart, setServerCart] = useState<WebsiteCartSummary | null>(null)
  const [cartLoading, setCartLoading] = useState(false)

  // Override shipping when user enters a different pincode
  const [shippingOverride, setShippingOverride] = useState<number | null>(null)
  const [shippingAvailable, setShippingAvailable] = useState(true)
  const [shippingLoading, setShippingLoading] = useState(false)

  // Auth gate — wait up to 600ms for SessionRestorer to hydrate the store
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

  // Fetch server cart totals after auth (live prices + pre-computed breakdown)
  useEffect(() => {
    if (!authChecked || items.length === 0) return
    setCartLoading(true)
    getWebsiteCart()
      .then(setServerCart)
      .catch(() => {/* fall back to local calculation */})
      .finally(() => setCartLoading(false))
  }, [authChecked, items.length])

  // Re-fetch server cart totals whenever pincode changes back to profile zip
  // (clears the override so we show server's pre-computed courier charges again)
  useEffect(() => {
    const pincode = address.zipCode.trim()
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) return
    if (pincode === (user?.zipCode ?? '')) {
      setShippingOverride(null)
      return
    }

    setShippingLoading(true)
    const timer = setTimeout(async () => {
      try {
        const result = await getShippingRate(pincode)
        setShippingOverride(result.courierCharges)
        setShippingAvailable(result.available)
      } catch {
        // silently keep previous value on error
      } finally {
        setShippingLoading(false)
      }
    }, 600)

    return () => {
      clearTimeout(timer)
      setShippingLoading(false)
    }
  }, [address.zipCode, user?.zipCode])

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

    try {
      // Step 1: Sync local cart → server cart (clear first to remove stale items)
      setLoading('syncing')

      const syncable = items
        .map(i => ({ ...i, resolvedId: i.apiProductId ?? (parseInt(i.productId) || undefined) }))
        .filter(i => i.resolvedId != null)

      if (syncable.length === 0) {
        setError('Cart items could not be synced. Please try re-adding items to cart.')
        setLoading(null)
        return
      }

      await clearServerCart()
      for (const item of syncable) {
        await addToServerCart(item.resolvedId!, null, item.quantity)
      }

      // Step 2: Create Razorpay order
      setLoading('creating_order')
      const checkout = await createCheckout({
        addressLine1: address.addressLine1,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
      })

      // Step 3: Load Razorpay script
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        setError('Payment gateway unavailable. Please try again.')
        setLoading(null)
        return
      }

      // Step 4: Open Razorpay modal
      const rzp = openRazorpayModal({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: Math.round(checkout.amount * 100),
        currency: checkout.currency,
        name: 'GlitterOn',
        description: 'Order Payment',
        order_id: checkout.razorpayOrderId,
        prefill: {
          name: address.fullName,
          contact: address.phone,
          email: user?.email ?? '',
        },
        theme: { color: '#C9A84C' },
        handler: async (response) => {
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
          ondismiss: () => setLoading(null),
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
      if (msg.toLowerCase().includes('no longer available')) {
        setError(msg)
      } else if (msg.toLowerCase().includes('empty')) {
        router.replace('/cart')
      } else {
        setError(msg || 'Something went wrong. Please try again.')
      }
      setLoading(null)
    }
  }, [address, items, user, clearCart, router])

  // Loading skeleton while waiting for auth check
  if (!authChecked) {
    return (
      <div className="pt-[72px] bg-[#EDE8E0] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="pt-[72px] bg-white border-b border-[#D8D0C4]">
        <div className="px-4 md:px-12 py-3.5 flex items-center gap-2 text-[11.5px] text-[#A09488]">
          <Link href="/" className="hover:text-[#8B5E3C] transition-colors">Home</Link>
          <span className="opacity-45">›</span>
          <Link href="/cart" className="hover:text-[#8B5E3C] transition-colors">Cart</Link>
          <span className="opacity-45">›</span>
          <span className="text-[#2C2825] font-normal">Checkout</span>
        </div>
      </div>

      <section className="bg-[#EDE8E0] min-h-[calc(100vh-72px)] px-4 md:px-12 py-8 md:py-12">
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
              shippingOverride={shippingOverride}
              shippingAvailable={shippingAvailable}
              shippingLoading={shippingLoading}
            />
          </div>
        </div>
      </section>
    </>
  )
}
