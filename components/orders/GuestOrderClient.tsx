'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { lookupGuestOrder, recoverGuestOrders, type GuestOrderView } from '@/lib/auth/api'
import { isPlausibleEmail, tokenFromHash } from '@/lib/guestToken'
import { formatDate, formatPrice, OrderStatusBadge, PaymentStatusBadge } from './OrderDetailClient'

// Per tab, so a refresh still works after the token is stripped from the address bar.
const TOKEN_KEY = 'guest-order-token'

type ViewState =
  | { status: 'loading' }
  | { status: 'ready'; order: GuestOrderView }
  | { status: 'invalid' }

/** Reads #t=…, strips it from the URL and history, then shows the order it unlocks. */
function readToken(): string | null {
  const fromHash = tokenFromHash(window.location.hash)
  try {
    if (fromHash) {
      window.history.replaceState(null, '', window.location.pathname)
      sessionStorage.setItem(TOKEN_KEY, fromHash)
      return fromHash
    }
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    // Storage blocked (private mode): the link still works, only a refresh won't.
    return fromHash
  }
}

export default function GuestOrderClient() {
  const [view, setView] = useState<ViewState>({ status: 'loading' })

  useEffect(() => {
    const token = readToken()
    if (!token) {
      setView({ status: 'invalid' })
      return
    }
    lookupGuestOrder(token)
      .then(res => setView({ status: 'ready', order: res.order }))
      .catch(() => setView({ status: 'invalid' }))
  }, [])

  if (view.status === 'loading') {
    return (
      <div className="pt-header bg-[#EDE8E0] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (view.status === 'invalid') {
    return (
      <div className="pt-header bg-[#EDE8E0]">
      <section className="min-h-[70vh] px-4 md:px-12 py-12 md:py-16">
        <div className="max-w-[640px] mx-auto bg-white rounded-[24px] border border-[#D8D0C4] p-6 md:p-10">
          <h1 className="font-serif text-[clamp(28px,3vw,40px)] leading-[1.1] text-[#2C2825]">Find your orders</h1>
          <p className="text-[14px] text-[#6B6158] mt-3">
            This order link is invalid or no longer active. Enter the email you checked out with and
            we&apos;ll send you fresh links to your orders.
          </p>
          <RecoverOrdersForm />
          <p className="text-[13px] text-[#A09488] mt-6">
            Have an account? <Link href="/orders" className="text-[#8B5E3C] underline underline-offset-2">Sign in to see every order</Link>.
            Still stuck? <Link href="/contact" className="text-[#8B5E3C] underline underline-offset-2">Contact us</Link>.
          </p>
        </div>
      </section>
      </div>
    )
  }

  const { order } = view
  const discount = parseFloat(order.discountTotal ?? '0')
  const shipTo = [order.shipTo.city, order.shipTo.state].filter(Boolean).join(', ')

  return (
    <div className="pt-header bg-[#EDE8E0]">
    <section className="min-h-[70vh] px-4 md:px-12 py-8 md:py-12">
      <div className="max-w-[900px] mx-auto space-y-6">
        <div className="bg-white rounded-[24px] border border-[#D8D0C4] p-5 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-[clamp(28px,3vw,42px)] leading-[1.1] text-[#2C2825]">Order #{order.id}</h1>
              <p className="text-[13px] text-[#A09488] mt-1">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <OrderStatusBadge status={order.status} />
              {order.payment && <PaymentStatusBadge status={order.payment.status} />}
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-[#D8D0C4] grid gap-4 sm:grid-cols-2 text-[13.5px] text-[#2C2825]">
            {shipTo && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A09488] mb-1">Delivering to</p>
                <p>{shipTo}</p>
              </div>
            )}
            {order.emailMasked && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A09488] mb-1">Receipt sent to</p>
                <p>{order.emailMasked}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-[#D8D0C4] overflow-hidden">
          <div className="px-5 md:px-8 py-4 border-b border-[#D8D0C4] bg-[#FAF7F2]">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A09488]">Order Items</h2>
          </div>
          <ul className="divide-y divide-[#D8D0C4]">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center gap-4 p-5 md:px-8">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#E2DAD0] flex-shrink-0">
                  {item.image ? (
                    <Image src={item.image} alt={item.name ?? ''} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#A09488] text-[10px]">No image</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#2C2825]">{item.name ?? 'Product'}</p>
                  {item.variationName && <p className="text-[12px] text-[#A09488] mt-0.5">{item.variationName}</p>}
                  <p className="text-[12px] text-[#A09488] mt-0.5">Qty: {item.quantity}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[12px] text-[#A09488]">
                    {item.mrp && parseFloat(item.mrp) > parseFloat(item.price) && (
                      <span className="mr-1.5 line-through">{formatPrice(item.mrp)}</span>
                    )}
                    {formatPrice(item.price)} each
                  </p>
                  <p className="text-[15px] font-medium text-[#2C2825]">{formatPrice(item.total)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-[24px] border border-[#D8D0C4] p-5 md:p-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A09488] mb-4">Order Total</h2>
          <div className="space-y-2 text-[13px]">
            {discount > 0 && (
              <>
                <div className="flex justify-between text-[#A09488]">
                  <span>Item total</span><span>{formatPrice(order.listSubtotal ?? '0')}</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span>Discount{order.couponCode ? ` (code ${order.couponCode})` : ''}</span>
                  <span>−{formatPrice(order.discountTotal ?? '0')}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-[#A09488]">
              <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
            </div>
            {parseFloat(order.courierCharges ?? '0') > 0 && (
              <div className="flex justify-between text-[#A09488]">
                <span>Shipping</span><span>{formatPrice(order.courierCharges)}</span>
              </div>
            )}
            {parseFloat(order.gstAmount ?? '0') > 0 && (
              <div className="flex justify-between text-[#A09488]">
                <span>GST</span><span>{formatPrice(order.gstAmount)}</span>
              </div>
            )}
            <div className="h-px bg-[#D8D0C4]" />
            <div className="flex justify-between text-[16px] font-medium text-[#2C2825]">
              <span>Total</span><span>{formatPrice(order.finalTotal)}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#FAF7F2] rounded-[24px] border border-dashed border-[#C9A84C] p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[13.5px] text-[#6B6158] max-w-[520px]">
            Keep the link from your confirmation email to come back to this order. Create an account with the
            same email to keep every order in one place.
          </p>
          <Link href="/signup" className="inline-flex items-center h-11 px-6 rounded-full border border-[#2C2825] text-[#2C2825] text-[12px] font-semibold uppercase tracking-[0.12em] hover:bg-[#2C2825] hover:text-white transition-colors">
            Create account
          </Link>
        </div>
      </div>
    </section>
    </div>
  )
}

type RecoverState = { status: 'idle' | 'sending' } | { status: 'sent' | 'error'; message: string }

/** Same reply whether or not the email has orders: the backend never says which. */
function RecoverOrdersForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<RecoverState>({ status: 'idle' })

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const value = email.trim()
    if (!isPlausibleEmail(value)) {
      setState({ status: 'error', message: 'Please enter a valid email address.' })
      return
    }
    setState({ status: 'sending' })
    try {
      const res = await recoverGuestOrders(value)
      setState({ status: 'sent', message: res.message })
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string }
      setState({
        status: 'error',
        message: apiErr.status === 404
          ? "This isn't available right now. Please contact us and we'll help."
          : apiErr.message ?? 'Something went wrong. Please try again.',
      })
    }
  }

  if (state.status === 'sent') {
    return (
      <p role="status" className="mt-6 rounded-xl bg-[#FAF7F2] border border-[#D8D0C4] px-4 py-3 text-[14px] text-[#2C2825]">
        {state.message} Check your inbox, and the spam folder too.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col sm:flex-row gap-3" noValidate>
      <label htmlFor="recover-email" className="sr-only">Email</label>
      <input
        id="recover-email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com"
        disabled={state.status === 'sending'}
        aria-invalid={state.status === 'error'}
        aria-describedby={state.status === 'error' ? 'recover-error' : undefined}
        className="flex-1 h-11 px-4 rounded-full border border-[#D8D0C4] bg-white text-[14px] text-[#2C2825] placeholder-[#C4B8AC] focus:outline-none focus:border-[#C9A84C] disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={state.status === 'sending'}
        className="h-11 px-6 rounded-full bg-[#2C2825] text-white text-[12px] font-semibold uppercase tracking-[0.12em] hover:bg-[#8B5E3C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84C] disabled:opacity-50 transition-colors"
      >
        {state.status === 'sending' ? 'Sending…' : 'Email me my orders'}
      </button>
      {state.status === 'error' && (
        <p id="recover-error" role="alert" className="sm:basis-full text-[13px] text-red-700">{state.message}</p>
      )}
    </form>
  )
}
