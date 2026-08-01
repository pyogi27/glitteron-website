'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import QuantityControl from '@/components/product/QuantityControl'
import { useCartStore } from '@/lib/stores/cartStore'
import { useAuthStore } from '@/lib/stores/authStore'
import {
  clearServerCart,
  addToServerCart,
  getWebsiteCart,
  type WebsiteCartSummary,
} from '@/lib/auth/api'

const SHIPPING_THRESHOLD = 15000

function formatPrice(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

export default function CartPageClient() {
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQty = useCartStore((s) => s.updateQty)
  const clearCart = useCartStore((s) => s.clearCart)
  const router = useRouter()
  const { accessToken } = useAuthStore()

  const [serverCart, setServerCart] = useState<WebsiteCartSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  // Sync local cart → server, then fetch live totals.
  // Debounced so rapid quantity changes don't flood the API.
  useEffect(() => {
    if (!accessToken || items.length === 0) {
      setServerCart(null)
      return
    }

    const syncable = items
      .map(i => ({ ...i, resolvedId: i.apiProductId ?? (parseInt(i.productId) || undefined) }))
      .filter(i => i.resolvedId != null)

    if (syncable.length === 0) return

    setSummaryLoading(true)

    const timer = setTimeout(async () => {
      try {
        await clearServerCart()
        for (const item of syncable) {
          await addToServerCart(item.resolvedId!, null, item.quantity)
        }
        const data = await getWebsiteCart()
        setServerCart(data)
      } catch {
        // silently fall back to local calculation
      } finally {
        setSummaryLoading(false)
      }
    }, 500)

    return () => {
      clearTimeout(timer)
      setSummaryLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, items])

  // Totals — server values when available, local fallback otherwise
  const localSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const hasServer = serverCart !== null && serverCart.items.length > 0

  const subtotal = hasServer ? serverCart.subtotal : localSubtotal
  const gstRate = hasServer ? serverCart.gstRate : 18
  const gstAmount = hasServer ? serverCart.gstAmount : Math.round(localSubtotal * 0.18)
  const courierCharges = hasServer ? serverCart.courierCharges : 0
  const finalTotal = hasServer ? serverCart.finalTotal : localSubtotal + gstAmount + courierCharges

  const progress = Math.min(100, (localSubtotal / SHIPPING_THRESHOLD) * 100)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
      <div className="pt-header bg-white border-b border-[#D8D0C4]">
        <div className="px-4 md:px-12 py-3.5 flex items-center gap-2 text-[11.5px] text-[#A09488]">
          <Link href="/" className="hover:text-[#8B5E3C] transition-colors">Home</Link>
          <span className="opacity-45">›</span>
          <span className="text-[#2C2825] font-normal">Cart</span>
        </div>
      </div>

      <section className="bg-[#EDE8E0] min-h-[calc(100vh-var(--spacing-header))] px-4 md:px-12 py-8 md:py-12">
        <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-[1.6fr_0.95fr] gap-6 md:gap-8">
          <div className="bg-white rounded-[24px] border border-[#D8D0C4] p-5 md:p-8">
            <div className="flex items-center justify-between gap-3 mb-6 md:mb-7">
              <div>
                <h1 className="font-serif text-[clamp(30px,3.2vw,44px)] leading-[1.05] text-[#2C2825]">Your Cart</h1>
                <p className="text-[12px] md:text-[13px] text-[#A09488] mt-1">
                  {totalItems} item{totalItems === 1 ? '' : 's'} selected for your space
                </p>
              </div>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] md:text-[12px] uppercase tracking-[0.09em] text-[#8B5E3C] hover:text-[#2C2825] transition-colors"
                >
                  Clear cart
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-[#D8D0C4] bg-[#F4EFE8] p-8 md:p-10 text-center">
                <p className="font-serif text-[28px] leading-[1.1] text-[#2C2825] mb-3">Your cart is waiting to glow</p>
                <p className="text-[13px] text-[#A09488] mb-6">Browse handcrafted lighting and add your favorites.</p>
                <Link
                  href="/collections"
                  className="inline-flex items-center justify-center bg-[#2C2825] text-white no-underline px-6 py-3 rounded-3xl text-[12px] font-medium uppercase tracking-[0.08em] transition-all duration-300 hover:bg-[#8B5E3C] hover:-translate-y-0.5"
                >
                  Explore collections
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <article
                    key={`${item.productId}-${item.size}-${item.finish}`}
                    className="rounded-[18px] border border-[#D8D0C4] bg-[#FAF7F2] p-4 md:p-5"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                      <div className="relative w-full sm:w-[142px] h-[180px] sm:h-[142px] rounded-[14px] overflow-hidden bg-[#E2DAD0]">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 142px"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="font-serif text-[24px] leading-[1.1] text-[#2C2825]">{item.name}</h2>
                            <div className="mt-1 text-[12px] text-[#A09488]">
                              Size: <span className="text-[#2C2825]">{item.size || 'Standard'}</span>
                              <span className="mx-2 opacity-40">•</span>
                              Finish: <span className="text-[#2C2825]">{item.finish || 'Classic'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] uppercase tracking-[0.08em] text-[#A09488]">Unit price</div>
                            <div className="text-[17px] font-medium text-[#2C2825]">{formatPrice(item.price)}</div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <QuantityControl
                            value={item.quantity}
                            max={99}
                            onChange={(qty) => updateQty({ productId: item.productId, size: item.size, finish: item.finish }, qty)}
                          />

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-[10px] uppercase tracking-[0.08em] text-[#A09488]">Line total</div>
                              <div className="text-[19px] font-medium text-[#2C2825]">{formatPrice(item.price * item.quantity)}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem({ productId: item.productId, size: item.size, finish: item.finish })}
                              className="h-10 px-4 rounded-full border border-[#D8D0C4] text-[11px] uppercase tracking-[0.08em] text-[#A09488] hover:text-[#2C2825] hover:border-[#C4714A] hover:bg-[#E2DAD0] transition-all"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="h-fit bg-[#2C2825] text-[#EDE8E0] rounded-[24px] p-5 md:p-7">
            <h3 className="font-serif text-[34px] leading-[1] mb-6">Summary</h3>

            <div className="space-y-3 text-[13px]">
              <div className="flex items-center justify-between text-[#EDE8E0]/80">
                <span>Subtotal</span>
                <span>
                  {summaryLoading
                    ? <span className="text-[#EDE8E0]/40">—</span>
                    : formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#EDE8E0]/80">
                <span>Shipping</span>
                <span>
                  {summaryLoading
                    ? <span className="text-[#EDE8E0]/40">—</span>
                    : courierCharges === 0
                      ? <span className="text-[#C9A84C]">Free</span>
                      : formatPrice(courierCharges)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#EDE8E0]/80">
                <span>GST ({gstRate}%)</span>
                <span>
                  {summaryLoading
                    ? <span className="text-[#EDE8E0]/40">—</span>
                    : formatPrice(gstAmount)}
                </span>
              </div>
              <div className="h-px bg-white/15 my-1.5" />
              <div className="flex items-center justify-between text-[16px] font-medium text-white">
                <span>Total</span>
                <span>
                  {summaryLoading
                    ? <span className="text-[#EDE8E0]/60">—</span>
                    : formatPrice(finalTotal)}
                </span>
              </div>
            </div>

            {/* Free delivery progress — shown while server totals are loading or user not logged in */}
            {!hasServer && items.length > 0 && (
              <div className="mt-6 rounded-2xl bg-white/6 border border-white/12 p-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#E8A87C] mb-2">
                  Free delivery threshold
                </p>
                <div className="h-2.5 rounded-full bg-white/12 overflow-hidden">
                  <div
                    className="h-full bg-[#C4714A] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {localSubtotal >= SHIPPING_THRESHOLD ? (
                  <p className="text-[12px] text-[#EDE8E0]/80 mt-2">You unlocked free delivery.</p>
                ) : (
                  <p className="text-[12px] text-[#EDE8E0]/80 mt-2">
                    Add {formatPrice(Math.max(0, SHIPPING_THRESHOLD - localSubtotal))} more for free delivery.
                  </p>
                )}
              </div>
            )}

            {/* Shipping note once server totals are loaded */}
            {hasServer && items.length > 0 && (
              <div className="mt-6 rounded-2xl bg-white/6 border border-white/12 p-4">
                <p className="text-[11px] text-[#EDE8E0]/60">
                  {courierCharges === 0
                    ? 'Free shipping applied based on your delivery address.'
                    : 'Shipping calculated based on your saved delivery address. May update at checkout.'}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => router.push('/checkout')}
              className="mt-6 w-full bg-[#C4714A] text-[#2C2825] border-none py-3 rounded-3xl text-[12px] font-semibold uppercase tracking-[0.08em] transition-all duration-300 hover:bg-[#E8A87C] hover:-translate-y-0.5 disabled:opacity-45 disabled:hover:translate-y-0"
              disabled={items.length === 0}
            >
              Proceed to checkout
            </button>

            <Link
              href="/collections"
              className="mt-3 w-full inline-flex items-center justify-center no-underline border border-white/20 text-white py-3 rounded-3xl text-[12px] font-medium uppercase tracking-[0.08em] transition-all duration-300 hover:border-[#E8A87C] hover:text-[#E8A87C]"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      </section>
    </>
  )
}
